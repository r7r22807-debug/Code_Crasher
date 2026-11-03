'use strict';
const http=require('node:http'), fs=require('node:fs'), path=require('node:path'), crypto=require('node:crypto');
const {promisify}=require('node:util');
const {db,transaction}=require('./db');
const {createGame,act,publicGame,validateSettings}=require('./engine');
const admin=require('./management');
const derive=promisify(crypto.scrypt), uid=crypto.randomUUID;
const one=(sql,...args)=>db.prepare(sql).get(...args);
const all=(sql,...args)=>db.prepare(sql).all(...args);
const run=(sql,...args)=>db.prepare(sql).run(...args);
const docs=table=>all('SELECT doc FROM '+table).map(r=>JSON.parse(r.doc));
const settings=()=>validateSettings(JSON.parse(one('SELECT doc FROM GameSettings').doc));
const fail=(msg,code=400)=>{throw Object.assign(Error(msg),{status:code})};
const bounded=(value,max)=>typeof value==='string'&&value.trim().length>0&&value.trim().length<=max;
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const throttle=new Map();
function limited(key,max){
 const now=Date.now(),entry=throttle.get(key);
 if(!entry||entry.until<now){throttle.set(key,{n:1,until:now+600000});return}
 if(++entry.n>max)fail('محاولات كثيرة. حاول لاحقاً.',429)
}
setInterval(()=>{for(const [k,v] of throttle)if(v.until<Date.now())throttle.delete(k);run('DELETE FROM AuthSession WHERE expires<?',Date.now())},600000).unref();
function issue(res,id){
 const token=crypto.randomBytes(32).toString('hex');
 run('INSERT INTO AuthSession VALUES (?,?,?)',hash(token),id,Date.now()+2592e6);
 res.setHeader('Set-Cookie','sid='+token+'; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000'+(process.env.COOKIE_SECURE==='1'?'; Secure':''));
}
async function body(req){
 if(!req.headers['content-type']?.startsWith('application/json'))fail('نوع الطلب غير مدعوم.',415);
 const chunks=[];let size=0;
 for await(const c of req){size+=c.length;if(size>12*1024*1024)fail('الملف كبير جداً.',413);chunks.push(c)}
 try{const v=JSON.parse(Buffer.concat(chunks).toString());if(!v||typeof v!=='object'||Array.isArray(v))throw Error();return v}catch{fail('تعذرت قراءة البيانات.')}
}
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.woff2':'font/woff2','.ico':'image/x-icon'};
const publicDir=path.resolve(__dirname,'public');
function writeGame(old,g,cmd){
 const version=old.version+1;
 run('UPDATE GameSession SET state=?,phase=?,updated=?,version=? WHERE id=?',JSON.stringify(g),g.phase,Date.now(),version,g.id);
 run('INSERT INTO GameEvent VALUES(?,?,?,?,?)',g.id,version,JSON.stringify(cmd),JSON.stringify(g.events.slice(old.eventCount||0)),Date.now());
 run('DELETE FROM QuestionAttempt WHERE gameId=?',g.id);
 const stmt=db.prepare('INSERT INTO QuestionAttempt VALUES(?,?,?)');
 g.attempts.forEach((a,i)=>stmt.run(g.id,i,JSON.stringify(a)));
 return {...publicGame(g),version}
}
async function handle(req,res){
 const url=new URL(req.url,'http://localhost'),p=url.pathname,post=req.method==='POST';
 const json=value=>{res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(value))};
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
 if(!['GET','POST','HEAD'].includes(req.method))fail('طلب غير متاح.',405);
 if(!p.startsWith('/api/')){
  if(post)fail('طلب غير متاح.',405);
  if(p.startsWith('/media/')){
   const m=one('SELECT * FROM QuestionMedia WHERE id=?',p.slice(7));if(!m)fail('الملف غير موجود.',404);
   res.setHeader('Content-Type',m.mime);res.setHeader('Accept-Ranges','bytes');
   const buf=Buffer.from(m.bytes),range=req.headers.range;
   if(range){const match=/^bytes=(\d+)-(\d*)$/.exec(range);if(!match)fail('مدى غير صالح.',416);const start=Number(match[1]),end=Math.min(match[2]?Number(match[2]):buf.length-1,buf.length-1);if(start>end)fail('مدى غير صالح.',416);res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${buf.length}`);return res.end(buf.subarray(start,end+1))}
   return res.end(buf)
  }
  const file=path.resolve(publicDir,'.'+((p==='/'||p==='/index.html')?'/studio.html':decodeURIComponent(p)));
  if(!file.startsWith(publicDir+path.sep)||!mime[path.extname(file)]||!fs.statSync(file,{throwIfNoEntry:false})?.isFile())fail('الصفحة غير موجودة.',404);
  res.setHeader('Content-Type',mime[path.extname(file)]);return fs.createReadStream(file).pipe(res)
 }
 res.setHeader('Cache-Control','no-store');
 if(post&&(req.headers['sec-fetch-site']==='cross-site'||(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)))fail('مصدر الطلب غير مقبول.',403);
 const token=/\bsid=([a-f0-9]{64})\b/.exec(req.headers.cookie||'')?.[1];
 let user=token&&one('SELECT u.* FROM User u JOIN AuthSession s ON s.userId=u.id WHERE token=? AND expires>? AND disabled=0',hash(token),Date.now());
 const data=post?await body(req):{};
 if(post&&['/api/login','/api/register'].includes(p)){
  limited('auth'+req.socket.remoteAddress,50);
  const username=data.username?.trim?.(),password=data.password;
  if(!bounded(username,50)||!bounded(password,256))fail('تحقق من اسم المستخدم وكلمة المرور.');
  let id;
  if(p.endsWith('register')){
   if(username.length<2||password.length<8)fail('اسم المستخدم حرفان على الأقل وكلمة المرور ثمانية أحرف على الأقل.');
   const salt=crypto.randomBytes(16).toString('hex'),key=await derive(password,salt,64);
   transaction(()=>{if(one('SELECT id FROM User WHERE username=?',username))fail('اسم المستخدم مستخدم.');
    id=user&&!user.password?user.id:uid();
    if(user&&id===user.id)run('UPDATE User SET username=?,password=? WHERE id=?',username,salt+':'+key.toString('hex'),id);
    else run('INSERT INTO User(id,username,password) VALUES(?,?,?)',id,username,salt+':'+key.toString('hex'));
   })
  }else{
   const account=one('SELECT * FROM User WHERE username=?',username);
   const [salt,key]=(account?.password||'0000000000000000:'+ '00'.repeat(64)).split(':');
   const test=await derive(password,salt,64);
   if(!account?.password||account.disabled||!crypto.timingSafeEqual(test,Buffer.from(key,'hex')))fail('بيانات الدخول غير صحيحة.',401);
   id=account.id
  }
  if(token)run('DELETE FROM AuthSession WHERE token=?',hash(token));issue(res,id);return json({ok:true})
 }
 if(p==='/api/logout'&&post){if(token)run('DELETE FROM AuthSession WHERE token=?',hash(token));res.setHeader('Set-Cookie','sid=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');return json({ok:true})}
 if(p==='/api/bootstrap'&&!post){
  if(!user){limited('guest'+req.socket.remoteAddress,200);const id=uid();run('INSERT INTO User(id) VALUES(?)',id);issue(res,id);user=one('SELECT * FROM User WHERE id=?',id)}
  const rules=settings(),qs=docs('Question').filter(q=>q.status==='published');
  const categories=docs('Category').filter(c=>c.status==='published').map(c=>{const pool=qs.filter(q=>q.categoryId===c.id);return {...c,count:pool.length,sample:rules.categoryPreview?pool[0]?.text:null}});
  const history=all('SELECT id,phase,updated,version,json_extract(state,\'$.teams\') AS teams FROM GameSession WHERE userId=? ORDER BY updated DESC LIMIT 100',user.id).map(r=>({...r,teams:JSON.parse(r.teams).map(t=>({name:t.name,score:t.score}))}));
  return json({user:{id:user.id,username:user.username,role:user.role,guest:!user.password},categories,settings:rules,history,favorites:JSON.parse(user.favorites),teamNames:JSON.parse(user.teamNames)})
 }
 if(!user)fail('انتهت الجلسة. أعد تحميل الصفحة.',401);
 if(p.startsWith('/api/admin/')){if(user.role!=='admin')fail('هذه الصفحة للمشرفين.',403);return json(admin({p,post,data,user,db,docs,settings,transaction,fail,bounded}))}
 if(p==='/api/favorites'&&post){if(!Array.isArray(data.ids)||data.ids.length>2000||!data.ids.every(id=>typeof id==='string'&&id.length<=100))fail('اختيار غير صالح.');run('UPDATE User SET favorites=? WHERE id=?',JSON.stringify([...new Set(data.ids)]),user.id);return json({ok:true})}
 if(p==='/api/feedback'&&post){if(!bounded(data.message,2000))fail('اكتب رسالتك.');limited('feedback'+user.id,20);run('INSERT INTO Feedback(userId,message,created) VALUES(?,?,?)',user.id,data.message,Date.now());return json({ok:true})}
 if(p==='/api/report'&&post){if(!bounded(data.message,2000)||!one('SELECT 1 FROM GameSession g JOIN GameSessionQuestion q ON q.gameId=g.id WHERE g.id=? AND g.userId=? AND q.questionId=?',data.gameId,user.id,data.questionId))fail('بلاغ غير صالح.');limited('report'+user.id,40);run('INSERT INTO QuestionReport(gameId,questionId,message,created) VALUES(?,?,?,?)',data.gameId,data.questionId,data.message,Date.now());return json({ok:true})}
 if(p==='/api/games'&&post){
  limited('match'+user.id,60);
  const rules=settings();if(!rules.guestEnabled&&!user.password)fail('سجّل الدخول لبدء المباراة.',403);
  const seenQuestionIds=all('SELECT DISTINCT questionId FROM GameSessionQuestion q JOIN GameSession g ON q.gameId=g.id WHERE userId=?',user.id).map(q=>q.questionId);
  const g=createGame({teams:data.teams,seenQuestionIds},docs('Category'),docs('Question'),rules);
  return json(transaction(()=>{
   run('INSERT INTO GameSession VALUES(?,?,?,?,?,?)',g.id,user.id,1,JSON.stringify(g),g.phase,Date.now());
   g.teams.forEach((t,i)=>{run('INSERT INTO Team VALUES(?,?,?)',g.id,i,t.name);for(const n of t.players)run('INSERT INTO Player VALUES(?,?,?)',g.id,i,n);for(const power of t.powers)run('INSERT INTO TeamPowerUp VALUES(?,?,?)',g.id,i,power)});
   for(const tile of g.board)run('INSERT INTO GameSessionQuestion VALUES(?,?,?)',g.id,tile.question.id,JSON.stringify(tile.question));
   run('UPDATE User SET teamNames=? WHERE id=?',JSON.stringify(g.teams.map(t=>t.name)),user.id);
   run('INSERT INTO GameEvent VALUES(?,?,?,?,?)',g.id,1,'{"type":"create"}','[]',Date.now());return {...publicGame(g),version:1}
  }))
 }
 const match=/^\/api\/games\/([\w-]+)(\/action)?$/.exec(p);
 if(match&&Boolean(match[2])===post){
  return json(transaction(()=>{
   const row=one('SELECT * FROM GameSession WHERE id=? AND userId=?',match[1],user.id);if(!row)fail('المباراة غير موجودة.',404);
   const g=JSON.parse(row.state);row.eventCount=g.events.length;
   if(post&&data.version!==row.version)fail('تغيّرت المباراة. حدّث العرض ثم حاول مجدداً.',409);
   const sync=act(g,{type:'sync'});
   if(sync.events.length!==g.events.length||sync.phase!==g.phase)return writeGame(row,sync,{type:'sync'});
   if(!post)return {...publicGame(g),version:row.version};
   if(typeof data.type!=='string'||JSON.stringify(data).length>3500)fail('إجراء غير صالح.');
   return writeGame(row,act(g,data),data)
  }))
 }
 fail('المسار غير موجود.',404)
}
const server=http.createServer((req,res)=>handle(req,res).catch(err=>{if(res.headersSent)return res.destroy();res.statusCode=err.status||400;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify({error:/[\u0600-\u06ff]/.test(err.message)?err.message:'تعذّر إتمام الطلب. تحقق من البيانات وحاول مجدداً.'}));if(!err.status&&!/[\u0600-\u06ff]/.test(err.message))console.error(err)}));
server.requestTimeout=30000;
if(require.main===module)server.listen(Number(process.env.PORT||3080),process.env.HOST||'127.0.0.1',()=>console.log('Trivia server: http://'+server.address().address+':'+server.address().port));
module.exports=server;

