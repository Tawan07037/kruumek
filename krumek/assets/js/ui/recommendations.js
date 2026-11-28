/**
 * Landing page effects and recommendation checklist.
 * localStorage is used only for this visitor's own checklist preference.
 * It is not an authoritative or shared database.
 */
export function initializeRecommendations({ D }) {
  const $ = (id) => document.getElementById(id);

  const goTab=t=>{const b=document.querySelector('#tabs [data-t="'+t+'"]');if(b)b.click();$('app').scrollIntoView({behavior:'smooth',block:'start'})};
  document.querySelectorAll('[data-go]').forEach(a=>a.onclick=e=>{e.preventDefault();const t=a.dataset.go;if(t==='home')scrollTo({top:0,behavior:'smooth'});else goTab(t)});
  (function(){const S=[...document.querySelectorAll('.sk-s')],dots=$('skd');let i=0,t;
   const go=n=>{i=(n+S.length)%S.length;S.forEach((x,k)=>x.classList.toggle('on',k===i));[...dots.children].forEach((b,k)=>b.classList.toggle('on',k===i))};
   const rs=()=>{clearInterval(t);if(!matchMedia('(prefers-reduced-motion: reduce)').matches)t=setInterval(()=>go(i+1),6500)};
   dots.innerHTML=S.map((_,k)=>'<button aria-label="สไลด์ '+(k+1)+'"></button>').join('');
   dots.onclick=e=>{const b=e.target.closest('button');if(b){go([...dots.children].indexOf(b));rs()}};
   $('skp').onclick=()=>{go(i-1);rs()};$('skn').onclick=()=>{go(i+1);rs()};$('skh').onmouseenter=()=>clearInterval(t);$('skh').onmouseleave=rs;go(0);rs()})();
  const cnt=(b,n)=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches){b.textContent=n;return}const t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/1200);b.textContent=Math.round(n*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(f)})(t0)};
  const NV={dev:D.length,ap:D.filter(d=>d.k==='ap').length,sw:D.filter(d=>['core','dist','acc'].includes(d.k)).length,rm:28,vl:9};
  const io=typeof IntersectionObserver!=='undefined'?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);const b=e.target.querySelector('b[data-k]');if(b)cnt(b,NV[b.dataset.k])}}),{threshold:.15}):null;
  const watch=()=>document.querySelectorAll('.rv:not(.in)').forEach(x=>{if(io)io.observe(x);else{x.classList.add('in');const b=x.querySelector('b[data-k]');if(b)b.textContent=NV[b.dataset.k]}});
  addEventListener('scroll',()=>$('skup').classList.toggle('on',scrollY>600),{passive:true});$('skup').onclick=()=>scrollTo({top:0,behavior:'smooth'});
  const PR={h:['เร่งด่วน','down'],m:['สำคัญ','warn'],l:['ควรมี','bk']};
  const REC=[['A','โครงสร้างพื้นฐานและหน้างาน',[
  ['h','สำรวจหน้างานก่อนซื้อของ','ทำ Wi‑Fi site survey ทุกอาคาร และเดินสำรวจเส้นทางท่อ/หลุมพักจริงเพื่อวัดความยาวสาย ตัวเลขในหน้านี้เป็นแผนตั้งต้นจากแผนที่ ไม่ใช่ค่าสำรวจ','ให้ผู้รับเหมาออกแบบเสนอแบบ as‑built พร้อมตำแหน่ง AP และเส้นทางท่อ A/B'],
  ['h','ไฟฟ้า UPS และกราวด์','Core, Firewall, Router, Server ควรมี UPS แบบ online และไฟ 2 วงจร สวิตช์อาคารมี UPS ย่อย ระบบกราวด์และกันฟ้าผ่าสำคัญเพราะสายนอกอาคารเสี่ยง','คำนวณโหลดวัตต์รวมแล้วเผื่อ 30% ใช้ใยแก้วระหว่างอาคาร และมี surge protector ทุกสาย UTP ที่ออกนอกอาคาร'],
  ['m','ห้อง MDF/IDF','แอร์ ระบายอากาศ ตู้ Rack ระบบเข้าออกจำกัดคน กล้อง และเซนเซอร์อุณหภูมิ','ตั้งแจ้งเตือนเมื่ออุณหภูมิห้องสูงผิดปกติ และแยกห้อง MDF ออกจากจุดที่น้ำรั่วได้ง่าย'],
  ['m','ป้ายและเอกสาร','หมายเลขสายและพอร์ตให้ตรงกับตารางสายเคเบิลและแผน IP/VLAN ในหน้านี้','ใช้ป้ายพิมพ์ทนแดด และเก็บเอกสารฉบับล่าสุดไว้ในที่ที่ผู้ดูแลทุกคนเข้าถึงได้']]],
  ['B','ความปลอดภัยและกฎหมาย',[
  ['h','เก็บ log ตามกฎหมายและยืนยันตัวตนผู้ใช้','ผู้ให้บริการอินเทอร์เน็ตมีหน้าที่เก็บข้อมูลจราจรคอมพิวเตอร์อย่างน้อย 90 วัน และต้องระบุตัวผู้ใช้ได้ จึงควรใช้ 802.1X/RADIUS หรือ captive portal แทนรหัส Wi‑Fi ร่วมกัน','เก็บ log ที่ Firewall/RADIUS/DHCP แบบห้ามแก้ไข ตั้งเวลาให้ตรงกันด้วย NTP และปรึกษาฝ่ายกฎหมายเรื่องรายละเอียดข้อมูลที่ต้องเก็บ'],
  ['m','ข้อมูลส่วนบุคคล (PDPA)','กล้องและข้อมูลนักเรียนต้องมีนโยบาย ป้ายแจ้ง และสิทธิ์การเข้าถึง รวมถึงระยะเวลาเก็บ','ปรึกษาผู้รับผิดชอบ PDPA ของโรงเรียนหรือเขตพื้นที่'],
  ['l','NAC และความปลอดภัยพอร์ตสายแลน','ใช้ 802.1X กับพอร์ตสายแลนของสำนักงานเพื่อกันอุปกรณ์แปลกปลอมเสียบสาย','เริ่มที่สำนักงานก่อน แล้วขยายเมื่อทีมไอทีพร้อม']]],
  ['C','ความต่อเนื่องของระบบ',[
  ['h','สำรองข้อมูลและคอนฟิก','สำรองคอนฟิกอุปกรณ์ ไฟล์เซิร์ฟเวอร์ และภาพกล้อง ตามหลัก 3 ชุด 2 สื่อ 1 ชุดอยู่นอกสถานที่ พร้อมซ้อมกู้คืน','ตั้งสำรองอัตโนมัติรายวัน และซ้อมกู้คืนอย่างน้อยปีละครั้ง'],
  ['m','ซ้อมระบบล่ม','ทดสอบสลับ ISP, Firewall, Core และไฟดับทุกไตรมาส จดเวลาที่ระบบกลับมาและปัญหาที่พบ','ใช้ปุ่มจำลองในหน้านี้เป็นสคริปต์ แล้วทดสอบจริงนอกเวลาเรียน'],
  ['l','อะไหล่สำรองและสัญญาบำรุงรักษา','เก็บสวิตช์และ AP สำรองที่ตั้งค่าไว้แล้ว และทำสัญญา MA กับอุปกรณ์หลัก (Core, Firewall)','ระบุเวลาตอบรับและเวลาซ่อมในสัญญา']]],
  ['D','ประสิทธิภาพและการเฝ้าระวัง',[
  ['m','ระบบเฝ้าระวังและแจ้งเตือน (NMS)','แจ้งทีมไอทีทันทีเมื่ออุปกรณ์ล่ม โหลดเกิน หรือ UPS ทำงานด้วยแบตเตอรี่','ส่งแจ้งเตือนทางอีเมลหรือแชตกลุ่มของทีม และกำหนดเวรเข้าตรวจ'],
  ['m','แบนด์วิดท์และ QoS','ประเมินจากจำนวนผู้ใช้พร้อมกัน คูณความเร็วที่ต้องการต่อคน การสอบออนไลน์และวิดีโอคอลใช้มากกว่าการเปิดเว็บ','ทำ QoS ให้ระบบสอนและสอบมาก่อน และจำกัดความเร็วต่อคนใน SSID นักเรียนและ Guest']]],
  ['E','แผนระยะยาวและงบประมาณ',[
  ['l','ทยอยลงทุนตามเฟส','เริ่มจาก MDF, Core, Firewall, ISP คู่ แล้วขยายอาคาร 2 → T → หอประชุม → G → H → อาคาร 1','ตั้งงบรายปี และเผื่อพอร์ตสำรอง 20% ตั้งแต่ซื้อครั้งแรก']]]];
  let CK={},RF='*';try{CK=JSON.parse(localStorage.getItem('sk-rec')||'{}')}catch(e){}
  function recs(){const tot=REC.reduce((a,c)=>a+c[2].length,0),dn=Object.values(CK).filter(Boolean).length;
   $('recc').innerHTML='<div class="card"><b>ความคืบหน้ารวม '+dn+'/'+tot+'</b><div class="bar" style="margin-top:6px"><i style="width:'+(100*dn/tot)+'%"></i></div></div><div class="rf">'+[['*','ทั้งหมด ('+tot+')']].concat(REC.map(c=>[c[0],c[0]+' '+c[1]+' ('+c[2].length+')'])).map(x=>'<button data-f="'+x[0]+'" class="'+(RF===x[0]?'on':'')+'">'+x[1]+'</button>').join('')+'</div>'
   +REC.filter(c=>RF==='*'||RF===c[0]).map(c=>{const d=c[2].filter((_,i)=>CK[c[0]+(i+1)]).length;return'<section class="rcat"><h3><span class="bd">'+c[0]+'</span>'+c[1]+'</h3><div class="pr"><span>เสร็จ '+d+'/'+c[2].length+'</span><div class="bar"><i style="width:'+(100*d/c[2].length)+'%"></i></div></div><div class="rg">'+c[2].map((r,i)=>{const id=c[0]+(i+1);return'<div class="rc rv '+r[0]+(CK[id]?' dn2':'')+'"><span class="tag s-'+PR[r[0]][1]+'">'+PR[r[0]][0]+'</span><b><span class="id">'+id+'</span>'+r[1]+'</b><p>'+r[2]+'</p><p class="how">วิธีเริ่มทำ: '+r[3]+'</p><label class="ck"><input type="checkbox" data-id="'+id+'"'+(CK[id]?' checked':'')+'> ทำแล้ว</label></div>'}).join('')+'</div></section>'}).join('');watch()}
  $('recc').onclick=e=>{const f=e.target.closest('[data-f]');if(f){RF=f.dataset.f;recs();return}};
  $('recc').onchange=e=>{const id=e.target.dataset&&e.target.dataset.id;if(!id)return;CK[id]=e.target.checked;try{localStorage.setItem('sk-rec',JSON.stringify(CK))}catch(x){}recs()};
  recs();watch();
}
