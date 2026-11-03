'use strict';
const {test, before, after} = require('node:test');
const assert = require('node:assert/strict');
const {mkdtempDisposableSync} = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {randomBytes} = require('node:crypto');
const {execFileSync} = require('node:child_process');

let temp, server, db, origin, admin;
function browser() {
  let cookie = '';
  async function request(route, data, extraHeaders = {}) {
    const response = await fetch(origin + route, {
      method:data === undefined ? 'GET' : 'POST',
      headers:{'Content-Type':'application/json', ...(cookie ? {cookie} : {}), ...extraHeaders},
      body:data === undefined ? undefined : JSON.stringify(data)
    });
    if (response.headers.has('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
    const value = await response.json();
    return {status:response.status, value, headers:response.headers};
  }
  async function ok(route, data) {
    const {status,value} = await request(route,data);
    assert.equal(status,200,route+' '+JSON.stringify(value.error));
    return value;
  }
  return {request,ok};
}
function config(categories) {
  return {teams:[0,1].map((i)=>({
    name:['البرق','الرعد'][i],players:[['فهد','ريما'][i]],
    categories:categories.slice(i*3,i*3+3).map(c=>c.id),powers:['call','two','pit']
  }))};
}
before(async () => {
  temp=mkdtempDisposableSync(path.join(os.tmpdir(),'trivia-http-test-'));
  process.env.TRIVIA_DATA=temp.path;
  server=require('./server');
  db=require('./db').db;
  await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));
  origin='http://127.0.0.1:'+server.address().port;
  admin=browser();
  await admin.ok('/api/register',{username:'مدير الاختبار',password:randomBytes(24).toString('hex')});
  execFileSync(process.execPath,[path.join(__dirname,'scripts','admin.js'),'مدير الاختبار'],{env:process.env,stdio:'pipe'});
});
after(async () => {
  if(server?.listening) await new Promise(resolve=>server.close(resolve));
  db?.close();
  temp?.remove();
});

test('guest access, account upgrade, cookie rotation, logout, saved names and match ownership', async () => {
  const host=browser(), guest=browser();
  const bootstrap=await host.request('/api/bootstrap');
  assert.equal(bootstrap.value.user.guest,true);
  assert.match(bootstrap.headers.get('set-cookie'),/HttpOnly/);
  assert.match(bootstrap.headers.get('set-cookie'),/SameSite=Strict/);
  assert.ok(bootstrap.value.categories.length>=15);
  assert.ok(bootstrap.value.categories.every(c=>c.count>=6));
  assert.equal((await host.request('/api/admin/dashboard')).status,403);
  assert.equal((await host.request('/api/admin/delete',{entity:'Category',id:'guess'})).status,403);
  const {categories,user}=bootstrap.value, data=config(categories);
  const g=await host.ok('/api/games',data), route='/api/games/'+g.id;
  assert.equal(g.board.length,36);
  assert.ok(!g.board.some(t=>t.question));
  assert.equal((await guest.request(route)).status,401);
  await guest.ok('/api/bootstrap');
  assert.equal((await guest.request(route)).status,404);
  assert.equal((await guest.request(route+'/action',{type:'select',id:g.board[0].id,version:g.version})).status,404);
  assert.equal((await guest.request('/api/report',{gameId:g.id,questionId:g.board[0].id,message:'بلاغ'})).status,400);
  assert.equal((await host.request('/api/favorites',{ids:[categories[0].id]},{Origin:'https://cross-site.invalid'})).status,403);
  await host.ok('/api/favorites',{ids:[categories[0].id]});
  const creds={username:'المقدم',password:randomBytes(20).toString('hex')};
  const account=await host.request('/api/register',creds);
  assert.equal(account.status,200);
  assert.notEqual(account.headers.get('set-cookie'),bootstrap.headers.get('set-cookie'));
  let accountState=await host.ok('/api/bootstrap');
  assert.equal(accountState.user.id,user.id);
  assert.equal(accountState.user.guest,false);
  assert.equal(accountState.history[0].id,g.id);
  assert.deepEqual(accountState.teamNames,data.teams.map(t=>t.name));
  assert.deepEqual(accountState.favorites,[categories[0].id]);
  assert.equal((await host.request('/api/admin/dashboard')).status,403);
  await host.ok('/api/logout',{});
  assert.equal((await host.request(route)).status,401);
  assert.equal((await host.request('/api/login',{...creds,password:'invalid-test-password'})).status,401);
  await host.ok('/api/login',creds);
  assert.equal((await host.ok(route)).id,g.id);
  const stored=db.prepare('SELECT password FROM User WHERE id=?').get(user.id).password;
  assert.notEqual(stored,creds.password);
  assert.match(stored,/^[a-f0-9]+:[a-f0-9]{128}$/);
});

test('admin import is atomic, uploaded media is validated, retrievable and supports byte ranges', async () => {
  const before=await admin.ok('/api/admin/dashboard');
  const candidate={...before.questions[0],id:'integration-import',text:'ما العدد الذي يلي سبعة؟',answer:'ثمانية'};
  assert.equal((await admin.request('/api/admin/import',{questions:[candidate,{...candidate,id:'bad-import',answer:''}]})).status,400);
  const rolledBack=await admin.ok('/api/admin/dashboard');
  assert.equal(rolledBack.questions.some(q=>q.id===candidate.id),false);
  assert.equal(rolledBack.audit.length,before.audit.length);
  await admin.ok('/api/admin/import',{questions:[candidate]});
  const added=await admin.ok('/api/admin/dashboard');
  assert.ok(added.questions.some(q=>q.id===candidate.id));
  assert.ok(added.audit.some(e=>e.operation==='import'));
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+p+XcAAAAASUVORK5CYII=','base64');
  assert.equal((await admin.request('/api/admin/media',{mime:'image/png',base64:Buffer.from('<script>alert(1)</script>').toString('base64')})).status,400);
  assert.equal((await admin.request('/api/admin/media',{mime:'video/mp4',base64:png.toString('base64')})).status,400);
  const media=await admin.ok('/api/admin/media',{mime:'image/png',base64:png.toString('base64')});
  const file=await fetch(origin+media.url), part=await fetch(origin+media.url,{headers:{Range:'bytes=2-6'}});
  assert.equal(file.headers.get('Content-Type'),'image/png');
  assert.deepEqual(Buffer.from(await file.arrayBuffer()),png);
  assert.equal(part.status,206);
  assert.deepEqual(Buffer.from(await part.arrayBuffer()),png.subarray(2,7));
  await admin.ok('/api/admin/question',{...candidate,type:'image',media:[{url:media.url,alt:'شكل'}]});
  const bad=await admin.request('/api/admin/question',{...candidate,media:[{url:'https://example.invalid/a.svg'}]});
  assert.equal(bad.status,400);
  await admin.ok('/api/admin/delete',{id:candidate.id,entity:'Question'});
});

test('HTTP session plays 36 questions with immutable snapshots, concurrent actions, refresh and durable audit', async () => {
  const host=browser();
  const info=await host.ok('/api/bootstrap');
  let g=await host.ok('/api/games',config(info.categories));
  const route='/api/games/'+g.id;
  async function move(type, fields={}) {
    g=await host.ok(route+'/action',{type,version:g.version,...fields});
  }
  const ids=g.board.map(t=>t.id);
  const original=(await admin.ok('/api/admin/dashboard')).questions.find(q=>q.id===ids[0]);
  await admin.ok('/api/admin/question',{...original,answer:'إجابة معدلة بعد بدء المباراة',text:'سؤال معدل بعد بدء المباراة'});
  for(const [index,id] of ids.entries()) {
    await move('select',{id});
    await move('reveal');
    assert.equal(g.board[index].question.answer,undefined);
    if(index===0) {
      assert.equal(g.board[0].question.text,original.text);
      await move('timer');
      const refreshed=await host.ok(route);
      assert.equal(refreshed.current.remainingMs,g.current.remainingMs);
      assert.equal(refreshed.current.deadline,null);
      await move('answer');
      assert.equal(g.board[0].question.answer,original.answer);
      const same={type:'correct',version:g.version};
      const clash=await Promise.all([host.request(route+'/action',same),host.request(route+'/action',same)]);
      assert.deepEqual(clash.map(x=>x.status).sort(),[200,409]);
      g=await host.ok(route);
      assert.equal(g.teams[0].score,200);
      await move('undo');
      assert.equal(g.teams[0].score,0);
      assert.equal(g.attempts.length,0);
      await host.ok('/api/report',{gameId:g.id,questionId:id,message:'تدقيق صياغة السؤال'});
    }
    if(g.turn===1) await move('incorrect');
    await move('correct');
    assert.equal(g.phase,'resolved');
    assert.equal((await host.request(route+'/action',{type:'correct',version:g.version})).status,400);
    await move('next');
    assert.equal((await host.request(route+'/action',{type:'select',id,version:g.version})).status,400);
  }
  g=await host.ok(route);
  assert.equal(g.phase,'complete');
  assert.equal(g.winner,0);
  assert.deepEqual(g.teams.map(t=>t.score),[14400,0]);
  assert.equal(g.attempts.length,54);
  assert.ok(g.board.every(t=>t.status==='done'));
  assert.ok((await host.ok('/api/bootstrap')).history.some(h=>h.id===g.id&&h.phase==='complete'));
  assert.equal(db.prepare('SELECT count(*) n FROM QuestionAttempt WHERE gameId=?').get(g.id).n,54);
  assert.equal(db.prepare('SELECT count(*) n FROM GameEvent WHERE gameId=?').get(g.id).n,g.version);
  const dash=await admin.ok('/api/admin/dashboard');
  const report=dash.reports.find(r=>r.gameId===g.id);
  assert.equal(report.question,original.text);
  await admin.ok('/api/admin/report',{id:report.id,resolved:true});
  assert.ok(dash.stats.completed>=1);
});
