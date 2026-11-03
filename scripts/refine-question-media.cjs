const fs=require('fs'),crypto=require('crypto');
const root='question-media/', mp=root+'sources.json',manifest=JSON.parse(fs.readFileSync(mp));
const used=new Set(Object.values(manifest).map(x=>x.hash));
const cities='Baghdad|Cairo|Tokyo|Ottawa|Wellington|Canberra|Lisbon|Rabat|Amman|Tunis|New Delhi|Seoul|Oslo|Stockholm|Warsaw|Budapest|Bangkok|Ankara|Hanoi|Dhaka|Brasília|Mexico City|Nairobi|Abuja|Accra|Addis Ababa|Muscat|Manama|Doha|Islamabad'.split('|');
const habitats='African elephant ear|red kangaroo paw|Antarctic sea ice|octopus sucker|bamboo shoots|Australian freshwater creek|platypus burrow|cheetah paw prints|Antarctic emperor penguin colony|limestone cave|octopus suckers|silkworm cocoon|ostrich feather|Arctic sea ice|eucalyptus leaves|beaver dam|pangolin scales|woodpecker tree holes|caracal ears|acacia savanna|coral reef habitat|turtle shell|salt lake wetland|zebra stripes|peacock feathers|bamboo forest|Australian outback grassland|ocean whale fluke|tropical nectar flowers|rhinoceros tracks'.split('|');
const science='ocean waves|stethoscope chest|iron metal sample|abacus beads|electrical resistor components|Saturn telescope|solar system observatory|night sky telescope|rocky planet observatory|periodic table laboratory|iron ore sample|gold nugget|blood glucose meter|stethoscope|electric circuit wires|oscilloscope waveform|world relief globe|world globe atlas|abacus arithmetic|geometric tiles pattern|counting rods arithmetic|Atlantic Ocean waves|atmosphere blue sky|weather station instruments|piano keys|chessboard|basketball court|Andes landscape Peru|origami paper|geometric mosaic tiles'.split('|');
const flags='Bangladesh Japan China Vietnam Turkey Tunisia Pakistan Lebanon Morocco Jordan Bahrain Qatar Greece Finland Sweden Denmark Switzerland Israel South_Korea India Brazil Argentina Bhutan Albania'.split(' ');
const group={capitals:cities.map(x=>x+' skyline city'),whoanimal:habitats,quiz:science,
flagsnew:['Canada','Japan','Lebanon','Brazil','Nepal','Finland',...flags].map(x=>'"flag of '+x.replace('_',' ')+'" flying'),
flagcolor:['Canada','Saudi Arabia','China','France','Bangladesh','Ireland',...flags].map(x=>'"flag of '+x.replace('_',' ')+'" flagpole')};
const names={};
async function get(u){const r=await fetch(u,{headers:{'User-Agent':'ArabicTriviaMedia/1.0 local educational quiz'},signal:AbortSignal.timeout(16000)});if(!r.ok)throw Error(r.status+' '+u.slice(0,65));return r}
async function collect([id,term]){
try{
 const [cat,part,num]=id.split('-'),index=part==='pool'?6+Number(num):Number(part)-1;
 const animals='African bush elephant|Red kangaroo|Penguin|Common octopus|Giant panda|Platypus|Platypus|Cheetah|Emperor penguin|Bat|Octopus|Bombyx mori|Common ostrich|Narwhal|Koala|Beaver|Pangolin|Woodpecker|Caracal|Giraffe|Manta ray|Turtle|Flamingo|Zebra|Peafowl|Giant panda|Kangaroo|Blue whale|Hummingbird|Rhinoceros'.split('|');
 const sciences='Ocean|Stethoscope|Iron ore|Abacus|Resistor|Saturn|Solar System|Observatory|Mars exploration|Periodic table|Iron ore|Gold nugget|Blood glucose monitoring|Stethoscope|Electrical circuit|Oscilloscope|Terrestrial globe|Globe|Abacus|Tessellation|Counting rods|Atlantic Ocean|Atmosphere of Earth|Weather station|Piano|Chessboard|Basketball court|Andes|Origami|Euclidean geometry'.split('|');
 const topic=cat==='capitals'?cities[index]:cat==='whoanimal'?animals[index]:cat==='quiz'?sciences[index]:'Flag of '+term.match(/"flag of ([^"]+)"/i)[1];
 const page='https://en.wikipedia.org/wiki/'+encodeURIComponent(topic.replaceAll(' ','_'));
 const html=await(await get(page)).text();
 const urls=[...html.matchAll(/<img[^>]+src="([^"]+)"/gi)].map(m=>m[1].split('?')[0]).filter(u=>u.includes('/commons/thumb/')&&/\.jpe?g$/i.test(u)&&!/logo|seal_of|coat_of_arms|map_of|collage|ribbon|montage|symbol/i.test(u));
 for(const u of urls){const file=u.split('/').at(-2);const i={thumburl:new URL(u,page).href.replace(/\/\d+px-([^/]+)$/,'/960px-$1'),descriptionurl:'https://commons.wikimedia.org/wiki/File:'+file};
 if(Object.values(manifest).some(x=>decodeURI(x.source).toLowerCase()===decodeURI(i.descriptionurl).toLowerCase()))continue;
 try{const b=Buffer.from(await(await get(i.thumburl)).arrayBuffer());if(b.readUInt16BE(0)!==65496)continue;const hash=crypto.createHash('sha256').update(b).digest('hex');if(used.has(hash))continue;
 used.add(hash);fs.writeFileSync(root+id+'.jpg',b);names[id]=manifest[id]={source:i.descriptionurl,url:i.thumburl,hash};return true;}catch{}
 }
}catch(e){if(id.endsWith('-1'))console.log(id,e.message)}
return false;}
(async()=>{let tasks=[];for(const [cat,terms] of Object.entries(group))terms.forEach((s,i)=>tasks.push([i<6?cat+'-'+(i+1):cat+'-pool-'+(i-6),s]));
let ix=0,done=0;await Promise.all(Array.from({length:4},async()=>{while(ix<tasks.length){if(await collect(tasks[ix++]))done++;await new Promise(r=>setTimeout(r,80));}}));fs.writeFileSync(mp,JSON.stringify({...JSON.parse(fs.readFileSync(mp)),...names},null,1));console.log('updated contextual photos',done);})();
