const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('all live categories supply five playable decks with safe artwork and persistent depletion',()=>{
 const html=fs.readFileSync('index.html','utf8');
 const bank=JSON.parse(html.match(/id="bank"[^>]*>(.*?)<\/script>/s)[1]);
 const ctx=vm.createContext({...bank,localStorage:{setItem(k,v){this.saved=JSON.parse(v)}},key:'test',render(){},alert(){}});
 vm.runInContext(fs.readFileSync('difficulty.js','utf8')+fs.readFileSync('refreshed-content.js','utf8')+fs.readFileSync('pool-content.js','utf8')+fs.readFileSync('question-art.js','utf8'),ctx);
 vm.runInContext('let game; questions=balancedBank({categories,questions});',ctx);
 for(const c of bank.categories){
  ctx.cat=c;
  const rows=vm.runInContext('questions.filter(q=>q.categoryId===cat.id)',ctx);
  assert.equal(rows.length,30,c.id);
  assert.equal(new Set(rows.map(q=>q.type==='charades'?q.answer:q.text)).size,30,c.id);
  for(let i=0;i<30;i++){
   const q=rows[i]; assert.ok(q.answer&&q.text,c.id);assert.equal(q.points,[200,200,400,400,600,600][i%6]);
   ctx.q=q;const src=vm.runInContext('questionArt(q,cat)',ctx).match(/src="((?:question-media|question-photos)\/[a-z0-9-]+\.jpg)"/); assert.ok(src && fs.existsSync(src[1]),q.id);
   assert.equal(q.difficulty,['easy','medium','hard'][Math.floor(i%6/2)]);
   assert.equal(q.pool,Math.floor(i/6));
   assert.equal(vm.runInContext('questionArt(q,cat)',ctx),vm.runInContext('questionArt(q,cat,true)',ctx));
   if(q.type==='multiple'){assert.ok(q.options.includes(q.answer));assert.equal(new Set(q.options).size,4);}
   assert.ok(!q.followUp,q.id);
   assert.equal(new Set(rows.map(r=>r.id)).size,30,c.id);
  }
 }
 ctx.match={cats:bank.categories.map(c=>c.id)};
 const ids=new Set();
 for(let i=0;i<5;i++){
  assert.equal(vm.runInContext('reserveMatch(match)',ctx),true);
  assert.equal(ctx.localStorage.saved.match.deck.length,bank.categories.length*6);
  assert.equal(ctx.localStorage.saved.version,3);
  for(const q of ctx.localStorage.saved.match.deck){assert.ok(!ids.has(q.id));ids.add(q.id)}
 }
 assert.equal(vm.runInContext('reserveMatch(match)',ctx),false);
 assert.equal(ids.size,1020);
});
test('archived media stays intact for saved legacy matches',()=>{
 const photos=JSON.parse(fs.readFileSync('question-media/sources.json'));
 const hashes=new Set();
 const crypto=require('node:crypto');
 for(const [id,photo] of Object.entries(photos)){
  const bytes=fs.readFileSync('question-media/'+id+'.jpg');
  assert.equal(bytes.readUInt16BE(0),0xffd8,id);
  const hash=crypto.createHash('sha256').update(bytes).digest('hex');
  assert.equal(hash,photo.hash,id);assert.ok(!hashes.has(hash),id);hashes.add(hash);
 }
 assert.equal(hashes.size,1020);
 const ctx=vm.createContext({q:{id:'whonin-3',type:'text'},cat:{id:'whonin'}});
 vm.runInContext(fs.readFileSync('question-art.js','utf8'),ctx);
 assert.match(vm.runInContext('questionArt(q,cat)',ctx),/sandScene/);
 assert.doesNotMatch(vm.runInContext('questionArt(q,cat,true)',ctx),/clueCrop/);
 assert.match(photos['whonin-3'].source,/naruto-official/);
});
function quickContext(saved){
 const html=fs.readFileSync('index.html','utf8'),bank=html.match(/id="bank"[^>]*>(.*?)<\/script>/s)[1];
 const app={innerHTML:'',addEventListener(){}},storage={value:saved,getItem(k){return k==='quick-arabic-match-v1'?JSON.stringify(this.value):null},setItem(k,v){this.value=JSON.parse(v)}};
 const ctx=vm.createContext({document:{getElementById(id){return id==='bank'?{textContent:bank}:id==='app'?app:null},body:{classList:{toggle(){}}}},localStorage:storage,setInterval(){},alert(){},poster(){return ''},teamsForm(){return ''},aidIcon(){return ''}});
 for(const file of ['difficulty.js','refreshed-content.js','pool-content.js','question-art.js','question-view.js','quick-game.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
 return {ctx,app,storage};
}
test('new match renders 36 playable buttons, conceals answers, and finishes at 36',()=>{
 const {ctx,app,storage}=quickContext();
 vm.runInContext(`reserveMatch({cats:['ahl','naruto','whopirate','bean','money','capitals'],names:['أ','ب'],aids:[[],[]],spent:[[],[]],scores:[0,0],turn:0,used:[]})`,ctx);
 assert.equal(storage.value.match.deck.length,36);
 assert.equal((app.innerHTML.match(/data-action="pick:/g)||[]).length,36);
 assert.equal((app.innerHTML.match(/class="scoreLeft game-text"/g)||[]).length,18);
 assert.equal((app.innerHTML.match(/class="scoreRight game-text"/g)||[]).length,18);
 assert.match(app.innerHTML,/36 \/ 36/);
 vm.runInContext(`game.current=game.deck[0].id;game.actor=0;game.questionStage='question';game.until=Date.now()+60000;render()`,ctx);
 assert.ok(!app.innerHTML.includes(storage.value.match.deck[0].answer));
 assert.match(app.innerHTML,/<img class="questionScene"/);
 vm.runInContext(`game.questionStage='answer';render()`,ctx);
 assert.ok(app.innerHTML.includes(storage.value.match.deck[0].answer));
 vm.runInContext(`game.current=null;game.used=game.deck.map(q=>q.id);render()`,ctx);
 assert.match(app.innerHTML,/36 \/ 36/);
 assert.match(app.innerHTML,/resultStage/);
});
test('refresh keeps new pool depletion; an old save retains its match and gets five fresh pools',()=>{
 const legacy={version:2,pools:{naruto:5},match:{deck:Array.from({length:36},(_,i)=>({id:'old'+i})),cats:['naruto'],names:['أ','ب'],scores:[0,0],used:[],away:true}};
 const old=quickContext(legacy);
 assert.equal(vm.runInContext('poolCount("naruto",readPoolCounts())',old.ctx),5);
 assert.equal(vm.runInContext('matchQuestionCount()',old.ctx),36);
 const fresh=quickContext({version:3,pools:{naruto:3},match:null});
 assert.equal(vm.runInContext('poolCount("naruto",readPoolCounts())',fresh.ctx),2);
});
test('failed persistence does not consume a pool',()=>{
 const {ctx,storage}=quickContext();storage.setItem=()=>{throw Error('quota')};
 assert.equal(vm.runInContext(`reserveMatch({cats:['naruto']})`,ctx),false);
 assert.equal(vm.runInContext('poolCount("naruto",readPoolCounts())',ctx),5);
});
test('an existing 18-question match gains the opposite column without losing progress',()=>{
 const initial=quickContext();
 const match=vm.runInContext(`({cats:['ahl','naruto','whopirate','bean','money','capitals'],names:['أ','ب'],scores:[400,200],aids:[[],[]],spent:[[],[]],turn:1,used:['ahl-v3-0'],current:'naruto-v3-1',away:true,deck:questions.filter(q=>['ahl','naruto','whopirate','bean','money','capitals'].includes(q.categoryId)&&q.pool===0&&q.id.includes('-v3-'))})`,initial.ctx);
 assert.equal(match.deck.length,18);
 const restored=quickContext({version:3,pools:{naruto:1},match});
 assert.equal(vm.runInContext('game.deck.length',restored.ctx),36);
 assert.equal(vm.runInContext('game.current',restored.ctx),'naruto-v3-1');
 assert.equal(vm.runInContext('game.used.join()',restored.ctx),'ahl-v3-0');
 assert.equal(vm.runInContext('game.scores.join()',restored.ctx),'400,200');
 assert.equal(vm.runInContext('poolCount("naruto",readPoolCounts())',restored.ctx),4);
 vm.runInContext('loadMatchBank()',restored.ctx);
 assert.equal(vm.runInContext('game.deck.length',restored.ctx),36);
});
