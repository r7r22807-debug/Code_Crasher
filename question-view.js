function questionView(q,c){
 const stage=game.questionStage||(game.shown?'answer':'question'),team=i=>escapeHtml(game.names[i]);
 const nav=matchNav(false);
 const head='<div class="topline"><div class="mast"><b class="wordmark">تحدّي<br>الفريقين</b><strong class="turntag">دور فريق · '+team(game.actor)+'</strong></div>'+button('توزيع اللاعبين','rosters')+'<b>'+escapeHtml(game.title||'')+'</b>'+nav+'</div>';
 const side='<aside class="qScores">'+game.names.map((name,i)=>'<section><b class="nameplate">'+team(i)+'</b><strong>'+game.scores[i]+'</strong><h3>وسائل المساعدة</h3><div class="qPowers">'+(game.aids?.[i]||[]).map(k=>button(aidIcon(k),'aid:'+k,'title="'+aids[k][0]+'" aria-label="'+aids[k][0]+'" '+(i!==game.actor||stage!=='question'||game.spent[i].includes(k)||k==='pit'||(k==='trap'&&game.steal)?'disabled':''))).join('')+'</div></section>').join('')+'</aside>';
 let content,controls;
 if(stage==='question'){
  content='<div class="qTimer">'+button(game.paused?'▶':'Ⅱ','pause','aria-label="بدء أو إيقاف المؤقت"')+'<strong id="clock"></strong>'+button('↻','restart','aria-label="إعادة المؤقت"')+'</div><h1>'+escapeHtml(q.text)+'</h1>';
  if(q.followUp)content+='<section class="expertPart"><b>الجزء الثاني · يلزم الجوابان لنيل النقاط</b><p>'+escapeHtml(q.followUp.prompt)+'</p></section>';
  content+=questionArt(q,c);
  if(q.type==='multiple')content+='<div class="quizOptions">'+q.options.map((option,i)=>'<span>'+ (i+1)+' · '+escapeHtml(option)+'</span>').join('')+'</div>';
  if(q.type==='charades')content+='<details class="actorCard"><summary>للممثّل فقط · افتح البطاقة بعيداً عن الفريق</summary><b>'+escapeHtml(q.answer)+'</b><p>أغلق البطاقة قبل أن تبدأ التمثيل.</p></details>';
  controls=button('الإجابة','answer','class="qPrimary"')+(!game.steal?button('تمرير للخصم','miss','class="secondary"'):'');
 }else if(stage==='answer'){
  content='<small>الإجابة الصحيحة</small><h1>'+escapeHtml(q.answer)+'</h1><p class="qExplanation">'+escapeHtml(q.explanation)+'</p>';
  if(q.followUp)content+='<section class="expertPart"><b>جواب الجزء الثاني</b><p>'+escapeHtml(q.followUp.answer)+'</p></section>';
  content+=questionArt(q,c,true);
  if(q.source)content+='<a class="sourceLink" href="'+escapeHtml(q.source[1])+'" target="_blank" rel="noopener noreferrer">المصدر · '+escapeHtml(q.source[0])+'</a>';
  controls=button('أي فريق؟','choose','class="qPrimary"')+button('ارجع للسؤال','backQuestion','class="secondary"');
 }else{
  content='<h1>أي فريق جاوب صح؟</h1><div class="awardTeams">'+game.names.map((name,i)=>button(team(i),'award:'+i,game.trap&&i===game.turn?'disabled':'')).join('')+button('ولا أحد','award:none','class="nobody"')+'</div>';
  controls=button('العودة للإجابة','backAnswer','class="secondary"');
 }
 const note=[game.pit?'الحفرة مفعّلة':'',game.note].filter(Boolean).join(' · ');
 return '<div class="arena questionArena '+(isLight()?'':'nightQ')+'">'+head+'<div class="qLayout">'+side+'<section class="qFrame"><span class="qPoints">'+q.points+' نقطة · '+({200:'سهل',400:'متوسط',600:'صعب'}[q.points]||'')+'</span><div class="qContent">'+content+(note?'<p class="qNote">'+escapeHtml(note)+'</p>':'')+'</div><div class="qControls">'+controls+'<span class="qCategory">'+escapeHtml(c.name)+'</span></div></section></div></div>'
}
