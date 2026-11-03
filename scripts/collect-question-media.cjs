const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const dir='question-media';fs.mkdirSync(dir,{recursive:true});
const manifestPath=dir+'/sources.json';
const manifest=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath)):{};
const changed={};
const used=new Set(Object.values(manifest).flatMap(x=>[x.url,x.hash]));
const bank=JSON.parse(fs.readFileSync('index.html','utf8').match(/id="bank"[^>]*>(.*?)<\/script>/s)[1]);
const ctx=vm.createContext(bank);vm.runInContext(fs.readFileSync('pool-content.js','utf8'),ctx);
const qs=vm.runInContext('questions.concat(categories.flatMap(extraQuestions))',ctx);
const cache=new Map(), sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function get(url){for(let i=0;i<3;i++){const r=await fetch(url,{headers:{'User-Agent':'ArabicTriviaMedia/1.0 (educational local quiz)'},signal:AbortSignal.timeout(25000)});if(r.ok)return r;if(![429,503,502].includes(r.status))throw Error(r.status+' '+url);await sleep(1500*(i+1));}throw Error('busy '+url);}
function cached(k,f){if(!cache.has(k))cache.set(k,f());return cache.get(k)}
async function episodes(id){return cached('tv'+id,async()=>{const data=await(await get('https://api.tvmaze.com/shows/'+id+'/episodes')).json();return data.filter(e=>e.image).map(e=>({url:e.image.original||e.image.medium,source:e.url,keywords:(e.name+' '+e.summary).toLowerCase()}));});}
async function commons(term){return cached('wc'+term,async()=>{
const params=new URLSearchParams({action:'query',generator:'search',gsrsearch:term+' filetype:bitmap',gsrnamespace:'6',gsrlimit:'50',prop:'imageinfo',iiprop:'url|size|mime',iiurlwidth:'960',format:'json'});
const data=await(await get('https://commons.wikimedia.org/w/api.php?'+params)).json();
return Object.values(data.query?.pages||{}).sort((a,b)=>a.index-b.index).filter(p=>{const i=p.imageinfo?.[0];return i?.mime==='image/jpeg'&&i.width>=640&&!/map of|locator|montage|collage|title page|text page|logo|chart|diagram|screenshot/i.test(p.title)}).map(p=>({url:p.imageinfo[0].thumburl,source:p.imageinfo[0].descriptionurl,keywords:p.title.toLowerCase()}));
});}
const subjects={
ahl:['Imam Husayn shrine architecture','Najaf shrine courtyard'],battles:['Kufa mosque courtyard','Islamic armor museum'],companions:['Great Mosque of Kufa Iraq','Najaf mosque interior'],whoali:['Najaf shrine courtyard','Great Mosque of Kufa Iraq'],shiahist:['Karbala shrine architecture','Najaf mosque interior'],shiainfo:['Shia mosque prayer hall','Karbala shrine interior'],shiaperson:['Qom seminary library','Qom shrine courtyard'],actali:['Islamic armor museum','Kufa mosque courtyard'],prophetera:['Hejaz landscape Medina mountains','Medina mosque architecture'],whoprophet:['Quran manuscript illuminated binding','Sinai desert landscape'],prophetlife:['Sinai desert landscape','Quran manuscript illuminated binding'],actprophet:['Judean desert landscape','Sinai desert landscape'],money:['mixed coins numismatics collection','coin cabinet museum'],capitals:['globe geography classroom','world atlas globe'],flagsnew:['international flags outside United Nations','flags of nations flagpoles'],flagcolor:['international flags flagpoles','international flags outside United Nations'],whoanimal:['African savanna wildlife habitat landscape','forest habitat landscape'],dishes:['kitchen utensils chef preparation','cooking pots kitchen utensils'],quiz:['science museum exhibits','historic scientific instruments museum']};
const series={naruto:[495],whonin:[495],whopirate:[1505],onepiece:[1505],martin:[82],whomartin:[82],thrones:[82],bean:[2135]};
// Distinct episodes in the relevant series. Narrow by public clue or target for mixed-anime rounds.
const animeShows=[[ /كونان|شينيتشي|موري/,'Detective Conan'],[/غوكو|غوهان|فيجيتا|سايان|دراغون/,'Dragon Ball Z'],[/تانجيرو|نيزوكو|زينيتسو|إينوسكي|الشياطين/,'Demon Slayer'],[/غون|كيلوا|كورابيكا|ليوريو|القناص/,'Hunter x Hunter'],[/الأخوين إلريك|إدوارد|ألفونس|روي موستانغ|الكيميائي/,'Fullmetal Alchemist: Brotherhood'],[/لايت|ريوك|ديث نوت|دفتر الموت|كيرا/,'Death Note'],[/عملاق|ليفاي|العمالقة|ميكاسا|أرمين/,'Attack on Titan'],[/غارا|روك لي|ناروتو|كاكاشي|ساكورا|ساسكي|جيرايا|تسونادي|هيناتا/,'Naruto'],[/لوفي|زورو|سانجي|نامي|أوسوب|تشوبر|بروك|فرانكي|ون بيس/,'One Piece'],[/بوكيمون|بيكاتشو/,'Pokémon'],[/سايتاما|جينوس|بنش/,'One Punch Man']];
async function show(name,type){return cached('s'+name+type,async()=>{const res=await(await get('https://api.tvmaze.com/search/shows?q='+encodeURIComponent(name))).json();const show=res.map(a=>a.show).find(s=>(!type||s.type===type)&&(type==='Animation'||name!=='Mr. Bean'||s.premiered?.startsWith('1990')));return show?episodes(show.id):[];});}
animeShows.unshift([/هايدي/,'Heidi, Girl of the Alps'],[/دورايمون|نوبيتا/,'Doraemon'],[/هزيم الرعد/,'Ginga Sengoku Gun Yuuden Rai'],[/أبطال الديجيتال/,'Digimon Adventure'],[/يوغي يو/,'Yu-Gi-Oh!'],[/بي بليد/,'Beyblade'],[/ماوكلي/,'Jungle Book Shonen Mowgli'],[/عدنان ولينا/,'Future Boy Conan'],[/سالي/,'Princess Sarah'],[/بليتش/,'Bleach'],[/سلام دانك/,'Slam Dunk'],[/فارس|أبطال الكرة/,'Inazuma Eleven'],[/دفتر الموت/,'Death Note']);
const dramaShows=[[/صراع العروش/,'Game of Thrones'],[/مستر بن/,'Mr. Bean'],[/شيرلوك/,'Sherlock'],[/لوست/,'Lost'],[/مستر روبوت/,'Mr. Robot'],[/بريكنغ باد/,'Breaking Bad'],[/بريزن بريك/,'Prison Break'],[/فريندز|الأصدقاء/,'Friends']];
const tags=[[/جرة رمل|قرعة|كازيكاغي|غارا/,'gaara'],[/ضفادع|جيرايا/,'jiraiya'],[/ساسكي/,'sasuke'],[/كاكاشي/,'kakashi'],[/كوراما|التسعة/,'nine-tail'],[/قبعة القش/,'luffy'],[/وينترفيل|ستارك/,'winterfell'],[/دينيريس|تنانين/,'daenerys'],[/سانجي/,'sanji'],[/تشوبر/,'chopper'],[/روك لي/,'lee']];
async function articlePictures(titles){return cached('articles:'+titles,async()=>{
const p=new URLSearchParams({action:'query',format:'json',generator:'images',titles,gimlimit:'500',prop:'imageinfo',iiprop:'url|size|mime',iiurlwidth:'960'});
const data=await(await get('https://en.wikipedia.org/w/api.php?'+p)).json();
return Object.values(data.query?.pages||{}).filter(o=>{const i=o.imageinfo?.[0];return i?.mime==='image/jpeg'&&i.width>=640&&!/collage|logo|flag of|icon|map of|pdf/i.test(o.title)}).map(o=>({url:o.imageinfo[0].thumburl,source:o.imageinfo[0].descriptionurl,keywords:o.title.toLowerCase()}));
});}
async function pageGallery(title){return cached('html:'+title,async()=>{
 const page='https://en.wikipedia.org/wiki/'+encodeURIComponent(title.replaceAll(' ','_'));
 const html=await(await get(page)).text();
 return [...html.matchAll(/<img[^>]+src="([^"]+)"/gi)].map(m=>m[1].split('?')[0]).filter(u=>u.includes('/commons/thumb/')&&/\.jpe?g$/i.test(u)&&!/map|logo|icon|seal_in_Hagia|collage|ribbon|Montage/i.test(u)).map(u=>{
 const fname=u.split('/').at(-2);return {url:new URL(u,page).href.replace(/\/\d+px-([^/]+)$/,'/960px-$1'),source:'https://commons.wikimedia.org/wiki/File:'+fname,keywords:decodeURIComponent(fname).toLowerCase()};});
});}
const relatedArticles={battles:'Battle of Siffin|Battle of the Camel|Kufa|Great Mosque of Kufa',companions:'Great Mosque of Kufa|Imam Ali Shrine|Wadi-us-Salaam',whoali:'Great Mosque of Kufa|Imam Ali Shrine|Najaf|Al-Sahlah Mosque',actali:'Imam Ali Shrine|Najaf|Zulfiqar|Ali|Great Mosque of Kufa',prophetera:'Al-Masjid an-Nabawi|Quba Mosque|Mount Uhud|Jabal al-Nour|Hegira',shiahist:'Imam Husayn Shrine|Al-Abbas Shrine|Al-Askari Shrine|Arbaeen Pilgrimage',money:'Coin collecting|Numismatics|Coin|Banknote',dishes:'Cookware and bakeware|Kitchen utensil|Kitchen'};
async function candidates(q,ix){
const c=q.categoryId;
if(process.env.HTML&&relatedArticles[c]){
const lists=await Promise.all(relatedArticles[c].split('|').map(pageGallery));return lists.flat();
}
if(process.env.ARTICLES&&relatedArticles[c])return articlePictures(relatedArticles[c]);
if(series[c]&&c!=='bean'){const original=await episodes(series[c][0]);return c==='whomartin'||c==='martin'?[...original,...await episodes(44778)]:original;}
if(c==='bean'){const real=await show('Mr. Bean','Scripted');const animated=await show('Mr. Bean','Animation');return [...real,...animated];}
if(['whoanime','characters','anime','toon','series'].includes(c)){
const t=q.text+' '+q.answer;
if(process.env.EXACT){const exact=(c==='series'?dramaShows:animeShows).find(([re])=>re.test(t));return exact?show(exact[1],c==='series'?'Scripted':'Animation'):[];}
const title=animeShows.find(([re])=>re.test(t))?.[1]|| (c==='series'?['Sherlock','Friends','Lost','Prison Break','Breaking Bad'][ix%5]:c==='toon'?['Detective Conan','Hunter x Hunter','Pokémon','Dragon Ball Z'][ix%4]:['Naruto','One Piece','Dragon Ball Z','Attack on Titan'][ix%4]);
return show(title,c==='series'?undefined:'Animation');}
if(['mokhtar','yusufshow'].includes(c))return iran(c);
const extra={
ahl:['Imam Ali shrine Najaf','Fatima Masumeh shrine'],battles:['Islamic swords museum','Kufic manuscript Iraq'],companions:['Mosque Kufa','Mosque Najaf'],whoali:['Najaf Iraq shrine','Kufa Iraq mosque'],shiahist:['Ashura Karbala procession','Samarra shrine Iraq'],shiainfo:['Shia prayer mosque Iran','Hussainiya Muharram'],shiaperson:['Shia seminary Qom','Islamic library Iran'],actali:['Islamic calligraphy Iraq','Arab swords museum'],prophetera:['Al Masjid an Nabawi courtyard','Mount Uhud Medina'],whoprophet:['Quran manuscript','Arabian desert dunes'],prophetlife:['Jabal Musa Sinai','Egypt Nile landscape'],actprophet:['Wadi Rum desert','Sinai mountains'],
money:['numismatic collection coins','stacks of coins'],capitals:['terrestrial globe','geography atlas'],flagsnew:['international flags','flagpoles international'],flagcolor:['flags of countries','United Nations flags'],whoanimal:['wildlife habitat grassland','wetland habitat landscape'],dishes:['cooking utensils','kitchen cookware'],quiz:['science museum','mathematical instruments']};
const strict={
ahl:['"Imam Husayn shrine"','"Imam Ali shrine"'],battles:['"Islamic" sword museum','"Great Mosque of Kufa"'],companions:['"Kufa" mosque','"Najaf" shrine'],whoali:['"Najaf" courtyard','"Kufa" mosque'],shiahist:['"Karbala" shrine','"Samarra" shrine'],shiainfo:['"Karbala" pilgrimage','"Fatima Masumeh" shrine'],shiaperson:['"Qom" shrine','"Najaf" mosque'],actali:['"Dhu al-Fiqar" sword','"Kufa" courtyard'],prophetera:['"Al-Masjid an-Nabawi"','"Mount Uhud"'],whoprophet:['"Quran" manuscript','"Quran" binding'],prophetlife:['"Mount Sinai" Egypt','"Quran" illumination'],actprophet:['"Mount Sinai" landscape','"Wadi Rum" dunes'],
money:['"coin hoard" museum','"coin collection" display'],capitals:['"terrestrial globe"','"world globe"'],flagsnew:['"flags" United Nations Geneva','"flags" European Parliament Strasbourg'],flagcolor:['"flagpoles" flags','"flags" European Union Brussels'],whoanimal:['"savanna" Africa grassland','"mangrove" wetland forest'],dishes:['"kitchen utensils"','"kitchenware" cooking'],quiz:['"science museum" exhibit','"science" laboratory']};
const terms=process.env.MORE==='2'?strict[c]:process.env.MORE?extra[c]:subjects[c];return commons(terms[ix%terms.length]);}
async function iran(c){return cached(c,async()=>{
const pages=c==='mokhtar'?['https://ar.ifilmtv.ir/News/Content/45128/','https://ar.ifilmtv.ir/Iran/Content/23823/','https://ar.ifilmtv.ir/News/Content/35436/','https://ar.ifilmtv.ir/News/Content/41264/','https://ar.ifilmtv.ir/News/Content/67642/']:['https://en.ifilmtv.ir/News/Content/45386/','https://ar.ifilmtv.ir/News/Content/37605/','https://ar.ifilmtv.ir/News/Content/71777/','https://ar.ifilmtv.ir/Iran/Content/39793/','https://en.ifilmtv.ir/News/Content/45223/','https://en.ifilmtv.ir/Series/Content/5838/'];
const slug=c==='mokhtar'?'ar16':'en5838';
const page=c==='mokhtar'?'https://ar.ifilmtv.ir/Series/Content/16':'https://en.ifilmtv.ir/Series/Content/5838/';
const out=Array.from({length:40},(_,i)=>({url:'https://preview.presstv.co.uk/ifilm/'+slug+'/'+(i+1)+'.png',source:page,keywords:''}));for(const u of pages){const s=await(await get(u)).text();
for(const m of s.matchAll(/(?:src|data-url)\s*=\s*["']([^"']+\.(?:jpg|jpeg))["']/gi)){let v=m[1];if(/smallsize/i.test(v)||!/UploadedFiles/i.test(v))continue;out.push({url:new URL(v,u).href.replace('http:','https:'),source:u,keywords:''});}}
return out;
});}
function flush(){fs.writeFileSync(manifestPath,JSON.stringify({...JSON.parse(fs.existsSync(manifestPath)?fs.readFileSync(manifestPath):'{}'),...changed},null,1));}
async function assign(q,ix){
let list=await candidates(q,ix);
const tag=tags.find(([re])=>re.test(q.text+' '+q.answer))?.[1];
if(tag)list=[...list.filter(x=>x.keywords.includes(tag)),...list];
for(const x of list){if(used.has(x.url))continue;used.add(x.url);
try{const r=await get(x.url),buf=Buffer.from(await r.arrayBuffer());if(buf[0]!==255||buf[1]!==216)continue;
const hash=crypto.createHash('sha256').update(buf).digest('hex');if(used.has(hash))continue;used.add(hash);
fs.writeFileSync(dir+'/'+q.id+'.jpg',buf);changed[q.id]=manifest[q.id]={source:x.source,url:x.url,hash};return true;
}catch(e){if(/busy/.test(e.message))throw e;}}
return false;}
(async()=>{let group=process.argv[2];const cats=bank.categories.filter(c=>!group||group.split(',').includes(c.id));for(const c of cats){
const items=qs.filter(q=>q.categoryId===c.id);let cursor=0;await Promise.all(Array.from({length:4},async()=>{while(cursor<items.length){const i=cursor++,q=items[i];if(manifest[q.id]&&!process.env.EXACT)continue;try{await assign(q,i)}catch(e){if(i<3)console.error(c.id,e.message)}}}));flush();console.log(c.id,items.filter(q=>manifest[q.id]).length);}})();
