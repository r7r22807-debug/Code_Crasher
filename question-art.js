// Pexels photo IDs are also the filenames of the bundled JPEGs.
const scenePhotos = {
 dojo:38678664, coins:157519, detective:6980885, woods:12759812, parchment:34217713, harbor:4253981,
 stage:1117132, desert:9263137, courtyard:18996925, atlas:8828668,
 kitchen:12908575, sky:39378278, field:139762, screen:18848524,
 lab:256262, studio:34217713, weave:34217713, habitat:355465
};
// Match only public clue details. Never consult the answer or private acting card.
const cluePhotos = [
 [/جرة رمل|يحمل قرعة/,34113261],
 [/ضفدع|ضفادع/,36469989],
 [/رامن/,23658622], [/مروحة/,27579370], [/الدمى|دمية/,28625791],
 [/الحشرات|حشرة/,8155497], [/سياف|سيوف|بسيف|سيفه/,35464782],
 [/كمان/,31217113], [/سهام|بقوس/,6669392], [/شطرنج/,17768375],
 [/البحر|المحيط|بحري|الأمواج/,13122991], [/فرسان|حصان|صهوة/,15290526],
 [/ريش|جناح/,7752999], [/البئر|بئر|الجبّ/,33130942],
 [/العملة|عملة|النقود/,157519], [/الشريط|الأشرطة|الألوان/,36226281]
];
function legacyQuestionArt(q,c){
 const id=c.id, text=q.text;
 let scene='studio';
 if(['ahl','battles','companions','whoali','shiahist','shiainfo','shiaperson','actali','mokhtar'].includes(id))scene='parchment';
 else if(['prophetera','whoprophet','prophetlife','yusufshow','actprophet'].includes(id))scene=/كتاب|سورة|رؤيا/.test(text)?'parchment':'desert';
 else if(id==='money')scene='coins';
 else if(['capitals','flagcolor','flagsnew'].includes(id))scene='atlas';
 else if(['whopirate','onepiece'].includes(id))scene='harbor';
 else if(['whonin','naruto'].includes(id))scene='dojo';
 else if(['thrones','whomartin','martin'].includes(id))scene='courtyard';
 else if(id==='dishes')scene='kitchen';
 else if(q.type==='charades'||id==='bean')scene='stage';
 else if(id==='whoanime')scene='screen';
 // Use only subjects named in the public clue to choose a closer setting.
 if(/كواكب|كوكب|الفضاء|الأجرام/.test(text))scene='sky';
 else if(/العنصر|الكهربائي|التردد|الغاز|المعدن|الضغط الجوي/.test(text))scene='lab';
 else if(/كرة السلة|الغولف|المسبح|كرة القدم/.test(text))scene='field';
 else if(/شكل|أضلاع|مربعات|ضرب|المضلع/.test(text))scene='weave';
 else if(/الأنهار|السفينة|البحر|الأسماك/.test(text))scene='harbor';
 if (/كونان|الجرائم|المحقق/.test(text)) scene='detective';
 else if(id==='whoanimal') scene='habitat';
 const photo=cluePhotos.find(([pattern])=>pattern.test(text))?.[1] || scenePhotos[scene];
 return '<img class="questionScene" src="question-photos/'+photo+'.jpg" alt="" decoding="async">';
}

function questionArt(q,c,revealed=false){
 if(!currentPhotoCategories.has(c.id))return legacyQuestionArt(q,c);
 if(!/^[a-z]+-(?:pool-)?[0-9]+$/.test(q.id))return '';
 const image='<img class="questionScene" src="question-media/'+q.id+'.jpg" alt="" decoding="async">';
 if(revealed)return image;
 if(c.id==='flagcolor')return '<div class="flagColourClue">'+image+'</div>';
 if(q.id==='whonin-3')return '<div class="clueCrop sandScene">'+image+'</div>';
 if(q.type==='charades'||c.id.startsWith('who')||c.id==='shiaperson')
  return '<div class="clueCrop">'+image+'</div>';
 return image;
}
const currentPhotoCategories=new Set('ahl battles martin onepiece anime series thrones toon quiz characters dishes bean companions prophetera naruto whoanime whomartin whonin whopirate whoali whoanimal whoprophet prophetlife shiainfo actali actprophet mokhtar yusufshow shiaperson shiahist money capitals flagsnew flagcolor'.split(' '));

