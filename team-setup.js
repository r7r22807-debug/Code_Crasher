const aids={
 two:['جاوب جوابين','<g fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="m29 29-3-13c-.8-4 4-5 5-1l3 12 1-13c.4-4 5-4 5 0l-1 16c3 3 3 9 1 14-2 6-8 10-14 7-5-2-8-7-9-12"/><path d="m22 30 4 6c2 3 6 1 4-2l-4-6c-2-3-6-1-4 2zm-4 5 4 6c2 3 6 0 4-3l-4-5c-2-3-6-1-4 2zm20-6-8-1c-4 0-4 6 1 7l4 1c-4 0-6 3-6 6"/></g>','#64afe7'],
 call:['اتصال بصديق','<path d="M20 17h6c1 0 2 1 2 3l1 5c0 1-1 2-3 4 2 4 5 7 9 9l4-4c1-1 2-1 3 0l6 2c1 0 2 1 2 3v5c0 3-2 5-5 5-15-1-29-15-29-29 0-2 1-3 4-3z"/>','#009c22'],
 pit:['الحفرة','<path d="m15 23 7-8 7 8h-4v8c0 2 1 3 3 4h-6c-3 0-5-2-5-5v-7zm34 17-7 8-7-8h4v-8c0-2-1-3-3-4h6c3 0 5 2 5 5v7z"/><path d="m30 28 5 0 2 4-2 4h-5l-2-4z"/>','#af8058'],
 rest:['استريح','<path d="M18 39V25a2 2 0 0 1 4 0v8h1V19a2 2 0 0 1 4 0v13h1V15a2 2 0 0 1 4 0v17h1V18a2 2 0 0 1 4 0v17c-4 0-8 3-9 8l2 1c1-5 5-8 10-7l3-8c1-3 5-3 5-1l-4 16c-2 7-6 11-13 11-8 0-13-6-13-16z"/>','#e6373b'],
 trap:['الفخ','<circle cx="29" cy="36" r="14"/><path d="m33 23 6-6 5 5-6 6z"/><path d="M39 20q4-6 8 0m1 3 2 1m-2-7 1-2" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M23 40q6 6 12 0" fill="none" stroke="var(--bomb-smile,#fff)" stroke-width="2.3" stroke-linecap="round"/>','#ddb02a']
};
function aidIcon(key){
 const [,drawing,color]=aids[key];
 return '<svg class="aidIcon" style="--icon-color:'+color+'" viewBox="0 0 64 64" aria-hidden="true" focusable="false" fill="currentColor"><circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" stroke-width="5"/>'+drawing+'</svg>';
}
function teamsForm(){return `<section class="teamsSetup"><h1 id="teamHeading" tabindex="-1">حدد معلومات الفرق</h1><input class="matchName" name="title" maxlength="48" placeholder="اسم المباراة (اختياري)" aria-label="اسم المباراة"><div class="teamPair">${['الأول','الثاني'].map((n,i)=>`<section><h2>الفريق ${n}</h2><input required maxlength="48" aria-label="اسم الفريق ${n}" name="team${i}" value="الفريق ${n}"><h3>الفريق ${n} : اختر 3 وسائل مساعدة</h3><div class="aidGrid">${Object.entries(aids).map(([k,[label,,color]])=>`<label style="--accent:${color}"><input type="checkbox" name="aids${i}" value="${k}"><b>${label}</b>${aidIcon(k)}</label>`).join('')}</div></section>`).join('')}</div><details class="splitter"><summary>قسّم لي الفرق</summary><div class="splitBody"><div id="drawInputs"><h3>عدد اللاعبين</h3><div class="stepper"><button type="button" data-step="-1" aria-label="تقليل عدد اللاعبين">⊖</button><output id="playerCount" aria-live="polite">4</output><button type="button" data-step="1" aria-label="زيادة عدد اللاعبين">⊕</button></div><div id="playerFields">${Array.from({length:4},(_,i)=>playerField(i+1)).join('')}</div><button class="drawTeams" type="button" data-split>عطني التقسيمة</button></div><div id="splitResult" role="status"></div></div></details><p id="error" class="error" role="status"></p><button class="launch">ابدأ اللعب</button></section>`}
let splitPlayers=[[],[]];
function playerField(number){return '<input name="player" maxlength="48" aria-label="اسم اللاعب '+number+'" placeholder="اسم اللاعب">'}
function resetDraw(){splitPlayers=[[],[]];document.querySelector('#splitResult').textContent=''}
function resizeRoster(delta){
 const fields=document.querySelector('#playerFields'),count=fields.children.length+delta;
 if(count<2||count>100)return;
 if(delta===1)fields.insertAdjacentHTML('beforeend',playerField(count));
 else fields.lastElementChild.remove();
 document.querySelector('#playerCount').textContent=count;
 document.querySelector('[data-step="-1"]').disabled=count===2;
 document.querySelector('[data-step="1"]').disabled=count===100;
 resetDraw()
}
function splitTeams(){
 const players=Array.from(document.querySelectorAll('#playerFields input'),(input,i)=>input.value.trim()||'اللاعب '+(i+1));
 const out=document.querySelector('#splitResult');
 if(players.length<2){out.textContent='أدخل اسمين على الأقل.';splitPlayers=[[],[]];return}
 for(let i=players.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[players[i],players[j]]=[players[j],players[i]]}
 splitPlayers=[players.filter((_,i)=>i%2===0),players.filter((_,i)=>i%2===1)];
 document.querySelector('#drawInputs').hidden=true;
 out.innerHTML=rosterColumns(splitPlayers,[0,1].map(i=>document.querySelector('[name=team'+i+']').value))+
 '<div class="rosterTools"><button type="button" data-add-player>إضافة المزيد من الأعضاء</button><button type="button" data-split class="shuffle" aria-label="إعادة توزيع اللاعبين" title="إعادة توزيع اللاعبين"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h3c4 0 8 12 12 12h3m-4-4 4 4-4 4M3 18h3c2 0 4-3 5-5m3-5c1-1 2-2 4-2h3m-4-4 4 4-4 4"/></svg></button></div>';
}
function rosterColumns(teams,names){
 return '<div class="rosterColumns">'+names.map((name,i)=>'<section><h3><span>'+(i+1)+'</span><bdi>'+escapeHtml(name)+'</bdi></h3><ul>'+(teams?.[i]?.length?teams[i].map(player=>'<li><bdi>'+escapeHtml(player)+'</bdi></li>').join(''):'<li>لم يُسجّل لاعبون لهذا الفريق.</li>')+'</ul></section>').join('')+'</div>'
}
function availableAids(){if(!game.aids||game.shown)return '';return '<div class="actions">'+game.aids[game.actor].filter(k=>k!=='pit'&&!(k==='trap'&&game.steal)&&!game.spent[game.actor].includes(k)).map(k=>button(aids[k][0],'aid:'+k,'class="secondary"')).join('')+'</div>'}
const aidRules={
 call:'اتصل بصديق للمساعدة. تضاف 30 ثانية إلى وقت الفريق.',
 two:'قدّم إجابتين. يقبل المضيف أي إجابة صحيحة وتُحسب نقاط السؤال مرة واحدة.',
 pit:'إذا أجاب فريقك صح، يكسب نقاط السؤال وتُخصم القيمة نفسها من الخصم.',
 rest:'اختر لاعباً من الخصم ليستريح حتى نهاية هذا السؤال.',
 trap:'ينتقل السؤال إلى الخصم لمدة 10 ثوانٍ. إذا أخفق تُخصم منه قيمة السؤال.'
};
function useAid(k){
 const i=game.current?game.actor:game.turn;
 if(!game.aids?.[i]?.includes(k)||game.spent[i].includes(k)||Boolean(game.current)===(k==='pit')||(game.current&&game.shown)||game.reviewBoard||(k==='trap'&&game.steal))return;
 if(game.current&&!game.paused&&Date.now()>=game.until){miss();return}
 const id=game.current,roster=game.players?.[1-i]||[],d=document.createElement('dialog');
 const input=k==='two'?'<label>الإجابة الأولى<input name="first" maxlength="200" required></label><label>الإجابة الثانية<input name="second" maxlength="200" required></label>':k==='rest'?(roster.length?'<label>اللاعب المستريح<select name="player">'+roster.map(n=>'<option>'+escapeHtml(n)+'</option>').join('')+'</select></label>':'<label>اسم اللاعب المستريح<input name="player" maxlength="80" required></label>'):'';
 d.className='catdialog aidDialog';d.innerHTML='<form><h2>'+aids[k][0]+'</h2><p>'+aidRules[k]+'</p>'+input+'<div class="actions"><button type="submit">تفعيل</button><button type="button" class="secondary">إلغاء</button></div></form>';
 document.body.append(d);d.querySelector('[type=button]').onclick=()=>d.close();d.addEventListener('close',()=>d.remove(),{once:true});
 d.querySelector('form').onsubmit=e=>{
  e.preventDefault();const data=new FormData(e.currentTarget);d.close();
  if(game.current!==id||(id&&game.actor!==i)||game.shown&&id||game.spent[i].includes(k))return;
  if(id&&!game.paused&&Date.now()>=game.until){miss();return}
  let message=aids[k][0];
  if(k==='two')message+=' · '+data.get('first')+' / '+data.get('second');
  if(k==='rest')message+=' · '+data.get('player');
  game.spent[i].push(k);
  if(k==='pit')game.pit=true;
  else{
   if(k==='call'){if(game.paused)game.remaining+=30000;else game.until+=30000;message+=' · +30 ثانية'}
   game.note=[game.note,game.names[i]+' — '+message].filter(Boolean).join(' · ');
   if(k==='trap'){game.trap=true;game.steal=true;game.actor=1-i;game.paused=false;game.until=Date.now()+10000}
  }
  save()
 };
 d.showModal()
}
