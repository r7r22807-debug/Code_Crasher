const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('all live categories supply five playable decks with safe artwork and persistent depletion',()=>{
 const html=fs.readFileSync('index.html','utf8');
 const bank=JSON.parse(html.match(/id="bank"[^>]*>(.*?)<\/script>/s)[1]);
 const ctx=vm.createContext({...bank,localStorage:{setItem(k,v){this.saved=JSON.parse(v)}},key:'test',render(){},alert(){}});
 vm.runInContext(fs.readFileSync('difficulty.js','utf8')+fs.readFileSync('pool-content.js','utf8')+fs.readFileSync('question-art.js','utf8'),ctx);
 vm.runInContext('let game; questions=balancedBank({categories,questions});',ctx);
 for(const c of bank.categories){
  ctx.cat=c;
  const rows=vm.runInContext('questions.filter(q=>q.categoryId===cat.id)',ctx);
  assert.equal(rows.length,30,c.id);
  for(let i=0;i<30;i++){
   const q=rows[i]; assert.ok(q.answer&&q.text,c.id);assert.equal(q.points,[200,200,400,400,600,600][i%6]);
   ctx.q=q;const src=vm.runInContext('questionArt(q,cat)',ctx).match(/src="(question-media\/[a-z]+-(?:pool-)?[0-9]+\.jpg)"/); assert.ok(src && fs.existsSync(src[1]),q.id);
   assert.equal(q.difficulty,['easy','medium','hard'][Math.floor(i%6/2)]);
   if(q.type==='multiple'){assert.ok(q.options.includes(q.answer));assert.equal(new Set(q.options).size,4);}
   else if(q.points===600&&q.type!=='charades')assert.ok(q.followUp.prompt&&q.followUp.answer,q.id);
   assert.equal(new Set(rows.map(r=>r.id)).size,30,c.id);
  }
 }
 ctx.match={cats:bank.categories.slice(0,6).map(c=>c.id)};
 const ids=new Set();
 for(let i=0;i<5;i++){
  assert.equal(vm.runInContext('reserveMatch(match)',ctx),true);
  assert.equal(ctx.localStorage.saved.match.deck.length,36);
  for(const q of ctx.localStorage.saved.match.deck){assert.ok(!ids.has(q.id));ids.add(q.id)}
 }
 assert.equal(vm.runInContext('reserveMatch(match)',ctx),false);
});
test('every question has a distinct sourced JPEG and identity clues reveal the full frame only on answer',()=>{
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
