'use strict';
let {categories,questions}=JSON.parse(document.getElementById('bank').textContent);
const app=document.getElementById('app'),key='quick-arabic-match-v1';
const englishDigits=value=>String(value).replace(/[\u0660-\u0669\u06f0-\u06f9]/g,d=>String(d.charCodeAt(0)&15));
const escapeHtml=x=>englishDigits(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let game=null;
try{const saved=JSON.parse(localStorage.getItem(key));if(saved?.version===3){game=saved.match;poolCounts=saved.pools||{}}else if(saved?.version===2){game=saved.match;poolCounts={}}else game=saved}catch{}
function loadMatchBank(){
 const active=JSON.parse(document.getElementById('bank').textContent);
 const bank=game?.cats?.some(id=>!active.categories.some(c=>c.id===id))?JSON.parse(document.getElementById('legacyBank').textContent):active;
 categories=bank.categories;questions=bank===active && !(game && !game.deck)?balancedBank(bank):bank.questions;
 // Repair the short-lived three-question layout without discarding match progress.
 if(game?.deck&&game.deck.length===game.cats.length*3&&game.deck.every(q=>/^[a-z]+-v3-\d+$/.test(q.id))){
  const expanded=game.deck.flatMap(q=>{
   const partner=questions.find(item=>item.id===q.id.replace('-v3-','-v4-b-'));
   return partner?[q,partner]:[q];
  });
  if(expanded.length===game.cats.length*6)game.deck=expanded;
 }
}
loadMatchBank();
function save(){try{localStorage.setItem(key,JSON.stringify({version:3,match:game,pools:poolCounts}))}catch{}render()}
function matchQuestionCount(){return game?.deck?.length || (game?.cats?.length||6)*6}
const button=(text,action,extra='')=>`<button data-action="${action}" ${extra}>${text}</button>`;
let preferredTheme=null;
try{preferredTheme=localStorage.getItem('arena-theme')}catch{}
function isLight(){return preferredTheme?preferredTheme==='light':game?Boolean(game.lightQuestions):true}
function themeSwitch(){return '<button type="button" class="themeSwitch" data-action="theme" aria-label="تبديل المظهر" aria-pressed="'+!isLight()+'"><span>'+ (isLight()?'☾':'☀')+'</span></button>'}
function navIcon(kind){
 const paths={
  replay:'<path d="M28 14A12 12 0 1 0 28 22M28 5v10H18" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>',
  end:'<path d="M3 16h21m-9-10 10 10-10 10M30 4v24" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>',
  board:'<rect x="1" y="1" width="14" height="14" rx="3"/><rect x="18" y="1" width="14" height="14" rx="3"/><rect x="1" y="18" width="14" height="14" rx="3"/><rect x="18" y="18" width="14" height="14" rx="3"/>',
  exit:'<path d="M3 2h20v8h-3V5H9l9 3v23L3 28z"/><path d="M19 16h12m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
 };
 return '<svg class="navGlyph" viewBox="0 0 34 34" fill="currentColor" aria-hidden="true">'+paths[kind]+'</svg>'
}
function matchNav(board){
 const boardButton=board&&!game.reviewBoard?'<button disabled aria-current="page">لوحة اللعب'+navIcon('board')+'</button>':board?button('استئناف السؤال'+navIcon('board'),'resumeMatch'):button('الرجوع للوحة'+navIcon('board'),'viewBoard');
 return '<nav class="qNav matchNav">'+themeSwitch()+button('إنهاء اللعبة'+navIcon('end'),'endMatch')+boardButton+button('الخروج'+navIcon('exit'),'leaveMatch')+'</nav>'
}
const pickerTopics=[
 ['أهل البيت والتاريخ الشيعي','ahl battles companions whoali actali shiainfo shiaperson shiahist'],
 ['الأنبياء والسيرة النبوية','prophetera prophetlife whoprophet actprophet'],
 ['الأنمي وسبيس تون','naruto whonin onepiece whopirate anime whoanime characters toon'],
 ['المسلسلات وعالم جورج مارتن','martin whomartin thrones series bean mokhtar yusufshow'],
 ['الدول والأعلام والعملات','capitals flagsnew flagcolor money'],
 ['المعرفة العامة والحيوانات والأكلات','quiz whoanimal dishes']
];
function categorySections(){
 const counts=readPoolCounts();
 const cards=new Map(categories.map(c=>[c.id,c]));
 return pickerTopics.map(([title,ids])=>{
  const items=ids.split(' ').map(id=>cards.get(id)).filter(Boolean);
  return '<details class="categorySection" open><summary><b>'+title+'</b></summary><div class="cats">'+items.map(c=>`<article class="catbox"><label class="pickcard"><input type="checkbox" name="category" value="${c.id}" ${poolCount(c.id,counts)?'':'disabled'}><span class="poolBadge">باقي ${poolCount(c.id,counts)} / 5</span><span class="picture">${poster(c)}</span><b>${escapeHtml(c.name)}</b><span class="picked" aria-hidden="true">✓</span></label><button class="infobtn" type="button" data-info="${c.id}" aria-label="عن فئة ${escapeHtml(c.name)}">i</button></article>`).join('')+'</div></details>';
 }).join('');
}
function render(){
 document.body.classList.toggle('homeNight',!game&&!isLight());
 if(!game){app.innerHTML=`<form class="lobby"><div class="homeTheme"><button type="button" data-reset-pools>إعادة ضبط مجموعات الأسئلة</button><button type="button" data-guide>شرح وسائل المساعدة</button>${themeSwitch()}</div><h2>فئات المباراة <small id="count" aria-live="polite">0 / 6</small></h2><p class="tierGuide">لكل فريق سؤال في كل مستوى: 200 سهل · 400 متوسط · 600 صعب · سؤالان لكل قيمة وخمس مجموعات لكل فئة</p>${categorySections()}<aside id="pickTray" aria-label="الفئات المختارة" hidden></aside><p id="pickHint" role="status"></p>${teamsForm()}</form>`;return}
 const team=i=>escapeHtml(game.names[i]),q=(game.deck||questions).find(x=>x.id===game.current),c=categories.find(x=>x.id===q?.categoryId);
 const scores=`<div class="bar"><strong class="team">${team(0)} · ${game.scores[0]}</strong><strong class="team">${team(1)} · ${game.scores[1]}</strong></div>`;
 if(game.away){app.innerHTML='<section class="panel"><h1>المباراة محفوظة</h1>'+button('استئناف المباراة','resumeMatch')+'</section>';return}
 if(game.ended||game.used.length===matchQuestionCount()){app.innerHTML=resultView();return}
 if(q&&!game.reviewBoard){app.innerHTML=questionView(q,c);clock();return}
 function column(items,side){return '<div class="flex gap-1 flex-col stack">'+items.map(q=>button(game.used.includes(q.id)?'✓':q.points,'pick:'+q.id,`class="${side} game-text" aria-label="${categories.find(c=>c.id===q.categoryId).name}، ${q.points} نقطة" ${(game.current||game.used.includes(q.id))?'disabled':''}`)).join('')+'</div>'}
 app.innerHTML=`<div class="arena ${isLight()?'lightBoard':'darkBoard'}"><div class="topline"><div class="mast"><b class="wordmark">تحدّي<br>الفريقين</b><strong class="turntag">دور فريق · ${team(game.turn)}</strong></div>${button('توزيع اللاعبين','rosters')}<b>${escapeHtml(game.title||'')}</b>${game.pit?'الحفرة مفعّلة':''}${button('مباراة جديدة'+navIcon('replay'),'new','class="newMatchNav"')}${matchNav(true)}</div><section class="board score-card-page-wrapper">${game.cats.map(id=>{const c=categories.find(x=>x.id===id),items=(game.deck||questions).filter(q=>q.categoryId===id);return `<article class="grid grid-cols-3 items-stretch justify-center">${column([items[0],items[2],items[4]],'scoreLeft')}<div class="overflow-hidden relative cover">${poster(c)}<b>${c.name}</b></div>${column([items[1],items[3],items[5]],'scoreRight')}</article>`}).join('')}</section><div class="scorestrip">${boardTeam(0)}<div class="boardcount">الأسئلة المتبقية<strong>${matchQuestionCount()-game.used.length} / ${matchQuestionCount()}</strong></div>${boardTeam(1)}</div></div>`
}
function boardTeam(i){
 const name=escapeHtml(game.names[i]);
 const adjust=(sign,label)=>button(sign,'score:'+i+':'+label,'aria-label="'+(label==='plus'?'زيادة':'خصم')+' 100 نقطة · '+name+'"');
 const icons=(game.aids?.[i]||[]).map(k=>{
  const ready=!game.current&&i===game.turn&&k==='pit'&&!game.spent[i].includes(k);
  const title=aids[k][0]+' · '+(game.spent[i].includes(k)?'مستخدمة':k==='pit'?'قبل كشف السؤال':'بعد كشف السؤال');
  return button(aidIcon(k),'aid:'+k,'title="'+title+'" aria-label="'+title+'" '+(ready?'':'disabled'));
 }).join('');
 return '<section class="footTeam"><div class="scorebox"><b class="nameplate">'+name+'</b><div class="scorevalue">'+adjust('+','plus')+'<output dir="ltr">'+game.scores[i]+'</output>'+adjust('−','minus')+'</div></div><div class="footHelp"><b>وسائل المساعدة</b><div>'+icons+'</div></div></section>'
}
function finish(correct){if(!game.current||game.used.includes(game.current))return;const q=(game.deck||questions).find(x=>x.id===game.current);if(correct)game.scores[game.actor]+=q.points;if(correct&&game.pit&&game.actor===game.turn)game.scores[1-game.turn]-=q.points;if(game.trap&&(!correct||game.actor!==1-game.turn))game.scores[1-game.turn]-=q.points;game.pit=false;game.trap=false;game.note='';game.used.push(q.id);game.current=null;game.turn=1-game.turn;game.until=null;game.questionStage=null;game.paused=false;save()}
function miss(){if(!game.steal&&!game.shown){game.paused=false;game.steal=true;game.actor=1-game.turn;game.until=Date.now()+10000;save()}else{game.remaining=0;game.shown=true;game.questionStage='answer';game.paused=false;save()}}
function clock(){const el=document.getElementById('clock');if(!el||!game?.current)return;if(game.shown){el.textContent='تقييم الإجابة';return}const left=Math.ceil((game.paused?game.remaining:game.until-Date.now())/1000);if(left<=0){miss();return}el.textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0')}
function updatePicks(changed){
 const tray=document.getElementById('pickTray');
 const hint=document.getElementById('pickHint');
 let selected=[...app.querySelectorAll('[name=category]:checked')];
 hint.textContent='';
 if(selected.length>6){
  changed.checked=false;
  selected=selected.filter(input=>input!==changed);
  hint.textContent='اختر 6 فئات فقط. أزل إحدى الفئات لتختار غيرها.';
 }
 document.getElementById('count').textContent=selected.length+' / 6';
 tray.hidden=!selected.length;
 tray.innerHTML=selected.map(input=>{
  const c=categories.find(category=>category.id===input.value);
  return '<button type="button" class="miniPick" data-remove="'+c.id+'" aria-label="إزالة '+escapeHtml(c.name)+'"><span class="miniArt">'+poster(c)+'</span><b>'+escapeHtml(c.name)+'</b><i aria-hidden="true">×</i></button>';
 }).join('');
}
app.onchange=e=>{
 const input=e.target;
 if(input.name==='category'){
  updatePicks(input);
  if(input.checked&&app.querySelectorAll('[name=category]:checked').length===6){
   const heading=document.getElementById('teamHeading');
   heading.focus({preventScroll:true});
   heading.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
 }else if(['aids0','aids1'].includes(input.name)){
  const error=document.getElementById('error');
  if(app.querySelectorAll('[name="'+input.name+'"]:checked').length>3){
   input.checked=false;
   error.textContent='يمكن اختيار 3 وسائل فقط لكل فريق. ألغِ إحدى الوسائل لتبديلها.';
  }else error.textContent='';
 }
};
app.onsubmit=e=>{e.preventDefault();const data=new FormData(e.target),cats=data.getAll('category'),names=[data.get('team0').trim(),data.get('team1').trim()];if(cats.length!==6||names.some(n=>!n)){document.getElementById('error').textContent='أدخل اسمي الفريقين واختر ست فئات بالضبط.';return}const selected=[0,1].map(i=>data.getAll('aids'+i));if(selected.some(list=>list.length!==3)){document.getElementById('error').textContent='اختر ثلاث وسائل مساعدة لكل فريق.';return}reserveMatch({cats,names,title:data.get('title').trim(),players:splitPlayers,aids:selected,spent:[[],[]],scores:[0,0],turn:0,current:null,used:[]})};
app.addEventListener('input',e=>{if(e.target.name==='player')resetDraw()});
app.onclick=e=>{
 if(!game && e.target.closest('[data-reset-pools]')){
  if(!confirm('هل تريد استعادة المجموعات الـ5 لكل فئة؟ قد تظهر الأسئلة السابقة مجددًا.'))return;
  try{localStorage.setItem(key,JSON.stringify({version:3,match:null,pools:{}}))}
  catch{alert('تعذّر حفظ إعادة الضبط. حاول مجددًا.');return}
  poolCounts={};
  for(const input of app.querySelectorAll('[name=category]')){
   input.disabled=false;
   input.closest('.pickcard').querySelector('.poolBadge').textContent='باقي 5 / 5';
  }
  document.getElementById('pickHint').textContent='تمت استعادة المجموعات الـ5 لكل فئة.';
  return;
 }
 if(e.target.closest('[data-guide]')){
  const dialog=document.createElement('dialog');
  dialog.className='catdialog powerGuide';
  dialog.setAttribute('aria-labelledby','powerGuideTitle');
  dialog.innerHTML='<h2 id="powerGuideTitle">شرح وسائل المساعدة</h2><p>اختر 3 وسائل لكل فريق. يمكن استخدام كل وسيلة مرة واحدة في المباراة.</p>'+Object.entries(aids).map(([id,[name]])=>'<article>'+aidIcon(id)+'<div><h3>'+name+'</h3><small>'+(id==='pit'?'قبل اختيار السؤال':'بعد كشف السؤال')+'</small><p>'+aidRules[id]+'</p></div></article>').join('')+'<form method="dialog"><button>إغلاق</button></form>';
  document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();return
 }
 const step=e.target.closest('[data-step]');if(step){resizeRoster(Number(step.dataset.step));return}
 if(e.target.closest('[data-add-player]')){document.querySelector('#drawInputs').hidden=false;resizeRoster(1);resetDraw();document.querySelector('#playerFields input:last-child').focus();return}
 if(e.target.closest('[data-split]')){splitTeams();return}
 const remove=e.target.closest('[data-remove]');
 if(remove){
  const input=[...app.querySelectorAll('[name=category]')].find(el=>el.value===remove.dataset.remove);
  if(input){input.checked=false;updatePicks(input);input.focus({preventScroll:true})}
  return
 }
 const info=e.target.closest('[data-info]');
 if(info){
  const c=categories.find(item=>item.id===info.dataset.info);
  const dialog=document.createElement('dialog');
  dialog.className='catdialog';
  dialog.innerHTML='<h2>'+escapeHtml(c.name)+'</h2><p>'+escapeHtml(c.description)+'</p><p>'+questions.filter(q=>q.categoryId===c.id).length+' أسئلة في البنك</p><form method="dialog"><button>إغلاق</button></form>';
  document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();return
 }
 const a=e.target.closest('[data-action]')?.dataset.action;if(a==='theme'){
  preferredTheme=isLight()?'dark':'light';
  try{localStorage.setItem('arena-theme',preferredTheme)}catch{}
  if(game){game.lightQuestions=isLight();save()}else{
   document.body.classList.toggle('homeNight',!isLight());
   const control=e.target.closest('[data-action]');control.setAttribute('aria-pressed',String(!isLight()));control.firstElementChild.textContent=isLight()?'☾':'☀'
  }
  return
 }
 if(!a||!game)return;if(a==='rosters'){
  const dialog=document.createElement('dialog');
  dialog.className='catdialog';
  dialog.setAttribute('aria-label','توزيع اللاعبين');
  dialog.classList.add('rosterDialog');
  dialog.innerHTML='<h2>توزيع اللاعبين</h2>'+rosterColumns(game.players,game.names)+'<form method="dialog"><button>إغلاق</button></form>';
  document.body.append(dialog);
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  dialog.showModal();return
 }
 if(a==='viewBoard'||a==='leaveMatch'){
  if(game.current&&!game.shown&&!game.paused){game.remaining=Math.max(1,game.until-Date.now());game.paused=true}
  game.away=a==='leaveMatch';game.reviewBoard=a==='viewBoard';save();return
 }
 if(a==='resumeMatch'){game.away=false;game.reviewBoard=false;save();return}
 if(a==='endMatch'){confirmEnd();return}
 if((game.ended||game.used.length===matchQuestionCount())&&a==='resultExit'){game=null;loadMatchBank();splitPlayers=[[],[]];save();return}
 if((game.ended||game.used.length===matchQuestionCount())&&a==='replay'){
  const {names,cats,title,players,aids,lightQuestions}=game;
  reserveMatch({names,cats,title,players,aids,lightQuestions,scores:[0,0],turn:0,current:null,used:[],spent:[[],[]]});return
 }
 if(/^score:[01]:(plus|minus)$/.test(a)&&!game.current&&game.used.length<matchQuestionCount()){const [,team,dir]=a.split(':');game.scores[Number(team)]+=dir==='plus'?100:-100;save();return}if(a.startsWith('aid:')){useAid(a.slice(4));return}if(a==='new'){if(game.used.length===matchQuestionCount()||confirm('إنهاء المباراة الحالية وبدء مباراة جديدة؟')){game=null;loadMatchBank();splitPlayers=[[],[]];save()}return}if(a.startsWith('pick:')&&!game.current&&!game.used.includes(a.slice(5))){Object.assign(game,{questionStage:'question',paused:false,current:a.slice(5),actor:game.turn,steal:false,shown:false,until:Date.now()+60000});save();return}if(!game.current)return;
 const stage=game.questionStage||(game.shown?'answer':'question');
 if(a.startsWith('award:')&&stage==='choose'){
  const winner=a.slice(6);
  if(!['0','1','none'].includes(winner)||(game.trap&&winner===String(game.turn)))return;
  if(winner!=='none')game.actor=Number(winner);
  finish(winner!=='none');return
 }
 if(a==='choose'&&stage==='answer'){game.questionStage='choose';save();return}
 if(a==='backAnswer'&&stage==='choose'){game.questionStage='answer';save();return}
 if(a==='backQuestion'&&stage==='answer'){game.shown=false;game.questionStage='question';game.remaining=Math.max(1000,game.remaining||1000);game.paused=true;save();return}
 if(stage!=='question')return;
 if(!game.paused&&Date.now()>=game.until){miss();return}
 if(a==='pause'){if(game.paused){game.until=Date.now()+game.remaining;game.paused=false}else{game.remaining=game.until-Date.now();game.paused=true}save()}
 if(a==='restart'){game.remaining=(game.steal?10:60)*1000;game.until=Date.now()+game.remaining;game.paused=false;save()}
 if(a==='answer'){game.remaining=game.paused?game.remaining:Math.max(0,game.until-Date.now());game.shown=true;game.questionStage='answer';save()}
 if(a==='miss')miss()
};

render();setInterval(clock,250);


function confirmEnd(){
 const d=document.createElement('dialog');
 d.className='endDialog';
 d.innerHTML='<form method="dialog"><div><strong>إنهاء اللعبة</strong><button value="cancel" aria-label="إغلاق">×</button></div><p>هل تريد إنهاء اللعبة واعتماد النتيجة الحالية؟</p><section><button value="end">إنهاء اللعبة</button><button value="cancel" autofocus>تكملة</button></section></form>';
 const running=game.current&&!game.shown&&!game.paused;
 if(running){game.remaining=Math.max(1,game.until-Date.now());game.paused=true;save()}
 document.body.append(d);
 d.addEventListener('close',()=>{
  if(d.returnValue==='end'){game.ended=true;game.current=null;game.until=null}
  else if(running){game.until=Date.now()+game.remaining;game.paused=false}
  d.remove();save()
 },{once:true});d.showModal()
}
function resultView(){
 const tied=game.scores[0]===game.scores[1],winner=game.scores[0]>game.scores[1]?0:1;
 return '<section class="resultStage"><div class="party left" aria-hidden="true">🎉</div><div class="party right" aria-hidden="true">🎉</div><div class="resultLogo">تحدّي الفريقين</div><h1>'+(tied?'تعادل الفريقان':'مبروك الفوز!')+'</h1><h2>'+(tied?'للفريقين':escapeHtml(game.names[winner]))+'</h2><div class="resultTeams">'+game.names.map((n,i)=>'<article><b>'+escapeHtml(n)+'</b><strong dir="ltr">'+game.scores[i]+'</strong></article>').join('')+'</div><small>الأسئلة المحسومة · '+game.used.length+' / '+matchQuestionCount()+'</small><div class="resultActions">'+button('الخروج','resultExit')+button('العب مرة ثانية','replay')+'</div></section>'
}
