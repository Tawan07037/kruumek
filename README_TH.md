# kruumek — Phase 1: แยก CSS และ JavaScript ออกจาก HTML

แพ็กเกจนี้สร้างจากไฟล์ `skt-network (1)(2).html` ที่ผู้ใช้อัปโหลดในบทสนทนานี้

## สิ่งที่เปลี่ยน
- ย้าย CSS เดิมจาก `<style>` ไป `assets/css/styles.css` โดยไม่ปรับค่าสี ฟอนต์ ระยะห่าง หรือกฎ CSS
- ย้าย JavaScript เดิมจาก `<script>` ไป `assets/js/app.js` โดยไม่เขียน Logic ใหม่
- `index.html` เปลี่ยนเฉพาะการอ้างอิงไฟล์ CSS และ JavaScript
- ใช้ Classic Script ไม่ใช้ ES Module ในระยะนี้ เพื่อลดความเสี่ยงด้านการเปลี่ยน Scope ของตัวแปรเดิม

## สิ่งที่ยังไม่ได้ทำ
- ยังไม่ได้เพิ่ม Backend, SQL, ระบบ Login หรือ Admin
- ยังไม่ได้ย้ายข้อมูล `localStorage` ไปฐานข้อมูล
- ยังไม่ได้ทำ Minify/Obfuscate/Encrypt (เพราะสิ่งเหล่านี้ไม่สามารถซ่อนโค้ดจากผู้เข้าชมได้)
- ยังไม่ได้เปิด CSP แบบ Enforce
- ยังไม่ได้เปลี่ยน GitHub Pages หรือ Cloudflare Pages

## วิธีทดลองในเครื่อง Windows
1. แตก ZIP ลงโฟลเดอร์ใหม่ เช่น `D:\kruumek-phase1`
2. เปิดโฟลเดอร์ด้วย VS Code
3. เปิด `index.html` ด้วย Chrome หรือใช้ VS Code Live Server
4. ตรวจหน้าแรก เมนู แผนผัง อุปกรณ์ ปุ่มจำลอง VLAN, Firewall, Wi-Fi, Cable, Recommendation และ BOM
5. เปิด F12 > Console ตรวจ JavaScript Error
6. ถ้าทุกอย่างทำงานเหมือนเดิม ให้ใช้โฟลเดอร์นี้เป็นต้นทางสำหรับงาน Phase ถัดไป

## สำคัญ
อย่าอัปโหลดทับ `main` หรือเปิดใช้ Production ทันที ให้ทดสอบใน Branch ใหม่ก่อน และเก็บไฟล์ต้นฉบับเดิมไว้เป็น Backup เสมอ

เว็บไซต์เป็น Static Frontend: ผู้เข้าชมยังสามารถดู Source Code ที่ Browser ดาวน์โหลดได้ตามปกติ ห้ามใส่ Password, API Key, Token หรือข้อมูลส่วนตัวลงในไฟล์ Frontend
