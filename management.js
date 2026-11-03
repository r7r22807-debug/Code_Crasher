'use strict';
const {randomUUID}=require('node:crypto');
const {validateSettings}=require('./engine');
module.exports=function management({p,post,data,user,db,docs,settings,transaction,fail,bounded}){
 const all=(s,...a)=>db.prepare(s).all(...a),one=(s,...a)=>db.prepare(s).get(...a),run=(s,...a)=>db.prepare(s).run(...a);
 if(p==='/api/admin/dashboard'&&!post)return {categories:docs('Category'),questions:docs('Question'),settings:settings(),
  users:all('SELECT id,username,role,disabled FROM User WHERE password IS NOT NULL ORDER BY username'),
  reports:all('SELECT r.*,json_extract(s.snapshot,\'$.text\') AS question FROM QuestionReport r LEFT JOIN GameSessionQuestion s ON s.gameId=r.gameId AND s.questionId=r.questionId ORDER BY r.id DESC LIMIT 500'),
  feedback:all('SELECT message,created FROM Feedback ORDER BY id DESC LIMIT 100'),audit:all('SELECT a.*,u.username FROM AdminAudit a LEFT JOIN User u ON a.userId=u.id ORDER BY a.id DESC LIMIT 200'),
  stats:one("SELECT count(*) total,count(CASE WHEN phase='complete' THEN 1 END) completed FROM GameSession"),
  sessions:all("SELECT id,phase,updated,json_extract(state,'$.teams[0].name') a,json_extract(state,'$.teams[1].name') b FROM GameSession ORDER BY updated DESC LIMIT 100")};
 if(!post)fail('مسار غير متاح.',404);
 const op=p.split('/').pop();
 const mediaUrl=value=>{if(!value)return '';if(typeof value!=='string'||!/^\/media\/[\w-]+$/.test(value)||!one('SELECT id FROM QuestionMedia WHERE id=?',value.slice(7)))fail('اختر ملف وسائط مرفوعاً.');return value};
 const list=(v,max)=>{if(v==null)return [];if(!Array.isArray(v)||v.length>max||!v.every(x=>bounded(x,500)))fail('تحقق من القائمة.');return v};
 function cleanId(id){if(id==null||id==='')return randomUUID();if(!bounded(id,100)||!/^[a-zA-Z0-9_-]+$/.test(id))fail('معرّف غير صالح.');return id}
 function question(q){
  if(!q||!bounded(q.text,3000)||!bounded(q.answer,2000)||!one('SELECT id FROM Category WHERE id=?',q.categoryId||''))fail('أكمل نص السؤال وإجابته وفئته.');
  const id=cleanId(q.id),old=one('SELECT doc FROM Question WHERE id=?',id);
  if(!Number.isSafeInteger(q.points)||q.points<1||q.points>100000)fail('قيمة السؤال غير صالحة.');
  if(q.yearTolerance!=null&&(!Number.isInteger(q.yearTolerance)||q.yearTolerance<0||q.yearTolerance>100))fail('هامش السنوات غير صالح.');
  if(!['text','image','audio','video','multiple','multiple-choice','identify','geography','ordering','riddle','puzzle','challenge','timed'].includes(q.type||'text'))fail('نوع السؤال غير صالح.');
  const media=listMedia(q.media),choices=list(q.options||q.choices,32);
  const time=new Date().toISOString(),item={id,categoryId:q.categoryId,text:q.text.trim(),answer:q.answer.trim(),explanation:String(q.explanation||'').slice(0,4000),difficulty:String(q.difficulty||'medium').slice(0,30),points:q.points,type:q.type||'text',media,options:choices,choices,alternatives:list(q.alternatives||q.acceptableAnswers,40),yearTolerance:q.yearTolerance??null,status:q.status==='published'?'published':'hidden',createdAt:old?JSON.parse(old.doc).createdAt:time,updatedAt:time};
  run('INSERT INTO Question VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET categoryId=excluded.categoryId,doc=excluded.doc',id,item.categoryId,JSON.stringify(item));return id
 }
 function listMedia(m){if(m==null)return [];if(!Array.isArray(m)||m.length>8)fail('تحقق من الوسائط.');return m.map(x=>{const url=mediaUrl(x.url),mime=one('SELECT mime FROM QuestionMedia WHERE id=?',url.slice(7))?.mime;if(!mime)fail('وسائط غير صالحة.');return {url,type:mime.split('/')[0],alt:String(x.alt||'').slice(0,300)}})}
 return transaction(()=>{
  let entity=String(data.id||'').slice(0,100),result={ok:true};
  if(op==='category'){
   if(!bounded(data.name,100))fail('أدخل اسم الفئة.');
   const id=cleanId(data.id),c={id,name:data.name.trim(),description:String(data.description||'').slice(0,1500),group:String(data.group||'عام').slice(0,80),emoji:String(data.emoji||'✦').slice(0,20),tags:list(data.tags,20),image:mediaUrl(data.image),status:data.status==='published'?'published':'hidden'};
   run('INSERT INTO Category VALUES(?,?) ON CONFLICT(id) DO UPDATE SET doc=excluded.doc',id,JSON.stringify(c));entity=id
  }else if(op==='question'){entity=question(data)}
  else if(op==='import'){if(!Array.isArray(data.questions)||!data.questions.length||data.questions.length>5000)fail('اختر ما بين سؤال و٥٠٠٠ سؤال.');for(const q of data.questions)question(q);entity=String(data.questions.length)}
  else if(op==='delete'){
   if(!['Category','Question'].includes(data.entity))fail('نوع غير صالح.');
   if(data.entity==='Category'&&one('SELECT id FROM Question WHERE categoryId=? LIMIT 1',entity))fail('انقل أو احذف أسئلة الفئة أولاً.');
   run('DELETE FROM '+data.entity+' WHERE id=?',entity)
  }else if(op==='settings'){run('UPDATE GameSettings SET doc=? WHERE id=1',JSON.stringify(validateSettings(data)))}
  else if(op==='report'){run('UPDATE QuestionReport SET resolved=? WHERE id=?',data.resolved?1:0,data.id)}
  else if(op==='account'){
   if(entity===user.id)fail('لا يمكن تعطيل حسابك الحالي.');
   run('UPDATE User SET disabled=? WHERE id=?',data.disabled?1:0,entity);run('DELETE FROM AuthSession WHERE userId=?',entity)
  }else if(op==='media'){
   if(typeof data.base64!=='string'||data.base64.length>11200000)fail('الحد الأقصى للملف ٨ ميغابايت.');
   const b=Buffer.from(data.base64,'base64'),h=b.subarray(0,12).toString('hex');
   const mime=h.startsWith('89504e470d0a1a0a')?'image/png':h.startsWith('ffd8ff')?'image/jpeg':b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP'?'image/webp':b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WAVE'?'audio/wav':b.toString('ascii',4,8)==='ftyp'?'video/mp4':h.startsWith('494433')||h.startsWith('fffb')?'audio/mpeg':null;
   if(!mime||mime!==data.mime||b.length<16||b.length>8388608)fail('نوع الملف أو محتواه غير مدعوم.');
   entity=randomUUID();run('INSERT INTO QuestionMedia VALUES(?,?,?)',entity,mime,b);result={url:'/media/'+entity,type:mime.split('/')[0]}
  }else fail('مسار غير متاح.',404);
  run('INSERT INTO AdminAudit(userId,operation,entity,created) VALUES(?,?,?,?)',user.id,op,entity,Date.now());return result
 })
};
