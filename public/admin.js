'use strict';
const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tabs={overview:'نظرة عامة',categories:'الفئات',questions:'بنك الأسئلة',settings:'قواعد المباراة',reports:'البلاغات والرسائل',users:'الحسابات',audit:'سجل الإدارة'};
const powers={call:'اتصال بصديق',two:'جاوب جوابين',pit:'الحفرة',break:'استريح',trap:'الفخ'};
const types={text:'نص',image:'صورة',audio:'صوت',video:'فيديو',multiple:'اختيارات',identify:'تعرّف على الشيء',geography:'جغرافيا',ordering:'ترتيب',riddle:'لغز',challenge:'تحدٍّ زمني','multiple-choice':'اختيارات',timed:'تحدٍّ زمني',puzzle:'أحجية'};
const difficulty={easy:'سهل',medium:'متوسط',hard:'صعب'},publication={published:'منشور',hidden:'مخفي'};
let state,tab='overview',edit=null,search='',category='',order='text',visible='';let pending=false;
async function api(endpoint,data){const r=await fetch('/api/admin/'+endpoint,data?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{});const json=await r.json();if(!r.ok)throw Error(json.error);return json}
async function refresh(){state=await api('dashboard');render()}
const date=v=>new Date(v).toLocaleString('ar');
const btn=(text,op,id='')=>`<button class="btn" data-op="${op}" data-id="${esc(id)}">${text}</button>`;
const table=(heads,rows)=>rows.length?`<table><thead><tr>${heads.map(h=>'<th>'+h+'</th>').join('')}</tr></thead><tbody>${rows.map(r=>'<tr>'+r.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('')}</tbody></table>`:'<p class="muted">لا توجد سجلات.</p>';
const options=(obj,selected)=>Object.entries(obj).map(([k,v])=>`<option value="${esc(k)}" ${k===String(selected)?'selected':''}>${esc(v)}</option>`).join('');
const catMap=()=>Object.fromEntries(state.categories.map(c=>[c.id,c.name]));
const field=(label,key,value='',type='text')=>`<label class="field">${label}<input name="${key}" type="${type}" value="${esc(value)}"></label>`;
const area=(label,key,value='')=>`<label class="field">${label}<textarea name="${key}" rows="2">${esc(value)}</textarea></label>`;
const sel=(label,key,obj,value)=>`<label class="field">${label}<select name="${key}">${options(obj,value)}</select></label>`;
function questionRows(){const rows=state.questions.filter(q=>(!category||q.categoryId===category)&&(!visible||q.status===visible)&&(q.text+' '+q.answer).includes(search)).sort((a,b)=>order==='points'?a.points-b.points:a.text.localeCompare(b.text,'ar'));return table(['السؤال','الفئة','النقاط','الحالة','إجراءات'],rows.map(q=>[esc(q.text),esc(catMap()[q.categoryId]),esc(q.points),publication[q.status]||'مخفي',btn('معاينة','preview',q.id)+btn('تعديل','question',q.id)+btn('حذف','deleteQuestion',q.id)]))}
function render(){
 $('#tabs').innerHTML=Object.entries(tabs).map(([k,v])=>`<button class="chip ${tab===k?'on':''}" data-tab="${k}">${v}</button>`).join('');
 let html='';
 if(tab==='overview'){html='<div class="metrics">'+[[state.stats.total,'مباراة'],[state.stats.completed,'مباراة مكتملة'],[state.questions.length,'سؤال'],[state.categories.length,'فئة']].map(([n,l])=>'<article><strong>'+n+'</strong>'+l+'</article>').join('')+'</div><h3>آخر المباريات</h3>'+table(['الفريق الأول','الفريق الثاني','الحالة','آخر تحديث'],state.sessions.map(g=>[esc(g.a),esc(g.b),g.phase==='complete'?'مكتملة':'جارية',date(g.updated)]))}
 if(tab==='categories')html=btn('إضافة فئة','category')+table(['الفئة','المجموعة','الحالة','إجراءات'],state.categories.map(c=>[esc(c.name),esc(c.group),publication[c.status]||'مخفي',btn('تعديل','category',c.id)+btn('حذف','deleteCategory',c.id)]));
 if(tab==='questions')html='<div class="tools">'+btn('إضافة سؤال','question')+btn('تصدير JSON','export')+btn('استيراد CSV أو JSON','import')+'</div><div class="tools"><input id="search" aria-label="بحث" placeholder="بحث في النص والإجابة" value="'+esc(search)+'"><select aria-label="الفئة" id="cat">'+options({'':'كل الفئات',...catMap()},category)+'</select><select id="vis" aria-label="حالة النشر">'+options({'':'كل الحالات',...publication},visible)+'</select><select aria-label="ترتيب" id="sort">'+options({text:'ترتيب أبجدي',points:'ترتيب بالنقاط'},order)+'</select></div><div id="results">'+questionRows()+'</div>';
 if(tab==='settings')html='<p>تطبّق التغييرات على المباريات الجديدة. تحتفظ المباريات الجارية بنسخة من قواعدها.</p>'+btn('ضبط القواعد والمؤقتات','settings');
 if(tab==='users')html=table(['الاسم','الصلاحية','الحالة','إجراء'],state.users.map(u=>[esc(u.username),u.role==='admin'?'مشرف':'لاعب',u.disabled?'معطل':'نشط',btn(u.disabled?'تفعيل':'تعطيل','account',u.id)]));
 if(tab==='audit')html=table(['الوقت','المشرف','العملية','المعرّف'],state.audit.map(a=>[date(a.created),esc(a.username||'إدارة محلية'),esc(({question:'تعديل سؤال',category:'تعديل فئة',settings:'تعديل القواعد',delete:'حذف',account:'تحديث حساب',report:'تحديث بلاغ',media:'رفع ملف',import:'استيراد',promote:'تعيين مشرف'})[a.operation]),esc(a.entity)]));
 if(tab==='reports')html=table(['السؤال','البلاغ','تاريخ البلاغ','الإجراء'],state.reports.map(r=>[esc(r.question),esc(r.message),date(r.created),btn(r.resolved?'إعادة فتح':'إغلاق البلاغ','report',r.id)]))+'<h3>رسائل اللاعبين</h3>'+table(['التاريخ','الرسالة'],state.feedback.map(f=>[date(f.created),esc(f.message)]));
 $('#view').innerHTML='<h2>'+tabs[tab]+'</h2>'+html
}
function openEditor(kind,id){
 const q=(kind==='category'?state.categories:state.questions).find(x=>x.id===id)||{},s=state.settings;
 edit={kind,id,media:q.media||[],image:q.image||''};let fields='';
 if(kind==='preview'){fields='<h2>'+esc(q.text)+'</h2><p>'+esc((q.options||[]).join(' • '))+'</p>'+mediaHtml(q.media)+'<div class="answer"><strong>'+esc(q.answer)+'</strong><p>'+esc(q.explanation)+'</p></div>'}
 if(kind==='category')fields='<h2>بيانات الفئة</h2>'+field('الاسم','name',q.name)+area('وصف الفئة','description',q.description)+field('المجموعة','group',q.group)+field('رمز الفئة','emoji',q.emoji)+field('الوسوم (سطر أو فاصلة بين القيم)','tags',(q.tags||[]).join(', '))+sel('حالة النشر','status',publication,q.status)+upload(true);
 if(kind==='question')fields='<h2>تحرير السؤال</h2>'+sel('الفئة','categoryId',catMap(),q.categoryId)+area('السؤال','text',q.text)+area('الإجابة الصحيحة','answer',q.answer)+area('الشرح','explanation',q.explanation)+area('إجابات مقبولة (إجابة في كل سطر)','alternatives',(q.alternatives||[]).join('\n'))+area('الخيارات أو عناصر الترتيب (عنصر في كل سطر)','options',(q.options||q.choices||[]).join('\n'))+'<div class="fields">'+sel('نوع السؤال','type',types,q.type)+sel('الصعوبة','difficulty',difficulty,q.difficulty)+field('النقاط','points',q.points||200,'number')+field('هامش السنوات','yearTolerance',q.yearTolerance,'number')+sel('حالة النشر','status',publication,q.status)+'</div>'+upload(false);
 if(kind==='settings'){
  fields='<h2>قواعد المباراة</h2><div class="fields">'+field('مهلة الفريق (ثانية)','activeSeconds',s.activeSeconds,'number')+field('مهلة الخصم (ثانية)','opponentSeconds',s.opponentSeconds,'number')+field('وقت المساعدة الإضافي','callSeconds',s.callSeconds,'number')+'</div>'+field('قيم الخانات الست بالترتيب','points',s.points.join(', '))+sel('اختيار السؤال التالي','nextTurn',{alternate:'تبادل الفريقين',winner:'صاحب الإجابة الصحيحة',retain:'الفريق صاحب الاختيار السابق'},s.nextTurn);
  for(const [k,l] of Object.entries({allowSteal:'إتاحة المحاولة للخصم',negativeScores:'السماح برصيد سالب',pitOnSteal:'تطبيق خسارة الحفرة على مُفعّلها إذا سرق الخصم السؤال',trapCorrectScores:'منح نقاط الإجابة الصحيحة في الفخ',trapTimeoutPenalty:'خصم النقاط عند انتهاء مهلة الفخ',guestEnabled:'السماح للضيوف باللعب',categoryPreview:'إتاحة معاينة الفئات'}))fields+='<p><label><input type="checkbox" name="'+k+'" '+(s[k]?'checked':'')+'> '+l+'</label></p>';
  fields+='<h3>وسائل المساعدة المتاحة</h3>'+Object.entries(powers).map(([k,v])=>'<label><input type="checkbox" name="enabledPowers" value="'+k+'" '+(s.enabledPowers.includes(k)?'checked':'')+'> '+v+' </label>').join('')
 }
 if(kind==='import')fields='<h2>استيراد بنك أسئلة</h2><p>اختر ملف JSON مصدّراً أو ملف CSV بترميز UTF-8. الحقول المطلوبة هي categoryId وtext وanswer وpoints. أضف status بقيمة published للنشر. يُحدّث المعرّف المطابق السؤال الموجود. تعرض العملية العدد قبل الحفظ.</p><input name="file" required type="file" accept=".csv,.json">';
 $('#fields').innerHTML=fields;$('#err').textContent='';$('#form button:not([type])').hidden=kind==='preview';$('#editor').showModal()
}
function mediaHtml(items=[]){return items.map(m=>m.type==='image'?'<img src="'+esc(m.url)+'" alt="وسائط السؤال">':m.type==='audio'?'<audio controls src="'+esc(m.url)+'"></audio>':'<video controls src="'+esc(m.url)+'"></video>').join('')}
function upload(image){return '<label class="field">رفع '+(image?'صورة للفئة':'صورة أو صوت أو فيديو')+' (حتى ٨ ميغابايت)<input type="file" id="upload" accept="'+(image?'image/png,image/jpeg,image/webp':'image/png,image/jpeg,image/webp,audio/mpeg,audio/wav,video/mp4')+'"></label><div id="media">'+(image&&edit.image?mediaHtml([{url:edit.image,type:'image'}]):mediaHtml(edit.media))+'</div>'+btn('إزالة الوسائط','clearMedia')}
function csv(text){
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(!quoted&&c===','){row.push(cell);cell=''}else if(!quoted&&c==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell=''}else cell+=c}
 if(quoted)throw Error('علامات اقتباس CSV غير مكتملة.');if(cell||row.length){row.push(cell.replace(/\r$/,''));rows.push(row)}
 const headers=rows.shift()||[];return rows.filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(headers.map((k,i)=>[k,r[i]||''])))
}
document.addEventListener('click',async e=>{
 const t=e.target.closest('button');if(!t)return;try{
 if(t.dataset.tab){tab=t.dataset.tab;render();return}
 const {op,id}=t.dataset;if(!op)return;e.preventDefault();
 if(['question','category','settings','preview','import'].includes(op)){openEditor(op,id);return}
 if(op==='clearMedia'){edit.media=[];edit.image='';$('#media').innerHTML='';return}
 if(op==='export'){const u=URL.createObjectURL(new Blob([JSON.stringify(state.questions,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download='rinna-questions.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);return}
 if(!confirm('هل تؤكد تنفيذ هذا الإجراء؟'))return;
 if(op.startsWith('delete'))await api('delete',{id,entity:op.slice(6)});
 if(op==='account')await api(op,{id,disabled:!state.users.find(u=>u.id===id).disabled});
 if(op==='report')await api(op,{id:Number(id),resolved:!state.reports.find(r=>r.id===Number(id)).resolved});
 await refresh()
 }catch(err){$('#status').textContent=err.message}
});
$('#cancel').onclick=()=>$('#editor').close();
document.addEventListener('input',e=>{if(['search','cat','vis','sort'].includes(e.target.id)){search=$('#search').value;category=$('#cat').value;visible=$('#vis').value;order=$('#sort').value;$('#results').innerHTML=questionRows()}});
$('#fields').addEventListener('change',async e=>{if(e.target.id!=='upload'||!e.target.files.length)return;
 const file=e.target.files[0];pending=true;try{if(file.size>8388608)throw Error('الملف أكبر من ٨ ميغابايت.');
 const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file)});
 const m=await api('media',{mime:file.type==='audio/x-wav'?'audio/wav':file.type,base64});if(edit.kind==='category'){edit.image=m.url;$('#media').innerHTML=mediaHtml([m])}else{edit.media.push(m);$('#media').innerHTML=mediaHtml(edit.media)}
 }catch(err){$('#err').textContent=err.message}finally{pending=false}
});
$('#form').onsubmit=async e=>{e.preventDefault();if(pending)return;pending=true;
 try{const f=new FormData(e.target),d=Object.fromEntries(f);if(edit.id)d.id=edit.id;
 if(edit.kind==='category'){d.tags=d.tags.split(/[,،\n]/).map(x=>x.trim()).filter(Boolean);d.image=edit.image}
 if(edit.kind==='question'){d.points=Number(d.points);d.yearTolerance=d.yearTolerance===''?null:Number(d.yearTolerance);for(const k of ['alternatives','options'])d[k]=d[k].split('\n').map(x=>x.trim()).filter(Boolean);d.media=edit.media}
 if(edit.kind==='settings'){for(const k of ['activeSeconds','opponentSeconds','callSeconds'])d[k]=Number(d[k]);d.points=d.points.split(/[,،\s]+/).filter(Boolean).map(Number);d.enabledPowers=f.getAll('enabledPowers');for(const k of ['allowSteal','negativeScores','pitOnSteal','trapCorrectScores','trapTimeoutPenalty','guestEnabled','categoryPreview'])d[k]=f.has(k)}
 if(edit.kind==='import'){const text=(await d.file.text()).replace(/^\uFEFF/,'');d.questions=d.file.name.toLowerCase().endsWith('.csv')?csv(text):JSON.parse(text);if(!Array.isArray(d.questions))throw Error('يجب أن يحتوي الملف على قائمة أسئلة.');for(const q of d.questions){q.points=Number(q.points);q.yearTolerance=q.yearTolerance===''||q.yearTolerance==null?null:Number(q.yearTolerance)}delete d.file;if(!confirm('استيراد '+d.questions.length+' سؤالاً؟'))return}
 await api(edit.kind,d);$('#editor').close();await refresh();$('#status').textContent='تم الحفظ.'
 }catch(err){$('#err').textContent=err.message}finally{pending=false}
};
refresh().catch(err=>{$('#view').textContent=err.message;$('#status').textContent='سجّل الدخول بحساب مشرف من الصفحة الرئيسية.'});
