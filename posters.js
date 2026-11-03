const drawings={
 geography:'<circle cx="80" cy="80" r="54" fill="#70cbdf"/><path d="m38 48 22-15 19 6-8 12 9 7-12 12-15-2-9 9-12-8zm35 31 21 4 12 14-11 12-9 21-8-7 1-15-10-11zm28-38 16 11 14 23-12 6-9-10-12 2-6-12z" fill="#68b57d"/><path d="M121 24c57 62-2 137-67 112M81 141v14m-26 2h53" fill="none" stroke-width="7"/>',
 sky:'<g transform="rotate(-24 80 84)"><circle cx="80" cy="84" r="44" fill="#f6bb70"/><path d="M44 63q34 14 75 3M39 80q47 17 85 2" fill="none" stroke="#ca8054" stroke-width="6"/><path d="M39 70C-16 81 1 110 86 108c90-1 98-33 38-37l2 8c49 4 22 18-41 19S8 88 38 81z" fill="#e59280"/></g><path d="m121 19 3 9 9 3-9 3-3 9-3-9-9-3 9-3z" fill="#fff3b5"/>',
 animals:'<path d="M18 85q10-34 51-32 30 0 44 30 13 2 17-15 9 2 11 12 7-5 13-4-1 24-31 31-20 30-63 22-46-7-42-44z" fill="#648aba"/><path d="M21 96q22 18 45 9 27-8 49 5-22 24-58 17-24-4-36-31z" fill="#dceaf2"/><circle cx="48" cy="80" r="4"/><path d="M51 52q0-29-13-22m14 20q2-35 18-29" stroke="#599ec0" stroke-width="5" fill="none"/>',
 chemistry:'<path d="M60 25h40v9h-7v36l36 58q6 12-8 14H39q-14-2-8-14l36-58V34h-7z" fill="#ecf7f6"/><path d="m49 110 9-16q13-7 25 0 13 7 21-2l21 38q2 7-7 7H42q-8 0-5-7z" fill="#60b7a0"/><circle cx="73" cy="110" r="5" fill="#cbead4"/><circle cx="92" cy="121" r="7" fill="#cbead4"/><circle cx="79" cy="13" r="5" fill="#7dc9bd"/>',
 math:'<g transform="rotate(-10 80 83)"><rect x="33" y="20" width="94" height="128" rx="10" fill="#efa263"/><rect x="43" y="32" width="74" height="29" rx="4" fill="#c8e1d6"/><path d="M51 81h18m-9-9v18m28-9h18m-54 23 15 15m0-15-15 15m37-11h17m-17 9h17" stroke-width="6" fill="none"/></g>',
 language:'<path d="M13 30h90q9 0 9 10v48q0 9-9 9H55l-23 18 4-18H20q-9 0-9-10V41z" fill="#f7b958"/><path d="M71 85h68q8 0 8 8v34q0 9-9 9h-8l3 15-22-15H72q-8 0-8-8V94z" fill="#70bdb0"/><text x="61" y="76" text-anchor="middle" font-size="33" stroke="none" fill="#283945">أب</text><text x="105" y="121" text-anchor="middle" font-size="26" stroke="none" fill="#283945">Aa</text>'
};
const atlasOrder=["ahl","battles","martin","onepiece","anime","series","thrones","toon","quiz","characters","dishes","bean","companions","prophetera","naruto","whoanime","whomartin","whonin","whopirate","whoali","whoanimal","whoprophet","prophetlife","shiainfo","actali","actprophet","mokhtar","yusufshow","shiaperson","shiahist","money","capitals","flagsnew","flagcolor"];
function poster(c){
 const replacement={mokhtar:'mokhtar-art.jpg',yusufshow:'yusuf-art.jpg'}[c.id];
 if(replacement)return '<svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><image href="'+replacement+'" width="100" height="100" preserveAspectRatio="xMidYMid slice"/></svg>';

 const tile=atlasOrder.indexOf(c.id);
 if(tile>=0){const x=tile%6,y=Math.floor(tile/6);return '<svg aria-hidden="true" viewBox="'+x+' '+y+' 1 1" preserveAspectRatio="xMidYMid slice" overflow="hidden"><svg x="'+x+'" y="'+y+'" width="1" height="1" viewBox="'+x+' '+y+' 1 1" overflow="hidden"><image href="category-art.png" width="6" height="6"/></svg></svg>'}
 const drawing=drawings[c.id]||'<text x="80" y="110" text-anchor="middle" font-size="87" stroke="none">'+c.emoji+'</text>';return '<svg aria-hidden="true" viewBox="0 0 160 170"><g stroke="#293741" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">'+drawing+'</g></svg>'}
Object.assign(drawings,{
 ahl:'<path d="M23 117h114v25H23z" fill="#d5b37b"/><path d="M44 116V88q0-23 36-46 35 24 35 46v28z" fill="#58a88d"/><path d="M80 42V25m0 2 23 4-23 8" fill="#e8bb56"/><path d="M23 116V57h12v59zm102 0V57h12v59z" fill="#edd7a5"/><path d="m20 57 9-18 9 18zm102 0 9-18 9 18z" fill="#49987f"/>',
 battles:'<path d="m27 37 11 2 81 84-7 7-84-83zm104 0-11 2-81 84 7 7 84-83z" fill="#d6e3ea"/><path d="m29 115 25 22m54-2 25-22" stroke-width="9" stroke="#bb8947"/><path d="M48 63q19 1 32-12 15 13 33 12v36q-5 24-33 39-28-15-32-39z" fill="#779c88"/><path d="m80 69 9 21-9 20-9-20z" fill="#edc676"/>',
 martin:'<path d="M25 135V89h24v-18h18v16h25V61h23v27h20v47z" fill="#b5a5a1"/><path d="m86 61 18-29 18 29zm-44 10 16-24 15 24z" fill="#a44950"/><path d="M68 135v-19q12-22 24 0v19" fill="#596477"/><path d="M104 33V16l28 5-28 8" fill="#ce6954"/>',
 onepiece:'<ellipse cx="80" cy="105" rx="66" ry="19" fill="#e3af56"/><path d="M35 99q5-62 44-62 40 0 47 62-45 18-91 0z" fill="#f4cd7c"/><path d="m37 83-2 14q44 19 91 0l-4-14q-40 16-85 0z" fill="#d55949"/>',
 anime:'<path d="m15 71 28-8-14-28 32 12 12-29 16 29 31-18-6 32 32 9-25 20 15 29-36-6-18 32-13-27-35 13 8-34z" fill="#fab85d"/><path d="m89 48-36 43h24l-8 30 39-48H85z" fill="#ed645d"/>',
 series:'<rect x="18" y="60" width="124" height="79" rx="9" fill="#516878"/><path d="m18 60-4-19 120-22 4 19z" fill="#f6e2bd"/><path d="m34 37 15 15m12-20 15 16m12-21 15 16" stroke-width="8"/><path d="m68 81 29 17-29 17z" fill="#eea175"/>',
 thrones:'<path d="m38 110-5-57 21 22-5-44 22 35 8-51 11 51 23-36-6 45 22-23-8 58z" fill="#99acba"/><path d="M38 99h84v13H38zm10 13h64l9 29H39z" fill="#657989"/><path d="m57 64 21 36m24-36-21 36" fill="none"/>',
 toon:'<circle cx="81" cy="83" r="40" fill="#75b6cb"/><path d="M44 75C4 88 5 118 83 102c74-15 78-46 34-39l4 8c27-1 1 14-41 23-44 9-58 6-35-7z" fill="#f7c567"/><path d="m122 23 4 10 11 3-10 6-1 10-8-7-11 2 5-11-5-8z" fill="#e88b65"/>',
 quiz:'<rect x="30" y="34" width="100" height="112" rx="12" fill="#fbebca"/><rect x="57" y="25" width="46" height="18" rx="7" fill="#de9565"/><path d="m42 76 7 7 13-16m-20 40 7 7 13-16" fill="none" stroke="#498e76" stroke-width="6"/><path d="M73 77h40m-40 31h40" stroke-width="5"/>',
 characters:'<path d="m35 77-12-23 23 5-4-26 22 11 11-24 13 20 29-12-4 24 26 6-17 25-5 32-29 22-30-9-19-25z" fill="#526779"/><path d="m44 78 20-18 2 14 20-17 1 15 18-13 13 17-6 31-27 20-25-11-14-17z" fill="#efbd98"/><path d="m57 85 13 4m22 0 12-5m-30 22 12 1" fill="none" stroke-width="4"/>',
 dishes:'<ellipse cx="80" cy="123" rx="60" ry="11" fill="#f4cf86"/><path d="M25 114q5-55 55-55t55 55z" fill="#9cc8c3"/><circle cx="80" cy="53" r="8" fill="#cf9766"/><path d="M43 97q8-20 24-25" stroke="#e1f1e5" stroke-width="6" fill="none"/>',
 bean:'<path d="m24 143 6-54 30-24 20 7 20-7 30 24 6 54z" fill="#aa906d"/><path d="m57 69 24 65 23-65-23 7z" fill="#fbf2df"/><path d="m75 81 6-5 6 5-3 9 6 24-10 15-8-16 7-23z" fill="#b24546"/><path d="m54 68-11 20 14 5-8 9 31 32m25-66 12 20-14 5 8 9-30 32" fill="none"/><path d="m53 44 12-6q7 7 15 2 9 5 17-3l12 7q-9 13-29 6-18 6-27-6z" fill="#513d31"/>'
});
const bookArt='<path d="M16 47q33-11 63 7 31-18 65-7v78q-30-10-65 7-31-17-63-7z" fill="#e9c385"/><path d="M23 42q26-8 56 10 28-18 58-10v75q-28-6-58 10-29-16-56-10z" fill="#fff0cf"/><path d="M79 53v73m-47-69 32 8m-32 7 32 8m34-14 29-9m-29 24 29-9" fill="none"/>';
const bannerArt='<path d="M45 143V28" stroke-width="7"/><circle cx="45" cy="23" r="6" fill="#e9bb64"/><path d="M48 33q32-17 66 0l20-5-10 25 9 24q-19 9-36 0-23-11-49 1z" fill="#568f83"/>';
const spiralArt='<path d="m22 85 34-30 63 1 19 30-24 27-65-1z" fill="#547489"/><rect x="45" y="60" width="70" height="43" rx="8" fill="#d3dfe2"/><path d="M64 90q11-30 26-23 15 10-2 21-13 6-10-7 3-7 8-4m-25 15h30" fill="none"/>';
const pawArt='<path d="M44 102q5-14 17-22 16-23 31-3l20 23q10 25-13 27l-20-5-18 6q-23 0-17-26z" fill="#d3a573"/><g fill="#b08361"><ellipse cx="40" cy="76" rx="11" ry="17"/><ellipse cx="62" cy="54" rx="11" ry="17"/><ellipse cx="88" cy="50" rx="11" ry="17"/><ellipse cx="114" cy="67" rx="11" ry="17"/></g>';
const coinArt='<g fill="#eeb853"><ellipse cx="69" cy="113" rx="42" ry="16"/><path d="M27 98v14q37 24 84 0V98z"/><ellipse cx="69" cy="98" rx="42" ry="15"/><circle cx="102" cy="72" r="34" fill="#ffda74"/><circle cx="102" cy="72" r="26" fill="none"/><path d="m102 54 7 12 14 3-11 10 1 13-11-7-12 7 2-14-10-9 14-3z" fill="#cf8d37"/></g>';
const secondaryMark=(art,symbol,color)=>art+'<g transform="translate(118 125)"><circle r="23" fill="'+color+'"/><text text-anchor="middle" y="8" font-size="26" font-weight="bold" fill="#293741" stroke="none">'+symbol+'</text></g>';
Object.assign(drawings,{
 companions:secondaryMark(bannerArt,'✦','#efc46d'),prophetera:secondaryMark(bookArt,'☾','#9bceb5'),naruto:spiralArt,
 whoanime:secondaryMark(drawings.anime,'؟','#f7d58c'),whomartin:secondaryMark(drawings.martin,'؟','#e2b0a1'),
 whonin:secondaryMark(spiralArt,'؟','#c8dce7'),whopirate:secondaryMark(drawings.onepiece,'؟','#f4cb85'),
 whoali:secondaryMark(drawings.battles,'؟','#bee3c4'),whoanimal:secondaryMark(pawArt,'؟','#eccb8c'),
 whoprophet:secondaryMark(bookArt,'؟','#b1d6c2'),prophetlife:bookArt,shiainfo:secondaryMark(drawings.ahl,'؟','#f6cc89'),
 actali:secondaryMark(bannerArt,'✋','#f4ccb2'),actprophet:secondaryMark(bookArt,'✋','#c7dfc9'),
 mokhtar:secondaryMark(drawings.series,'⚔','#c5d6b2'),yusufshow:secondaryMark(drawings.series,'☀','#f4d794'),
 shiaperson:secondaryMark(drawings.ahl,'✦','#d6b5db'),shiahist:secondaryMark(bookArt,'⌛','#eed2a6'),
 money:coinArt,capitals:secondaryMark(drawings.geography,'★','#f6ce83'),flagsnew:bannerArt,
 flagcolor:'<path d="M35 140V28" stroke-width="7"/><path d="M39 35h86l-9 17H39z" fill="#dc7d72"/><path d="M39 52h77l-7 14 8 6H39z" fill="#fff0c9"/><path d="M39 72h78l9 18H39z" fill="#63aa87"/><path d="m89 124 30-39 9 8-32 37-12 6z" fill="#d9a15c"/>'
});
/* Flat inked cutouts for the current category collection. */
const ink=(d,fill='none')=>'<path d="'+d+'" fill="'+fill+'"/>';
const place=(art,x=0,y=0,s=1,r=0)=>'<g transform="translate('+x+' '+y+') rotate('+r+') scale('+s+')">'+art+'</g>';
function figure(hair,coat,trim,skin='#efbf9c',style='spikes'){
 const head=ink('M53 46Q49 13 80 12q34 1 31 37l-5 26-16 14-16-1-17-16z',skin);
 const hairstyles={
 spikes:'M49 52 35 30l16 7-9-24 18 11-1-20 14 14 9-18 4 18 20-15-5 17 20-5-13 17 15 1-14 19-2-16-16 7-2-11-14 14-3-11-13 17z',
 crop:'M50 53Q38 17 68 10q21-11 42 9l9 15-10 21-5-22-12 6-3-8-18 8 1-8-15 16z',
 bob:'M45 81q-9-66 18-70 48-18 52 35l6 41-16-8-6-44-12 14-4-11-18 13-7 29z',
 wave:'M45 56Q32 36 45 24q-6-15 11-16 7-14 23-6 13-7 22 4 22-2 18 18 11 10-3 26l-10-15-8 6-5-14-12 14-7-11-13 14-4-6z'
 };
 return ink('M16 178l8-53q3-17 28-24l17-8h23l17 9q22 4 28 27l11 49z',coat)+ink('M69 78v16l-8 9 17 27 24-26-12-11V77',skin)+head+ink(hairstyles[style],hair)+ink('m51 103 13-8 15 31-14 10-14-21m47-20 13 8-17 31-14-9z',trim)+ink('m79 127-2 49m-42-47 4 46m84-44-1 44')+ink('m43 148 18 5-18 4zm64-34 14 2-2 7-13-2z',trim)
}
const straw=ink('M36 37Q43-3 78 2q29 0 36 32l18 5q6 7-29 10-47 6-77-3-8-5 10-9z','#eac575')+ink('m39 29 72-3 4 9q-38 10-78 3z','#cf5148');
const ninja=figure('#eac35a','#ec9152','#455366')+ink('m49 32 59-3 1 13-58 6z','#566574')+ink('m63 33 32-2 1 10-33 2z','#c4d3d9')+ink('m73 39q9-11 13-3-1 6-7 3');
const pirate=figure('#302f36','#af4347','#efd6a5','%SKIN%','crop').replaceAll('%SKIN%','#f1bf99')+straw;
const detective=figure('#38302e','#486d95','#eee8d1','#efbd98','wave')+ink('m64 110 13 4 12-9 3 14-14-2-12 7z','#cf5349')+ink('M53 49h23l-2 12H58zm27 0h22l-4 12H84zm-5 3h6','#c3dde3');
const knight=figure('#5e433b','#5c6c70','#867563','#dfae89','wave')+ink('m51 103 18-9 11 12 15-12 22 8-8 16-35 7z','#454449');
const scroll=ink('M31 35q12-12 23 0l73 9-10 75q10 8 0 17-7 5-16 1l-75-12q-12-6-3-15l8-63q-10-4 0-12z','#f2d59b')+ink('m33 44 87 13m-81 9 60 9m-64 2 45 8m-45 6 53 10m-58 10 70 11');
const lantern=ink('m52 53 20-13q-2-15 8-16 10 1 8 16l19 13 9 9-8 5-7 54-20 16-26-13-9-58-7-4z','#ba884a')+ink('m53 66 51 1-8 51-17 12-18-11z','#ffc766')+ink('m63 66 8 54m19-52-4 54m-42-61 67 2');
const dome=ink('M12 158v-33h135v33z','#d6ae7e')+ink('M30 124q-11-26 13-48 24-16 38-44 9 24 33 42 29 24 14 50z','#5ba387')+ink('M81 33V12l25 5-25 9','#efb94b')+ink('M44 120q-8-26 17-53m28-6q20 35 14 57')+ink('M63 155v-11q16-24 32 0v11','#775840');
const sail=ink('m12 109 132 1-30 32-71 2z','#a96b47')+ink('m73 108 1-86 6-4v92','#c99359')+ink('m69 31-47 69q22-8 45 0z','#f3d49c')+ink('m84 31 40 65-39 4z','#e49462')+ink('M4 143q14-11 29 0t30 0 30 0 30 0 33-1v20H4z','#69aabd');
const sword=ink('m71 125 2-99 8-21 8 22-6 99z','#cbd9df')+ink('m51 120 52 2-2 9-18-3-2 26-10-1 2-26-21 1z','#c59d54')+ink('m81 27-5 85');
const flag=ink('M28 157V21h6v136z','#987656')+ink('M35 28q28-16 63 0 17 8 39-1l-10 20 12 26q-25 9-52-3-23-10-52 1z','#539485');
const quill=ink('M28 144Q50 60 126 17q-1 30-18 48l-19 8 9 2-15 17-17 2 8 4-29 19z','#7bb4b1')+ink('m27 150 77-108');
const globe=ink('M26 89a54 54 0 1 0 108 0 54 54 0 1 0-108 0z','#75b8cf')+ink('m34 64 21-18 23 3-7 14 10 4-7 14-20 2-9-11zm31 32 20-5 17 17-14 25-9-3-2-19zm35-43 19 10 9 19-16 4-11-13z','#86ac72');
const reel=ink('M19 56h123v88H19z','#4f6775')+ink('m18 56-4-18 122-23 4 18z','#f1ddae')+ink('m32 35 16 16m12-21 16 16m13-21 16 16')+ink('m71 79 30 18-30 18z','#faac72');
const book=ink('M12 45q30-11 67 6 34-20 69-10v86q-37-7-69 12-31-17-67-10z','#ba9256')+ink('M19 38q34-9 60 10 34-21 62-12v83q-35-5-62 13-32-17-60-10z','#fae4ba')+ink('m79 48 0 81M29 54l34 8m-34 7 33 7m31-13 30-11m-30 25 27-9');
const crown=ink('m20 58 31 23 28-48 28 48 30-25-12 58-90 2z','#edb858')+ink('m32 113 94-2-3 14-88 3z','#cd8a4d')+ink('m74 93 7-12 8 12-8 11z','#af5953');
const mask=ink('M27 49q53 22 107-2l-6 46q-11 36-48 49-38-18-47-50z','#ddd8bf')+ink('m43 73 26 8-8 8-17-5zm48 8 25-10-2 13-18 6z','#41464b')+ink('m61 109 38-4q-14 24-38 4z','#a95b55');
const scene=(back,front)=>place(back,-8,-6,.88,-4)+place(front,63,61,.68,7);
Object.assign(drawings,{
 ahl:place(dome,-6,-8,1.1),battles:scene(flag,sword),martin:scene(knight,crown),
 onepiece:place(figure('#628568','#465f61','#ddd1a3'),-21,25,.89)+place(pirate,49,4,.96),
 anime:place(figure('#33303a','#63905f','#ce6857'),-24,11,1)+place(figure('#d9dce0','#8d89ab','#e2dbea'),58,25,.9),
 series:scene(reel,mask),thrones:place(sword,0,-4,1,-14)+place(crown,23,55,.94),
 toon:scene(detective,ink('m12 76 45-14 25-49 18 38 46-3-27 36 12 41-42-12-34 30-1-46z','#f0c65f')),
 quiz:scene(book,quill),characters:place(figure('#211f2a','#e2924c','#516482'),-19,12,1)+place(figure('#4b3440','#7b9d9c','#b45459','#edba98','bob'),65,29,.9),
 dishes:ink('M9 92q70-23 143-2-6 51-66 58-62-2-77-56z','#df765c')+ink('M10 91q65-35 141-2-46 34-141 2z','#f5d9a1')+ink('m32 88q3-20 17-10t18-3 17 3 17-2 17 4m-17-5 42-60m-31 65 43-57'),
 bean:place(figure('#44352c','#a28c75','#fcf1d5','#e8bb9a','crop'),6,4,1.06)+ink('m85 119 8-2 2 10-3 7 7 22-9 10-6-10 3-22-5-7z','#b84142'),
 companions:scene(flag,lantern),prophetera:scene(dome,scroll),naruto:place(figure('#333646','#89859c','#76688a'),49,18,.97)+place(ninja,-22,6,1),
 whoanime:place(detective,-5,4,1.08),whomartin:place(knight,18,8,1.05)+place(sword,-22,74,.6,-18),
 whonin:place(ninja,10,2,1.14),whopirate:place(pirate,2,10,1.1),
 whoali:scene(sword,scroll),whoanimal:ink('M19 160q1-44 29-55L33 81l7-18-3-21 20 2 17-17 18 9 26-5 7 20 17 15-9 26-19 20q28 15 31 47z','#b77948')+ink('m49 65 17-13 31 1 18 17-5 29-23 20-25-8-18-24z','#edbe77')+ink('m62 80 8 1m22-1 8-2m-24 12 12-1-6 8z','#4c3f36'),
 whoprophet:scene(sail,scroll),prophetlife:scene(book,sail),shiainfo:scene(book,dome),actali:scene(flag,quill),actprophet:scene(sail,lantern),
 mokhtar:scene(sword,reel),yusufshow:scene(ink('M19 147V53l9-22 10 22v94zm30 0V40l9-22 9 22v107zm31 0V61l9-22 9 22v86z','#eab65a')+ink('m27 136 1-80m30 80V43m31 94V64'),reel),
 shiaperson:scene(lantern,quill),shiahist:scene(scroll,dome),
 money:ink('m14 68 110-34 20 66-110 36z','#84b193')+ink('m27 75 89-28 12 41-88 29z','#bdd4a2')+ink('M56 83a17 17 0 1 0 34 0 17 17 0 1 0-34 0z','#89ad81')+ink('M79 126a30 30 0 1 0 60 0 30 30 0 1 0-60 0z','#efbd60')+ink('m108 109 5 9 11 2-8 7 1 10-9-5-9 5 2-10-8-7 10-2z','#bd8947'),
 capitals:scene(globe,ink('m19 136 24-60 17 10 22-48 26 59 21-10 13 49z','#a9a5a1')+ink('m73 130 10-98 10 99m-23-27 28 1')),
 flagsnew:place(flag,75,-10,.74,18)+place(flag,-9,10,1.02,-7),
 flagcolor:place(flag,4,1,1.07)+ink('M43 45q24-9 51 1l4 10q-28-11-55-2z','#eaaa6e')+ink('m94 140 31-60 10 6-33 59-13 8z','#de855f')
});

