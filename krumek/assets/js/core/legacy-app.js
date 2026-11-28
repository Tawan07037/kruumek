/**
 * Compatibility core for the original kruumek simulator.
 * Its tightly coupled UI/state logic remains together for this migration pass;
 * the data model, routing engine and recommendations are separate modules.
 */
export function initializeLegacyApp(deps) {
  const {
    K, D, byId, L, GP,
    route, reach, pchain, dns, st, SL, ipOf, mac, upt, bw, cpu, dirty, tbl
  } = deps;
  const $ = (id) => document.getElementById(id);
  const ox = 100;
  const spark = (device) => {
    const element = $("sp");
    if (!element) return;
    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline.setAttribute("fill", "none");
    polyline.setAttribute("stroke", "var(--ac)");
    polyline.setAttribute("stroke-width", "2");
    polyline.setAttribute(
      "points",
      device.hist.map((value, index) => `${index * 10},${34 - value * 0.32}`).join(" ")
    );
    element.replaceChildren(polyline);
  };

let sel=null,pk=[],pt=0,logs=[],busy=false,blocked=0,pwr=true,batM=90,batB=45,spOn=false;
/* map */
const BL=[['ห้องปกครอง',395,5,135,55],['PinkHouse',625,45,100,80],['พักครูคณิต',543,75,60,45],['ประชาสัมพันธ์',255,75,70,50],['กิจกรรม',340,75,65,50],['แนะแนว',418,75,60,50],['บ้านดิน',700,140,150,70],['อาคาร 1 (กำลังก่อสร้าง)',237,540,570,120,'u'],['สนามกีฬา',320,715,310,140],['หอประชุม / เวที',655,695,215,210],['อาคาร 2',225,925,560,305],['T1–T5 / พักครูสังคม',210,1245,495,60],['T9–T12 / พยาบาล / พักครูพละ',212,1430,495,60],['อาคารวิชาการ / Theater',710,1285,260,260],['H1–H6',48,810,75,310],['H7–H12',52,1210,75,215],['บ้านพักครู',90,1570,150,50]];
const tz=n=>/ปกครอง|Pink|พักครูคณิต|ประชา|กิจกรรม|แนะแนว|บ้าน/.test(n)?'a':/สนาม|หอประชุม/.test(n)?'s':/วิชาการ/.test(n)?'x':'c';let DECO='<line x1="165" y1="60" x2="165" y2="1650" stroke="var(--ink)" opacity=".25" stroke-dasharray="14 12" stroke-width="2"/><text class="bt" transform="translate(150 760) rotate(-90)" opacity=".7">ถนนภายในโรงเรียน</text><g fill="var(--ok)" opacity=".28">';
for(let y=90;y<1640;y+=85)DECO+=`<circle cx="104" cy="${y}" r="7"/><circle cx="226" cy="${y+40}" r="7"/>`;
DECO+='</g><g transform="translate(1020 36)"><circle r="15" fill="var(--pn)" stroke="var(--ln)" stroke-width="2"/><path d="M0 -11L5 5L0 2L-5 5Z" fill="var(--ac)"/><text class="bt" y="30" text-anchor="middle">N</text></g><text class="bt" x="812" y="1668" opacity=".7">ไม่ได้อยู่ในสัดส่วนจริง</text>';
const FIELD='<rect x="335" y="735" width="280" height="100" rx="8" fill="var(--ok)" opacity=".18"/><circle cx="475" cy="785" r="20" fill="none" stroke="var(--ok)" opacity=".55" stroke-width="2"/><line x1="475" y1="735" x2="475" y2="835" stroke="var(--ok)" opacity=".55" stroke-width="2"/>';
const CAMPUS='<rect fill="var(--b2)" x="0" y="0" width="1060" height="1700"/><rect fill="var(--ln)" opacity=".35" x="115" y="55" width="100" height="1600"/>'+DECO+'<ellipse fill="var(--bk)" opacity=".18" cx="460" cy="1560" rx="240" ry="62"/><circle cx="518" cy="310" r="135" fill="none" stroke="var(--ln)" opacity=".35" stroke-width="30"/><rect x="800" y="880" width="260" height="700" rx="12" fill="var(--b1)"/><text class="bt" x="812" y="900">ห้อง MDF / โซนเซิร์ฟเวอร์</text>'
+BL.map((b,bi)=>`<rect class="bl ${b[5]||''}" data-b="${bi}" x="${b[1]}" y="${b[2]}" width="${b[3]}" height="${b[4]}" rx="6"/><rect class="tn ${tz(b[0])}" x="${b[1]}" y="${b[2]}" width="${b[3]}" height="${b[4]}" rx="6"/><text class="bt" x="${b[1]+6}" y="${b[2]+16}">${b[0]}</text>`).join('')
+GP.map((g,i)=>`<rect class="bl" data-b="G" x="${g[0]-20}" y="${g[1]-17}" width="40" height="34" rx="5"/><text class="bt" x="${g[0]-12}" y="${g[1]+4}">G${i+1}</text>`).join('')
+FIELD+[['F4',985],['F3',1055],['F2',1138],['F1',1200]].map(f=>`<text class="bt" x="790" y="${f[1]+4}">${f[0]}</text>`).join('');
const TY=[['อินเทอร์เน็ต',40],['ISP',120],['Router',200],['Firewall / DMZ',280],['Core',360],['เซิร์ฟเวอร์',450],['Distribution',540],['Access',630],['อุปกรณ์ปลายทาง',730]];
function logical(){const ch={};D.forEach(d=>{if(d.p[0])(ch[d.p[0]]=ch[d.p[0]]||[]).push(d)});let s=0;const Y={net:40,isp:120,rt:200,fw:280,core:360,srv:450,dist:540,acc:630};
 (function w(d){const c=ch[d.id]||[];if(!c.length)d.lx=140+s++*58;else{c.forEach(w);d.lx=(c[0].lx+c[c.length-1].lx)/2}d.ly=Y[d.k]||730})(byId.net);return 140+s*58}
const LW=logical();let view='map',zm=.8;
const curve=(a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1,o=Math.min(60,l*.22);return`M${a.x} ${a.y}Q${(a.x+b.x)/2-dy/l*o} ${(a.y+b.y)/2+dx/l*o} ${b.x} ${b.y}`};
function render(){const m=view==='map',W=m?1060:LW,H=m?1700:790;D.forEach(d=>{d.x=m?d.cx:d.lx;d.y=m?d.cy:d.ly});
 const s=$('svg');s.setAttribute('viewBox',`0 0 ${W} ${H}`);s.style.width=W*zm+'px';
 $('bg').innerHTML=m?CAMPUS:TY.map((t,i)=>`<rect class="band ${i%2?'o':''}" x="0" y="${t[1]-38}" width="${W}" height="76"/><text class="bt" x="10" y="${t[1]-20}">${t[0]}</text>`).join('');
 $('cv').innerHTML=m?D.filter(d=>d.k==='ap').map(d=>`<circle id="c-${d.id}" class="cov" cx="${d.x}" cy="${d.y}" r="52" fill="var(--ac)" fill-opacity=".08"/>`).join(''):'';$('lks').innerHTML=L.map((l,i)=>{const a=byId[l.a],b=byId[l.b];return`<path id="l${i}" d="${l.bk?curve(a,b):`M${a.x} ${a.y}L${b.x} ${b.y}`}" class="lk"/>`}).join('');
 $('nds').innerHTML=D.map(d=>{const k=K[d.k];return`<g class="n" id="n-${d.id}" data-id="${d.id}" tabindex="0" role="button" aria-label="${d.n}" transform="translate(${d.x},${d.y})"><title>${d.n}${d.ip?' ('+d.ip+')':''}</title><rect class="halo" x="${-k.W/2-5}" y="${-k.H/2-5}" width="${k.W+10}" height="${k.H+10}" rx="${d.k==='ap'?k.H/2+5:9}"/><rect class="sh" x="${-k.W/2}" y="${-k.H/2}" width="${k.W}" height="${k.H}" rx="${d.k==='ap'||d.k==='net'?k.H/2:6}"/><text class="tg">${k.g}</text><text class="nm" y="${k.H/2+13}">${d.n}</text></g>`}).join('');paint()}
$('nds').onclick=e=>{const g=e.target.closest('.n');if(g)pick(g.dataset.id)};
$('nds').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){const g=e.target.closest('.n');if(g){e.preventDefault();pick(g.dataset.id)}}};
$('vw1').onclick=()=>{view='map';zm=fz();$('vw1').classList.add('on');$('vw2').classList.remove('on');render()};
$('vw2').onclick=()=>{view='logic';zm=.7;$('vw2').classList.add('on');$('vw1').classList.remove('on');render()};
$('zi').onclick=()=>{zm=Math.min(2,zm+.15);render()};$('zo').onclick=()=>{zm=Math.max(.35,zm-.15);render()};
document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#tabs button').forEach(x=>x.classList.toggle('on',x===b));['map','vlan','fw','wifi','cab','rec','bom'].forEach(t=>$('t-'+t).hidden=t!==b.dataset.t);if(b.dataset.t==='bom')bom();if(b.dataset.t==='wifi')wifi();if(b.dataset.t==='cab')cab()});
$('cvb').onclick=e=>{const g=$('cv'),h=g.style.display==='none';g.style.display=h?'':'none';e.target.classList.toggle('on',h)};
function hero(){const dn=D.filter(d=>!d.up).length,bad=D.filter(d=>['iso','warn'].includes(st(d))).length,bk=D.some(d=>st(d)==='bk'),e=$('sys');
 e.className='chip '+(bad?'s-down':dn||bk?'s-warn':'s-ok');e.textContent=bad?'กระทบผู้ใช้ '+bad+' จุด':dn||bk?'ทำงานด้วยระบบสำรอง':'ระบบปกติ';$('clk').textContent=new Date().toLocaleString('th-TH',{dateStyle:'medium',timeStyle:'medium'})}
const wh={isp1:[],isp2:[]};
function wanChart(){['isp1','isp2'].forEach(i=>{wh[i].push(byId[i].up?byId[i].load:0);if(wh[i].length>40)wh[i].shift()});
 const pl=(a,c,dash)=>`<polyline fill="none" stroke="${c}" stroke-width="2"${dash?' stroke-dasharray="4 3"':''} points="${a.map((v,i)=>i*7.5+','+(54-Math.min(v,100)*.5)).join(' ')}"/>`;
 $('wan').innerHTML='<line x1="0" x2="300" y1="54" y2="54" stroke="var(--ln)"/>'+pl(wh.isp1,'var(--ac)')+pl(wh.isp2,'var(--bk)',1);
 $('wanl').textContent='ISP 1 '+Math.round(byId.isp1.up?byId.isp1.load:0)+'% | ISP 2 '+Math.round(byId.isp2.up?byId.isp2.load:0)+'% ของ 1 Gbps'}
$('find').innerHTML='<option value="">ค้นหาอุปกรณ์</option>'+D.slice().sort((a,b)=>a.n.localeCompare(b.n,'th')).map(d=>`<option value="${d.id}">${d.n}</option>`).join('');
$('find').onchange=e=>{const v=e.target.value;if(!v)return;sel=v;pt++;detail();paint();$('n-'+v).scrollIntoView({block:'center',inline:'center',behavior:'smooth'});e.target.value=''};
const CH5=[36,40,44,48,149,153,157,161],CH2=[1,6,11];
function wifi(){const aps=D.filter(d=>d.k==='ap');
 const rows=aps.map((d,i)=>{const s=st(d);return`<tr><td>${d.n}</td><td>${d.x2||'พื้นที่ตามชื่อ AP'}</td><td>${byId[d.p[0]].n}</td><td>${CH2[i%3]}</td><td>${CH5[i%8]}</td><td>${d.up?d.u:0}</td><td class="s-${s}">${SL[s]}</td></tr>`}).join('');
 $('wific').innerHTML=`<h2>แผนติดตั้ง Wi‑Fi (${aps.length} AP)</h2><div class="card"><p>AP กลุ่ม G และ H ครอบคลุมตัวละ 2 ห้องเรียน ถ้าห้องละ 40 คน จะมีอุปกรณ์ราว 80 เครื่องต่อ AP ในชั่วโมงเรียนหนาแน่น (ตัวเลขประมาณ) ควรเลือก AP Wi‑Fi 6 ขึ้นไป เปิด band steering ให้ใช้ 5 GHz เป็นหลัก ลดกำลังส่งไม่ให้ห้องติดกันรบกวนกัน และทำ site survey หน้างานก่อนติดตั้งจริง ช่องสัญญาณในตารางเป็นแผนตั้งต้นที่หมุนเวียนไม่ให้ AP ใกล้กันใช้ช่องซ้ำ ปรับตามผลสำรวจ</p></div><div class="tw"><table><tr><th>AP</th><th>ครอบคลุม</th><th>ต่อกับสวิตช์</th><th>2.4G ช่อง</th><th>5G ช่อง</th><th>ผู้ใช้ตอนนี้</th><th>สถานะ</th></tr>${rows}</table></div>`}
let curB=null,SC=40;
const ZN={a:'ธุรการ / ปกครอง',c:'ห้องเรียน',s:'กีฬา / ประชุม',x:'วิชาการ / อื่น ๆ'},RM={};
RM['H1–H6']=[1,2,3,4,5,6].map(i=>['H'+i,'apH'+((i-1)>>1)]);RM['H7–H12']=[7,8,9,10,11,12].map(i=>['H'+i,'apH'+(3+((i-7)>>1))]);
RM['T1–T5 / พักครูสังคม']=[['T1','t1'],['T2','t1'],['T3','t1'],['T4','t2'],['T5','t2'],['พักครูสังคม','t3']];
RM['T9–T12 / พยาบาล / พักครูพละ']=[['T9','t5'],['T10','t5'],['T11','t6'],['T12','t6'],['ห้องพยาบาล','t7'],['พักครูพละ','t8']];
RM['อาคาร 2']=[['COM 3 (ชั้น 4)','e42'],['COM 2 (ชั้น 3)','e32'],['COM 1 (ชั้น 2)','e22'],['ผอ./การเงิน (ชั้น 1)','e12'],['EP Office (ชั้น 1)','e13'],['ทางเดิน/ห้องเรียนชั้น 4','e40'],['ทางเดิน/ห้องเรียนชั้น 3','e30'],['ทางเดิน/ห้องเรียนชั้น 2','e20'],['ทางเดิน/ห้องเรียนชั้น 1','e10']];
RM['อาคาร 1 (กำลังก่อสร้าง)']=[['ปีกซ้าย (A)','B1a'],['ปีกซ้าย (B)','B1b'],['COM 4','B1c'],['ปีกขวา (A)','B1d'],['ปีกขวา (B)','B1e']];
RM['หอประชุม / เวที']=[['เวที','h1'],['ห้องโถงหอประชุม','h2'],['สหกรณ์','coop']];RM['สนามกีฬา']=[['ฝั่งตะวันตก','f1'],['ฝั่งใต้','f2']];
RM['อาคารวิชาการ / Theater']=[['ห้องวิชาการ','c1'],['Theater','c2'],['ดนตรี/นาฏศิลป์','c3']];
RM['ห้องปกครอง']=[['ห้องปกครอง','a1']];RM['PinkHouse']=[['PinkHouse','a2']];RM['พักครูคณิต']=[['พักครูคณิต','a3']];RM['ประชาสัมพันธ์']=[['ประชาสัมพันธ์','a4']];RM['กิจกรรม']=[['ห้องกิจกรรม','a6']];RM['แนะแนว']=[['ห้องแนะแนว','a6']];RM['บ้านพักครู']=[['บ้านพักครู','apHs']];
$('bg').onclick=e=>{const t=e.target.closest('[data-b]');if(t)bld(t.dataset.b==='G'?'G':+t.dataset.b)};
function bld(k){curB=k;sel=null;document.querySelectorAll('.bl').forEach(r=>r.classList.toggle('on',r.dataset.b===String(k)));
 const g=k==='G',b=g?null:BL[k],nm=g?'กลุ่มห้องเรียน G1–G16':b[0],zt=g?'c':tz(b[0]);
 const inB=d=>g?Math.hypot(d.cx-518,d.cy-310)<170:d.cx>=b[1]&&d.cx<=b[1]+b[3]&&d.cy>=b[2]&&d.cy<=b[2]+b[4];
 const ds=D.filter(inB),rooms=g?[...Array(16)].map((_,i)=>['G'+(i+1),'apG'+(i>>1)]):(RM[nm]||[]),n=kk=>ds.filter(d=>d.k===kk).length,us=ds.reduce((a,d)=>a+d.u,0),sw=ds.filter(d=>['dist','acc'].includes(d.k));
 const rr=rooms.map(r=>{const a=byId[r[1]],s=st(a);return`<tr><td>${r[0]}</td><td>${a.n}</td><td class="s-${s}">${SL[s]}</td><td>${a.k==='ap'?a.u:'-'}</td></tr>`}).join('');
 const lk=d=>`<button class="lnk" data-action="pick-device" data-id="${d.id}">${d.n}</button>`;
 $('detail').innerHTML=`<h2>${nm}</h2><div class="sub">โซน: ${ZN[zt]}${nm.includes('อาคาร 1')?' (กำลังก่อสร้าง)':''}</div>
 <p>AP ${n('ap')} · สวิตช์ ${sw.length} · ห้องคอม ${n('lab')} · PC ${n('pc')} · กล้อง ${n('cam')}<br>ผู้ใช้ Wi‑Fi ตอนนี้ ${us} คน · PoE โดยประมาณ ${n('ap')*15+n('cam')*7} W</p>
 ${rr?`<h3>รายห้อง (${rooms.length})</h3><table class="rt"><tr><th>ห้อง</th><th>อุปกรณ์ที่ให้บริการ</th><th>สถานะ</th><th>ผู้ใช้</th></tr>${rr}</table>`:'<p class="mu">ไม่มีอุปกรณ์เครือข่ายในพื้นที่นี้ในแบบจำลอง</p>'}
 ${ds.length?`<h3>อุปกรณ์ในพื้นที่นี้ (คลิกชื่อเพื่อดูรายละเอียด)</h3><p>${ds.map(lk).join(' ')}</p>`:''}
 ${sw.length?`<h3>ทดสอบการล่ม</h3><div class="row">${sw.map(d=>`<button class="dg" data-action="toggle-device" data-id="${d.id}">${d.m?'ปิด':'เปิด'} ${d.n}</button>`).join('')}</div><p class="mu">ปิดสวิตช์แล้วดูว่าห้องใดหลุด จะเห็นว่าสวิตช์ชั้นต่อสายเดียว (หลุดทั้งชั้น) ส่วนสวิตช์กระจายมีสายสำรอง</p>`:''}`;paint()}
function cab(){const rows=[],agg={},md=['rt','fw','core','srv'],CA='ท่อ A (หลัก)',CB='ท่อ B (สำรอง คนละเส้นทาง)',CI='ท่อ ISP (ทางเข้าโรงเรียน)',CM='ห้อง MDF / โซนเซิร์ฟเวอร์',CW='ในอาคาร (ราง/ท่อร้อยสาย)';
 L.forEach(l=>{const a=byId[l.a],b=byId[l.b],len=Math.max(10,Math.round(Math.hypot(a.cx-b.cx,a.cy-b.cy)*SC/100*1.3));
  if(!l.f){const g=agg[l.a]=agg[l.a]||{a,n:[],len:0};g.n.push(b.n);g.len+=len;return}
  const c=['net','isp'].includes(a.k)||b.k==='isp'?CI:md.includes(a.k)&&md.includes(b.k)?CM:len<=60?CW:l.bk?CB:CA;
  rows.push({a:a.n,b:b.n,m:media(a,b),c,len,r:l.isl?'เชื่อมคู่ Core':l.bk?'สำรอง':'หลัก'})});
 Object.values(agg).forEach(g=>rows.push({a:g.a.n,b:g.n.length+' จุด: '+g.n.join(', '),m:'UTP Cat6'+(g.n.some(x=>/AP|กล้อง/.test(x))?' + PoE':''),c:CW,len:g.len,r:'หลัก'}));
 const G={};rows.forEach(r=>{const o=G[r.c]=G[r.c]||{n:0,l:0};o.n++;o.l+=r.len});const g=k=>G[k]||{n:0,l:0},O=[CI,CM,CA,CB,CW];
 rows.sort((x,y)=>O.indexOf(x.c)-O.indexOf(y.c)||y.len-x.len);const fib=rows.filter(r=>r.m.includes('ใยแก้ว')).reduce((a,r)=>a+r.len,0);
 $('cabc').innerHTML=`<div class="stats">${[[fib+' ม.','ใยแก้วทั้งหมด'],[g(CA).l+' ม.','ท่อ A ('+g(CA).n+' เส้น)'],[g(CB).l+' ม.','ท่อ B ('+g(CB).n+' เส้น)'],[g(CW).l+' ม.','UTP ในอาคาร']].map(x=>`<div class="stat"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}</div>
 <div class="card"><h3 style="margin-top:0">หลักการวางท่อ</h3><p>1. เส้นทางหลัก (ท่อ A) กับสำรอง (ท่อ B) ของทุกอาคารต้องไม่ใช้ท่อ หลุมพัก หรือเสาเดียวกัน ไม่เช่นนั้นท่อเดียวเสียหายแล้วล่มทั้งสองเส้น<br>2. ใยแก้วระหว่างอาคารใช้ชนิด OS2 (single‑mode) ร้อยท่อฝังดินพร้อมหลุมพักตามที่ผู้รับเหมากำหนด ตั้งต้นสั่งประมาณ 12 core ต่อเส้นทาง เผื่อสำรองอีก 20%<br>3. ภายในอาคารใช้ Cat6 ร้อยรางหรือท่อ ความยาวต่อเส้นไม่เกิน 90 เมตร ติดป้ายหมายเลขทุกปลายสาย<br>4. สายขาเข้า ISP สองเส้นควรเข้าคนละทิศทางของรั้วโรงเรียน<br>5. ทดสอบสายด้วยเครื่อง OTDR/Certifier ก่อนส่งมอบงาน</p></div>
 <div class="tw"><table><tr><th>จาก</th><th>ถึง</th><th>สื่อ</th><th>เส้นทางท่อ</th><th>ยาว (ม.)</th><th>บทบาท</th></tr>${rows.map(r=>`<tr><td>${r.a}</td><td>${r.b}</td><td>${r.m}</td><td>${r.c}</td><td>${r.len}</td><td>${r.r}</td></tr>`).join('')}</table></div>`}
$('sc').oninput=e=>{SC=Math.max(5,+e.target.value||40);cab()};
const CFG={"net": "ขอ IP จริงแบบคงที่จากแต่ละ ISP และระบุเวลาซ่อมใน SLA", "isp": "ทำสัญญา SLA ระบุเวลาซ่อมและความพร้อมใช้งาน ให้ใยแก้วเข้าโรงเรียนคนละเส้นทาง และเลือกคนละผู้ให้บริการถ้าทำได้", "rt": "ตั้ง default route สองเส้นแบบ failover พร้อมตรวจสถานะลิงก์ (ping/BFD) ทำ NAT ปิดบริการที่ไม่ใช้ และใช้ ACL กันการสแกนจากภายนอก", "fw": "ตั้ง HA แบบ Active/Standby พร้อมซิงก์ session แยก zone ตามแท็บไฟร์วอลล์ เปิด IPS และกรองเว็บ ใช้ MFA สำหรับผู้ดูแล และส่ง log ไป NMS", "core": "ตั้ง VRRP/HSRP ให้ Core 1 priority สูงกว่า, STP root ที่ Core 1 และสำรองที่ Core 2, LACP ระหว่าง Core, Inter‑VLAN routing พร้อม ACL และสำรองคอนฟิกอัตโนมัติ", "srv": "ใช้ IP คงที่ แบ่ง DHCP pool ระหว่างสองตัวหรือใช้ failover ปิดบริการที่ไม่จำเป็น อัปเดตแพตช์เป็นรอบ และสำรองข้อมูลนอกเครื่อง", "dist": "ต่อสองเส้นขึ้น Core ด้วย STP/LACP เปิด DHCP snooping และ DAI จำกัด VLAN ใน trunk เท่าที่ใช้ และเข้าถึงด้วย SSH/SNMPv3 เท่านั้น", "acc": "ตั้ง access VLAN ตามชนิดอุปกรณ์ เปิด BPDU guard และ port security ปิดพอร์ตว่าง ตรวจงบ PoE ให้พอ และใช้ใยแก้วหรือ LACP ต่อขึ้น Dist", "ap": "ตั้ง trunk VLAN 30/31/90 native 99 กำหนด SSID ตามนโยบาย ลดกำลังส่งตามผล site survey เปิด band steering จำกัดผู้ใช้ต่อ AP และเปิด client isolation ใน Guest", "lab": "ใช้ access VLAN 20 ล็อกพอร์ตตาม MAC ตั้งเวลาเปิดเว็บตามคาบเรียน และใช้อิมเมจเครื่องกลาง", "pc": "ใช้ VLAN 40 กำหนด 802.1X หรือผูก MAC อัปเดต OS และแอนตี้ไวรัส และห้ามต่อสวิตช์หรือ AP ส่วนตัว", "cam": "ใช้ VLAN 50 แยกเฉพาะ เปลี่ยนรหัสผ่านเริ่มต้น ปิด UPnP/P2P cloud ที่ไม่จำเป็น บล็อกการออกอินเทอร์เน็ต และเก็บภาพที่ NAS/NVR"};
const fz=()=>Math.max(.4,Math.min(1.3,(document.querySelector('.map').clientWidth-4)/1060));
$('zf').onclick=()=>{zm=view==='map'?fz():.7;render()};zm=fz();
function bom(){const sw=D.filter(d=>['core','dist','acc'].includes(d.k)),n=k=>D.filter(d=>d.k===k).length,fib=L.filter(l=>l.f).length;let tp=0;
 const rows=sw.map(d=>{const nb=L.filter(l=>l.a===d.id||l.b===d.id),poe=nb.filter(l=>l.a===d.id).reduce((a,l)=>{const x=byId[l.b];return a+(x.k==='ap'?15:x.k==='cam'?7:0)},0);tp+=poe;
  const rec=d.k==='core'?'L3 สวิตช์ 10G SFP+ ×1 ต่อตัว (คู่ 2 ตัว)':d.k==='dist'?'L3 สวิตช์ 10G SFP+ uplink 2 เส้น':nb.length>20||poe>180?'48 พอร์ต PoE+ 740 W':'24 พอร์ต PoE+ 370 W';
  return`<tr><td>${d.n}</td><td>${K[d.k].t}</td><td>${nb.length}</td><td>${poe||'-'}</td><td>${d.p.map(i=>byId[i].n).join(' / ')||'-'}</td><td>${rec}</td></tr>`}).join('');
 $('bomc').innerHTML=`<h2>สรุปอุปกรณ์ที่ต้องจัดหา</h2><div class="card"><p>Router ${n('rt')} · Firewall ${n('fw')} (HA) · Core ${n('core')} · Distribution ${n('dist')} · Access ${n('acc')} · Access Point ${n('ap')} · ห้องคอม ${n('lab')} · PC สำนักงาน ${n('pc')} · กล้อง ${n('cam')} · เซิร์ฟเวอร์ ${n('srv')}<br>สายใยแก้ว ${fib} เส้น (ควรเดิน 2 เส้นทางแยกท่อ) · สาย UTP Cat6 ${L.length-fib} เส้น · PoE รวมที่ต้องจ่าย ประมาณ ${tp} W (ยังไม่รวมสำรอง 20%)<br>จำนวนพอร์ตและวัตต์ในตารางคำนวณจากแผนผังนี้ ให้เผื่อพอร์ตสำรองประมาณ 20% ตอนสั่งซื้อจริง</p></div><h2>สวิตช์แต่ละตัว</h2><div class="tw"><table><tr><th>สวิตช์</th><th>ชนิด</th><th>พอร์ตที่ใช้</th><th>PoE (W)</th><th>Uplink หลัก / สำรอง</th><th>รุ่นที่แนะนำ (ระดับ)</th></tr>${rows}</table></div>
 <h2>ลำดับการติดตั้งที่แนะนำ</h2><div class="card"><p>1. เตรียมห้อง MDF (อาคาร 2 ชั้น 1): ตู้ Rack ไฟสองวงจร UPS แอร์ และ IDF ประจำอาคารและโซน<br>2. เดินใยแก้ว Core → Distribution สองเส้นทางแยกท่อ แล้วเดิน Cat6 ภายในอาคาร<br>3. ติดตั้ง Router, Firewall, Core, DHCP/DNS แล้วตั้ง VLAN, VRRP และนโยบายไฟร์วอลล์ตามแท็บ VLAN และไฟร์วอลล์<br>4. ทยอยเปิดทีละพื้นที่: อาคาร 2 → T → หอประชุม/สนาม → G → H → อาคาร 1 เมื่อสร้างเสร็จ<br>5. เปิด RADIUS 802.1X, กรองเว็บ, NMS/Syslog และสำรองคอนฟิก<br>6. ทดสอบ failover ด้วยปุ่มจำลองในหน้านี้เป็นแผน แล้วทดสอบถอดสายจริงนอกเวลาเรียน</p></div>`}
render();
function log(t,c){logs.unshift({t:new Date().toLocaleTimeString('th-TH'),m:t,c:c||''});logs=logs.slice(0,8);$('log').innerHTML=logs.map(l=>`<div class="${l.c}"><time>${l.t}</time><span>${l.m}</span></div>`).join('')}
function pick(id){curB=null;document.querySelectorAll('.bl.on').forEach(r=>r.classList.remove('on'));sel=sel===id?null:id;pt++;detail();paint()}
const media=(a,b)=>{const x=a.k,y=b.k,H=['core','fw','dist','rt'];if(['net','isp'].includes(x)||['net','isp'].includes(y))return'ใยแก้ว WAN';if(H.includes(x)||H.includes(y))return'ใยแก้ว 10G';if(x==='acc'&&y==='dist'||x==='dist'&&y==='acc')return'ใยแก้ว 1G';return'UTP Cat6 1G'+(['ap','cam'].includes(x)||['ap','cam'].includes(y)?' + PoE':'')};
const linksHtml=d=>{const pv=tbl().prev;return L.filter(l=>l.a===d.id||l.b===d.id).map(l=>{const dn=l.a===d.id,o=byId[dn?l.b:l.a],bad=!d.up||!o.up,use=!bad&&(pv[l.a]===l.b||pv[l.b]===l.a);
 const role=l.isl?'เชื่อมคู่ Core':dn?(l.bk?'สำรองไป':'หลักไป'):(l.bk?'สำรองจาก':'ปลายทาง'),state=bad?'ขาด':l.bk?(use?'ใช้งานอยู่ (failover)':'สำรอง (standby)'):'ใช้งาน';
 return`${role}: ${o.n}, ${media(d,o)}, ${state}`}).join('<br>')};
const portInfo=d=>{if(!['acc','dist','core'].includes(d.k))return'';const nb=L.filter(l=>l.a===d.id||l.b===d.id),poe=nb.reduce((a,l)=>{const x=byId[l.a===d.id?l.b:l.a];return a+(x.k==='ap'?15:x.k==='cam'?7:0)},0);return`<br>พอร์ตใช้งาน ${nb.length}/${d.k==='acc'?24:48}`+(poe?`<br>PoE ${poe}/370 W`:'')};
const ssTxt=d=>{const a=Math.round(d.u*.2),b=Math.round(d.u*.7),i=D.filter(x=>x.k==='ap').indexOf(d);return`Staff ${a}, Student ${b}, Guest ${d.u-a-b}; 2.4G ช่อง ${[1,6,11][i%3]} / 5G ช่อง ${[36,40,44,48,149,153,157,161][i%8]}`};
const RULES='<h3>กฎหลักของไฟร์วอลล์</h3><p>VLAN 30 ครู → Internet: อนุญาต<br>VLAN 31 นักเรียน → Internet: อนุญาต (กรองเว็บ)<br>VLAN 90 Guest → Internet เท่านั้น<br>VLAN 50 กล้อง → Internet: บล็อก<br>Internet → DMZ Web: เฉพาะพอร์ต 80/443<br>Internet → เครือข่ายภายใน: บล็อกทั้งหมด<br>IPS: บล็อก port scan, SQL injection, brute force</p>';
const grp=d=>['net','isp'].includes(d.k)?'X':['rt','fw','core','srv'].includes(d.k)?'M':['dist','acc'].includes(d.k)?'B':['ap','cam'].includes(d.k)?'P':'-';
function powered(d){const g=grp(d);if(pwr||g==='X')return true;if(g==='M')return batM>0;if(g==='B')return batB>0;if(g==='P')return powered(byId[d.p[0]]);return false}
const upsTxt=d=>({X:'ภายนอก ไม่เกี่ยวข้อง',M:'UPS แกนกลาง',B:'UPS ประจำอาคาร',P:'ไฟจากสวิตช์ (PoE)','-':'ไม่มี ดับทันทีเมื่อไฟดับ'})[grp(d)];
function applyPower(){D.forEach(d=>d.up=d.m&&powered(d));dirty()}
function svc(){const bg=D.filter(d=>!d.up||!['ok','bk'].includes(st(d))).length;const ok=d=>['ok','bk'].includes(st(d)),lf=D.filter(d=>['ap','lab','pc'].includes(d.k)),ap=D.filter(d=>d.k==='ap'),cam=D.filter(d=>d.k==='cam');
 const n=lf.filter(ok).length,w=ap.filter(ok).length,c=cam.filter(ok).length,ds=['srv1','srv2'].filter(i=>reach(i)).length,fwn=['fw1','fw2'].filter(i=>reach(i)).length,ispn=['isp1','isp2'].filter(i=>byId[i].up).length;
 const q=(a,t)=>a===t?'ok':a?'warn':'down',S=[['อินเทอร์เน็ตทั้งโรงเรียน',Math.round(100*n/lf.length)+'%',q(n,lf.length)],['Wi‑Fi (AP ใช้งานได้)',w+'/'+ap.length,q(w,ap.length)],['DHCP/DNS',ds+'/2',q(ds,2)],['วงจร ISP',ispn+'/2',q(ispn,2)],['โหลดวงจร ISP 1 / 2',Math.round(byId.isp1.load)+'% / '+Math.round(byId.isp2.load)+'%','ok'],['ไฟร์วอลล์ HA',fwn+'/2',q(fwn,2)],['เว็บโรงเรียน (จากภายนอก)',reach('web')?'เข้าถึงได้':'เข้าไม่ได้',reach('web')?'ok':'down'],['RADIUS / Wi‑Fi Controller',(reach('auth')?1:0)+(reach('wlc')?1:0)+'/2',q((reach('auth')?1:0)+(reach('wlc')?1:0),2)],['กล้องวงจรปิด',c+'/'+cam.length,q(c,cam.length)],['ไฟฟ้า',pwr?'ปกติ':'UPS แกนกลาง '+batM+' วิ, อาคาร '+batB+' วิ',pwr?'ok':batM>0?'warn':'down'],['NMS เฝ้าระวัง',reach('nms')?'ปกติ':'ล่ม',reach('nms')?'ok':'down']];
 $('svc').innerHTML='<h2>สถานะบริการ</h2>'+S.map(x=>`<div class="sv"><i class="dot" style="background:var(--${x[2]==='warn'?'wn':x[2]==='down'?'dn':'ok'})"></i>${x[0]}<b>${x[1]}</b></div>`).join('');$('top').innerHTML='<h2>อุปกรณ์โหลดสูงสุด</h2>'+D.filter(d=>d.up&&K[d.k].c).sort((a,b)=>b.load-a.load).slice(0,5).map(d=>`<div class="sv">${d.n}<b>${Math.round(d.load)}%</b></div><div class="bar"><i style="width:${d.load}%"></i></div>`).join('')}
function paint(){const pv=tbl().prev;D.forEach(d=>{const c=$('c-'+d.id);if(c){const s=st(d);c.setAttribute('fill',s==='down'?'var(--dn)':s==='ok'||s==='bk'?'var(--ac)':'var(--wn)');c.setAttribute('fill-opacity',s==='down'?.05:(.06+Math.min(.22,d.u/400)).toFixed(2))}});D.forEach(d=>$('n-'+d.id).setAttribute('class','n k-'+d.k+' s-'+st(d)+(d.id.includes('B1')?' u':'')+(sel===d.id?' sel':'')+(d.sp?' sp':'')));
 const rs=sel?(route(sel)||[]):[];
 L.forEach((l,i)=>{const bad=!byId[l.a].up||!byId[l.b].up,use=!bad&&(pv[l.a]===l.b||pv[l.b]===l.a),hl=!bad&&rs.some((x,j)=>(x===l.a&&rs[j+1]===l.b)||(x===l.b&&rs[j+1]===l.a));
  $('l'+i).setAttribute('class','lk'+(l.f?' f':'')+(l.bk?' bk':'')+(bad?' bad':'')+(use&&l.bk?' use':'')+(hl?' hl':''))});
 const on=D.filter(d=>d.up).length,ok=D.filter(d=>['ok','bk'].includes(st(d))).length,us=D.reduce((a,d)=>a+d.u,0);
 $('stats').innerHTML=[[on+'/'+D.length,'เปิดอยู่'],[ok+'/'+D.length,'ใช้งานได้'],[us,'ผู้ใช้ Wi‑Fi'],[blocked,'โจมตีที่บล็อก']].map(x=>`<div class="stat"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}
function detail(){const el=$('detail');if(!sel){el.innerHTML='<p class="mu">คลิกอุปกรณ์บนแผนผังเพื่อดูหน้าที่ สถานะ เส้นทาง และทดสอบ ping</p>';return}
 const d=byId[sel],s=st(d),k=K[d.k],dw=pchain(d.id).slice(1).map(i=>byId[i]).find(x=>!x.up);
 const msg=s==='iso'?`<p>อุปกรณ์เปิดอยู่ แต่${dw?' '+dw.n+' ต้นทางปิดอยู่ ':'ไม่มีเส้นทางสำรองเหลือ '}จึงออกอินเทอร์เน็ตไม่ได้</p>`:s==='warn'?(d.k==='ap'&&(!byId.wlc.up||!byId.auth.up)?'<p>AP ขาด Controller หรือ RADIUS จึงโรมมิ่งและยืนยันตัวตน Wi‑Fi ไม่ได้</p>':'<p>ต่อเครือข่ายได้ แต่ไม่ได้รับ IP และ DNS จึงเปิดเว็บไม่ได้</p>'):s==='bk'?'<p>เส้นทางหลักขัดข้อง ข้อมูลวิ่งผ่านเส้นทางสำรองอัตโนมัติ ผู้ใช้ยังใช้งานได้</p>':s==='down'?'<p>'+(pwr?'อุปกรณ์นี้ถูกปิด อุปกรณ์ที่ต่อผ่านมันอาจหลุดไปด้วย':'ไม่มีไฟเลี้ยง')+'</p>':'';
 el.innerHTML=`<h2>${d.n}</h2><div class="sub">${k.t}, IP ${ipOf(d)}</div><span class="pill s-${s}">${SL[s]}</span>${msg}<h3>ข้อมูลทางเทคนิค</h3><p>VLAN ${k.v}<br>MAC ${mac(d.id)} (จำลอง)<br>เวลาทำงาน <span id="ut">${upt(d)}</span><br>แบนด์วิดท์ <span id="bw">${bw(d)}</span><br>CPU <span id="cpu">${cpu(d)}</span>${portInfo(d)}<br>ไฟสำรอง ${upsTxt(d)}${d.k==='ap'?`<br>ผู้ใช้ Wi‑Fi <span id="us">${d.u}</span> คน<br>SSID <span id="ss">${ssTxt(d)}</span>`:''}</p>
 <h3>ทำงานอย่างไร</h3><p>${d.x2||k.d}</p>${d.x2&&d.k!=='srv'?'<p>'+k.d+'</p>':''}${d.k==='fw'?RULES:''}<h3>การตั้งค่าที่แนะนำ</h3><p>${CFG[d.k]||''}</p><h3>โหลดตอนนี้ <span id="lv">${Math.round(d.load)}%</span></h3><div class="bar"><i id="lb" style="width:${d.load}%"></i></div><svg id="sp" viewBox="0 0 300 36" style="width:100%;margin-top:6px"></svg>
 <h3>การเชื่อมต่อ (สื่อ, ความเร็ว, สถานะ)</h3><p>${linksHtml(d)}</p><div class="row">${d.k==='net'?'':`<button class="on" id="tg">${d.m?'ปิดอุปกรณ์':'เปิดอุปกรณ์'}</button>`}<button id="pg">ping / traceroute</button></div><div class="ping" id="po"></div>`;
 if($('tg'))$('tg').onclick=()=>toggle(d.id);$('pg').onclick=()=>ping(d.id);spark(d)}
function toggle(id){const d=byId[id],nb=D.filter(x=>x.id!==id&&reach(x.id)).length;d.m=!d.m;applyPower();d.since=Date.now();const aff=Math.max(0,nb-D.filter(x=>x.id!==id&&reach(x.id)).length);
 log(d.m?`เปิด ${d.n} กลับมาแล้ว`:`ปิด ${d.n} ${aff?'ทำให้อุปกรณ์หลุด '+aff+' ตัว':'ไม่มีอุปกรณ์หลุด ระบบสลับไปเส้นทางสำรองแล้ว'}`,d.m?'ok':'bad');detail();paint()}
async function ping(id){const tok=++pt,out=$('po'),d=byId[id],w=ms=>new Promise(r=>setTimeout(r,ms)),add=(t,c)=>{if(tok===pt)out.insertAdjacentHTML('beforeend',`<div class="${c||''}">${t}</div>`)};
 if(!d.up){add('อุปกรณ์นี้ปิดอยู่ ส่ง ping ไม่ได้','bad');return}
 add(`traceroute จาก ${d.n} ไปยัง Internet`,'mu');let ms=d.k==='ap'?3+Math.random()*5:0;const ch=(route(id)||pchain(id)).slice(1);
 for(let i=0;i<ch.length;i++){await w(330);if(tok!==pt)return;const h=byId[ch[i]];if(!h.up){add(`ฮอปที่ ${i+1}: ${h.n} ไม่ตอบสนอง (Request timed out)`,'bad');log(`ping จาก ${d.n} ล้มเหลวที่ ${h.n}`,'bad');return}
  ms+=.3+Math.random()*1.2+(h.k==='net'?8+Math.random()*12:0);add(`ฮอปที่ ${i+1}: ${h.n}, ${ms.toFixed(1)} ms`)}
 add('ถึงปลายทางสำเร็จ','ok');log(`ping จาก ${d.n} สำเร็จ ${ms.toFixed(1)} ms`,'ok')}
function spawn(){const cs=D.filter(d=>['ap','lab','pc','cam'].includes(d.k)&&reach(d.id));if(!cs.length)return;const c=cs[Math.random()*cs.length|0];let path=route(c.id);const ci=path.findIndex(i=>/^core/.test(i));
 if(K[c.k].local)path=path.slice(0,ci+1).concat(byId.nas.up?'nas':[]);else if((K[c.k].dh||c.k==='ap')&&Math.random()<.2&&dns())path=path.slice(0,ci+1).concat(byId.srv1.up?'srv1':'srv2');
 const out=Math.random()<.5;if(!out)path=path.slice().reverse();path.forEach(i=>byId[i].cnt++);pk.push({path,i:0,t:0,c:out?'var(--ac)':'var(--ink)'})}
let last=performance.now();
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;let h='';
 pk=pk.filter(p=>{const a=byId[p.path[p.i]],b=byId[p.path[p.i+1]];if(!a||!b||!a.up||!b.up)return false;p.t+=dt*260/Math.max(30,Math.hypot(b.x-a.x,b.y-a.y));
  if(p.t>=1){p.t=0;p.i++;if(p.i>=p.path.length-1)return false}const A=byId[p.path[p.i]],Bn=byId[p.path[p.i+1]];h+=`<circle cx="${A.x+(Bn.x-A.x)*p.t}" cy="${A.y+(Bn.y-A.y)*p.t}" r="5" fill="${p.c}"/>`;return true});
 $('pk').innerHTML=h;requestAnimationFrame(frame)}
const slow=matchMedia('(prefers-reduced-motion: reduce)').matches;
setInterval(()=>{spawn();if(busy){spawn();spawn();spawn()}},slow?900:300);
setInterval(()=>{D.forEach(d=>{d.load=d.load*.5+Math.min(100,d.cnt*10)*.5;d.cnt=0;d.hist.push(d.load);if(d.hist.length>30)d.hist.shift();
  if(d.up&&d.load>85&&!d.hot){d.hot=1;log('โหลดสูงที่ '+d.n+' ('+Math.round(d.load)+'%)','bad')}else if(d.load<65)d.hot=0;
  if(d.k==='ap')d.u=d.up&&reach(d.id)?Math.round(d.base*(busy?1.8:1)*(.9+Math.random()*.2)):0});
 if(!pwr){const a=batM,b=batB;batM=Math.max(0,batM-1);batB=Math.max(0,batB-1);if(a&&!batM)log('UPS แกนกลางหมด อุปกรณ์หลักดับ','bad');if(b&&!batB)log('UPS อาคารหมด สวิตช์และ AP ดับ','bad');applyPower()}
 paint();svc();hero();wanChart();if(curB!=null&&!sel)bld(curB);if(sel&&$('lb')){const d=byId[sel];$('lb').style.width=d.load+'%';$('lv').textContent=Math.round(d.load)+'%';$('ut').textContent=upt(d);$('bw').textContent=bw(d);$('cpu').textContent=cpu(d);if($('us')){$('us').textContent=d.u;$('ss').textContent=ssTxt(d)}spark(d)}},1000);
$('busy').onclick=e=>{busy=!busy;e.target.classList.toggle('on',busy);log(busy?'เริ่มคาบเรียนคอม ทราฟฟิกเพิ่มขึ้น':'จบคาบเรียนคอม ทราฟฟิกกลับเป็นปกติ',busy?'bad':'ok')};
$('b1').onclick=()=>toggle('isp1');$('b2').onclick=()=>toggle('core1');$('b3').onclick=()=>toggle('dB2');
$('rand').onclick=()=>{const u=D.filter(d=>d.up&&d.k!=='net');if(u.length){const d=u[Math.random()*u.length|0];toggle(d.id);sel=d.id;detail();paint()}};
$('reset').onclick=()=>{D.forEach(d=>{d.m=1;d.since=Date.now()});pwr=true;batM=90;batB=45;$('pwr').classList.remove('on');applyPower();pk=[];pt++;log('รีเซ็ตทุกอุปกรณ์เป็นปกติ','ok');detail();paint()};
$('pwr').onclick=e=>{pwr=!pwr;batM=90;batB=45;e.target.classList.toggle('on',!pwr);log(pwr?'ไฟฟ้ากลับมาแล้ว':'ไฟฟ้าดับทั้งโรงเรียน เครื่องที่มี UPS ยังทำงานต่อ',pwr?'ok':'bad');applyPower();detail();paint()};
const AT=['การสแกนพอร์ต','SQL Injection','Brute force SSH','SYN flood (DDoS)','มัลแวร์'];
$('atk').onclick=()=>{const f=['fw1','fw2'].find(i=>reach(i)),t=AT[Math.random()*AT.length|0];
 if(!f){log(`${t} จากภายนอก: ไม่มีไฟร์วอลล์ที่ทำงาน เครือข่ายไม่ได้รับการป้องกัน`,'bad');return}
 const p=route(f).slice().reverse();for(let i=0;i<4;i++)setTimeout(()=>pk.push({path:p,i:0,t:0,c:'var(--dn)'}),i*180);blocked++;log(`${byId[f].n} (IPS) บล็อก ${t} จากภายนอก`,'ok');paint()};
$('spof').onclick=()=>{spOn=!spOn;const c=$('spofc');D.forEach(d=>d.sp=false);if(!spOn){c.hidden=true;paint();return}
 const base=D.filter(d=>d.up&&reach(d.id)).map(d=>d.id),T=D.filter(d=>d.up&&d.k!=='net'&&!['ap','lab','pc','cam'].includes(d.k)),res=[];
 T.forEach(x=>{x.up=false;dirty();let l=base.filter(i=>i!==x.id&&!reach(i)).length;x.up=true;dirty();if(l){res.push([x,l]);x.sp=true}});
 res.sort((a,b)=>b[1]-a[1]);c.hidden=false;
 c.innerHTML=`<h2>วิเคราะห์จุดเดียวล้ม (N‑1)</h2><p>ปิดอุปกรณ์หลักทีละตัว ${T.length} ตัว ทนได้ ${T.length-res.length} ตัว เป็นจุดเดียวล้ม ${res.length} ตัว (วงเหลืองบนแผนผัง)</p><p>`+res.slice(0,12).map(r=>`${r[0].n}: ทำให้หลุด ${r[1]} ตัว`).join('<br>')+'</p>';paint()};
$('detail').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button || !$('detail').contains(button)) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  if (action === 'pick-device') {
    pick(id);
    return;
  }
  if (action === 'toggle-device') {
    toggle(id);
    if (curB !== null) bld(curB);
  }
});

svc();detail();paint();log('เริ่มจำลองเครือข่ายโรงเรียน');requestAnimationFrame(frame);

}
