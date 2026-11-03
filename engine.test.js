'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createGame, act, publicGame, validateSettings, distributePlayers } = require('./engine');

const categories = Array.from({length: 6}, (_, i) => ({id:'c'+i, name:'فئة '+i, status:'published'}));
const points = [200,200,400,400,600,600];
const questions = categories.flatMap(c => points.map((p,i) => ({
  id:c.id+'q'+i, categoryId:c.id, points:p, text:'سؤال '+i, answer:'الإجابة',
  alternatives:['بديل'], explanation:'شرح', yearTolerance:1, status:'published'
})));
function setup(powers=['call','two','pit'], other=['call','two','break']) {
  return {teams:[{name:'نجوم',players:['علي'],categories:['c0','c1','c2'],powers},
    {name:'أبطال',players:['نور'],categories:['c3','c4','c5'],powers:other}]};
}
function game(config=setup(), settings={}) {
  return createGame(config, categories, questions, settings, 0);
}
function move(g, type, fields={}, now=0) { return act(g, {type,...fields}, now); }
function select(g) { return move(g,'select',{id:g.board.find(q=>q.status==='open').id}); }
function open(g) { return move(select(g),'reveal'); }
function scores(g) { return g.teams.map(t=>t.score); }

test('validates counts, unique categories, available content and powers; snapshots the original bank', () => {
  const config=setup(), g=game(config);
  assert.equal(g.board.length,36);
  assert.equal(new Set(g.board.map(t=>t.id)).size,36);
  assert.equal(g.categories.length,6);
  assert.deepEqual(g.board.slice(0,6).map(t=>t.points),points);
  const source=questions.find(q=>q.id===g.board[0].id);
  assert.notEqual(source,g.board[0].question);
  const changes=[
    c=>c.teams.pop(), c=>c.teams[0].categories.pop(),
    c=>c.teams[1].categories[0]='c0', c=>c.teams[0].categories[0]='none',
    c=>c.teams[0].name=' ', c=>c.teams[0].players=[{}],
    c=>c.teams[0].powers=['pit','pit','call'], c=>c.teams[1].powers=['new','call','two']
  ];
  for(const change of changes){const c=setup(); change(c); assert.throws(()=>game(c));}
  assert.throws(()=>createGame(config,categories,questions.slice(1)));
  assert.throws(()=>createGame(config,categories,questions.map((q,i)=>i?q:{...q,status:'draft'})));
  assert.throws(()=>createGame(config,categories,questions,{enabledPowers:['pit','call','two']}));
  assert.deepEqual(game(config,{points:[1,2,3,4,5,6]}).board.slice(0,6).map(t=>t.points),[1,2,3,4,5,6]);
  assert.throws(()=>validateSettings({points:[1]}));
  assert.throws(()=>validateSettings({opponentSeconds:0}));
  assert.throws(()=>validateSettings({negativeScores:'false'}));
  const extra={...questions[0],id:'new'};
  const fresh=createGame({...config,seenQuestionIds:questions.map(q=>q.id)},categories,[...questions,extra]);
  assert.ok(fresh.board.some(t=>t.id==='new'));
});
test('random rosters conserve all players and balance odd counts', () => {
  const players=['أ','ب','ج','د','هـ'];
  const split=distributePlayers(players);
  assert.equal(split[0].length,3);
  assert.equal(split[1].length,2);
  assert.deepEqual(split.flat().sort(),[...players].sort());
  assert.throws(()=>distributePlayers(['أ']));
});
test('projection hides answer, explanation, variants, unrevealed text and history snapshots', () => {
  let g=select(game());
  assert.ok(!('question' in publicGame(g).board[0]));
  assert.ok(!('_undo' in publicGame(g)));
  g=move(g,'reveal');
  assert.equal(publicGame(g).board[0].question.text,g.board[0].question.text);
  for(const key of ['answer','alternatives','explanation','yearTolerance'])
    assert.ok(!(key in publicGame(g).board[0].question));
  g=move(g,'answer');
  assert.equal(publicGame(g).board[0].question.yearTolerance,1);
  assert.equal(g.current.deadline,null);
  g=move(g,'incorrect');
  assert.equal(g.phase,'resolved'); // showing the key to both teams consumes the steal
});
test('full 36-question match alternates turns, rejects duplicate scoring and selects winner', () => {
  let g=game();
  for(let i=0;i<36;i++) {
    const tile=g.board[i];
    g=move(g,'select',{id:tile.id});
    assert.equal(g.turn,i%2);
    g=move(g,'reveal');
    if(g.turn===0) g=move(g,'correct');
    else { g=move(g,'incorrect'); assert.equal(g.phase,'opponent'); g=move(g,'correct'); }
    assert.equal(g.current.result.winner,0);
    assert.throws(()=>move(g,'correct'));
    g=move(g,'next');
    assert.throws(()=>move(g,'select',{id:tile.id}));
  }
  assert.equal(g.phase,'complete'); assert.equal(g.winner,0);
  assert.deepEqual(scores(g),[14400,0]);
  assert.equal(g.attempts.length,54); assert.equal(g.events.filter(e=>e.type==='score').length,36);
  const last=move(g,'undo');
  assert.equal(last.phase,'resolved'); assert.equal(last.endedAt,null);
  assert.deepEqual(scores(move(last,'next')),[14400,0]);
});
test('every question can finish unanswered in a tie; manual correction and undo recompute winner', () => {
  let g=game(setup(),{allowSteal:false});
  for(let i=0;i<36;i++) g=move(move(open(g),'incorrect'),'next');
  assert.equal(g.phase,'complete'); assert.equal(g.winner,null);
  const edited=move(g,'adjust',{team:1,delta:10,reason:'تصحيح الحكم'});
  assert.equal(edited.winner,1);
  const restored=move(edited,'undo');
  assert.equal(restored.winner,null); assert.deepEqual(scores(restored),[0,0]);
});
test('60/10 second deadlines survive refresh; stale click cannot score another responder', () => {
  let g=open(game());
  assert.equal(g.current.deadline,60000);
  assert.strictEqual(move(g,'sync',{},59999),g);
  assert.throws(()=>move(g,'timeout',{},59999));
  g=JSON.parse(JSON.stringify(g));
  g=move(g,'correct',{},60000);
  assert.equal(g.phase,'opponent'); assert.equal(g.current.actor,1);
  assert.equal(g.current.deadline,70000);
  g=move(g,'sync',{},70000);
  assert.deepEqual(g.attempts.map(a=>a.outcome),['timeout','timeout']);
  assert.deepEqual(scores(g),[0,0]);
  const restored=move(g,'undo',{},71000);
  assert.equal(restored.current.deadline,null);
  assert.equal(restored.attempts.length,1);
  assert.equal(move(restored,'correct',{},71000).teams[1].score,200);
});
test('pause/resume preserves remaining duration and turn ownership follows settings', () => {
  let g=open(game(setup(),{activeSeconds:20,nextTurn:'retain'}));
  g=move(g,'timer',{},5000);
  assert.equal(g.current.deadline,null);
  assert.equal(g.current.remainingMs,15000);
  g=move(g,'timer',{},45000);
  assert.equal(g.current.deadline,60000);
  assert.equal(move(move(g,'correct',{},50000),'next',{},50000).turn,0);
  g=open(game(setup(),{nextTurn:'winner'}));
  g=move(move(move(g,'pass'),'correct'),'next');
  assert.equal(g.turn,1);
});
test('pit is pre-reveal only and applies full swing only to the configured winner', () => {
  let g=select(game());
  assert.throws(()=>move(g,'power',{power:'two'}));
  const armed=move(g,'power',{power:'pit'});
  assert.deepEqual(armed.teams[0].used,['pit']);
  assert.throws(()=>move(armed,'power',{power:'pit'}));
  assert.deepEqual(scores(move(move(armed,'reveal'),'correct')),[200,-200]);
  let stolen=move(move(move(armed,'reveal'),'incorrect'),'correct');
  assert.deepEqual(scores(stolen),[0,200]);
  g=select(game(setup(),{pitOnSteal:true}));
  stolen=move(move(move(move(g,'power',{power:'pit'}),'reveal'),'incorrect'),'correct');
  assert.deepEqual(scores(stolen),[-200,200]);
  assert.throws(()=>move(open(game()),'power',{power:'pit'}));
  g=select(game(setup(),{negativeScores:false}));
  g=move(move(move(g,'power',{power:'pit'}),'reveal'),'correct');
  assert.deepEqual(g.current.result.deltas,[200,0]);
});
test('call bonus and two answers require host judgment; undo restores power and timer', () => {
  let g=open(game(setup(),{callSeconds:30}));
  const spent=move(g,'power',{power:'call'},1000);
  assert.equal(spent.current.deadline,90000);
  assert.equal(spent.phase,'answering'); assert.deepEqual(scores(spent),[0,0]);
  assert.throws(()=>move(spent,'power',{power:'call'}));
  g=move(spent,'undo',{},11000);
  assert.equal(g.current.deadline,70000);
  assert.deepEqual(g.teams[0].used,[]);
  assert.ok(g.events.some(e=>e.type==='power' && e.power==='call'));
  assert.throws(()=>move(g,'power',{power:'trap'}));
  g=move(move(g,'power',{power:'two'}),'correct');
  assert.equal(g.teams[0].score,200);
});
test('break identifies the opposing player then clears; trap passes and resolves all outcomes', () => {
  const config=setup(['break','trap','call'],['break','trap','pit']);
  let g=open(game(config));
  assert.throws(()=>move(g,'power',{power:'break',player:'علي'}));
  g=move(g,'power',{power:'break',player:'نور'});
  assert.equal(g.current.restrictedPlayer,'نور');
  const trapped=move(g,'power',{power:'trap'});
  assert.equal(trapped.current.actor,1);
  assert.throws(()=>move(trapped,'power',{power:'trap'}));
  const lost=move(trapped,'incorrect');
  assert.deepEqual(scores(lost),[0,-200]); assert.equal(lost.current.restrictedPlayer,null);
  assert.deepEqual(scores(move(trapped,'correct')),[0,200]);
  assert.deepEqual(scores(move(trapped,'timeout',{},10000)),[0,-200]);
  g=open(game(config,{trapTimeoutPenalty:false,trapCorrectScores:false}));
  g=move(g,'power',{power:'trap'});
  assert.deepEqual(scores(move(g,'correct')),[0,0]);
  assert.deepEqual(scores(move(g,'timeout',{},10000)),[0,0]);
});
