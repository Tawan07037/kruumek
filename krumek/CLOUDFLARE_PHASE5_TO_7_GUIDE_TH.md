# KRUUMEK — Phase 5 ถึง Phase 7 (แยก JavaScript, Backend และ SQL)

> แพ็กเกจนี้ต่อยอดจาก ZIP `krumek(1).zip` ที่ผู้ใช้ส่งมา ใช้ชื่อโปรเจกต์ Cloudflare ว่า `krumek` และคงหน้าตา/HTML/CSS เดิมไว้

## สิ่งที่จัดให้ในแพ็กเกจนี้

### Phase 5 — JavaScript Modules
- `assets/js/main.js` เป็นจุดเริ่มต้น
- `assets/js/data/device-types.js` เก็บชนิดอุปกรณ์จำลอง
- `assets/js/network/model.js` สร้างข้อมูล topology จำลอง
- `assets/js/network/routing.js` คำนวณเส้นทาง/สถานะจำลอง
- `assets/js/core/legacy-app.js` เก็บ UI/Simulator เดิมที่ยังเชื่อมโยงกันมาก เพื่อรักษาพฤติกรรมเดิมในรอบแรก
- `assets/js/ui/recommendations.js` แยก Landing/Recommendations ออก
- `assets/js/services/api.js` ตัวช่วยเรียก Backend
- `admin/index.html` และ `assets/js/admin/main.js` หน้า Admin แยกต่างหาก (ไม่เปลี่ยนดีไซน์หน้าเว็บสาธารณะ)
- เปลี่ยน HTML ให้ใช้ `<script type="module" src="./assets/js/main.js"></script>`
- เปลี่ยนปุ่มอุปกรณ์ที่เคยใช้ inline `onclick` ให้ใช้ `data-action` และ Event Delegation เพื่อรองรับ CSP ที่เข้มขึ้น

หมายเหตุ: `legacy-app.js` ยังเป็นไฟล์หลักที่มี UI/Simulator ส่วนใหญ่ เพราะฟังก์ชันเดิมใช้ตัวแปรร่วมกันจำนวนมาก การแตกย่อยกว่านี้โดยไม่ทดสอบทุกปุ่มเสี่ยงทำให้ระบบจำลองเสีย จึงแยกส่วนข้อมูล, routing และ recommendations ออกก่อนอย่างปลอดภัย นี่เป็นการแยกเป็นโมดูลจริง แต่ยังไม่ใช่การแยกทุกฟังก์ชันเป็นไฟล์ย่อยครบทั้งหมด

### Phase 7 — Backend และ D1 SQL
- Cloudflare Pages Functions อยู่ใน `functions/`
- `functions/api/health.js` ตรวจสุขภาพ API
- `functions/api/public/announcements.js` อ่านเฉพาะประกาศที่เผยแพร่
- `functions/api/admin/whoami.js` ตรวจข้อมูลตัวตน Access ที่ผ่านการตรวจลายเซ็น
- `functions/api/admin/announcements.js` เพิ่ม/แก้ไข/เก็บประกาศแบบ archive
- `functions/api/admin/audit.js` อ่าน Audit Log
- `functions/_lib/access.js` ตรวจ Cloudflare Access JWT ด้วย JWKS + WebCrypto และตรวจ `iss`, `aud`, `exp`, `nbf`, signature
- `migrations/0001_initial.sql` สร้าง `admin_roles`, `announcements`, `audit_logs`

ฐานข้อมูลมีไว้สำหรับข้อมูลส่วนกลางที่แก้ไขจาก Admin เช่น ประกาศ/ข่าวและประวัติการแก้ไข ไม่ได้ย้ายข้อมูลจำลองเครือข่ายทุกค่าไป SQL เพราะข้อมูล topology เป็นข้อมูลจำลองสาธารณะที่หน้าเว็บต้องใช้แสดงผลอยู่แล้ว

## ก่อนเริ่ม: อย่าแก้ Production
1. เก็บ GitHub Pages เดิมไว้
2. ทำงานบน Branch `security/phase1-file-separation`
3. แตก ZIP ลงโฟลเดอร์ใหม่
4. อย่า Merge เข้า `main` จนกว่าจะทดสอบผ่าน

## A. อัปโหลดโค้ดลง GitHub Branch

1. ดาวน์โหลด ZIP และ Extract
2. เปิด GitHub Desktop
3. เลือก Repository `Tawan07037/kruumek`
4. เลือก Branch `security/phase1-file-separation`
5. กด Repository > Show in Explorer
6. สำรองโฟลเดอร์ Local เดิมอีกชุด
7. คัดลอกทุกไฟล์จากโฟลเดอร์ที่แตก ZIP ไปวางในโฟลเดอร์ Local Repository
8. หากถาม Replace ให้ Replace ไฟล์เดิมในสำเนา Local
9. ตรวจว่าใน Root มี `index.html`, `_headers`, `build.sh`, `functions/`, `migrations/`, `assets/`
10. ตรวจว่าไม่มี `.env`, `.dev.vars`, Private Key หรือข้อมูลลับจริง
11. กลับ GitHub Desktop > Changes
12. Commit summary: `Implement JS modules and Pages Functions backend`
13. กด Commit to `security/phase1-file-separation`
14. กด Push origin
15. อย่าเพิ่ง Merge Pull Request

## B. ตั้ง Cloudflare Pages Build

Cloudflare Dashboard > Workers & Pages > `krumek` > Settings > Builds & deployments > Build configurations > Edit configurations

กำหนด:
- Framework preset: `None`
- Production branch: `main`
- Root directory: เว้นว่าง/ค่าเริ่มต้น
- Build command: `sh build.sh`
- Build output directory: `dist`

`build.sh` ทำการสร้าง `dist/`, คัดลอก `index.html`, `assets`, `_headers` และสร้าง `dist/_routes.json` ให้เฉพาะ `/api/*` เรียก Pages Functions

เปิด Preview deployments สำหรับ Branch อื่น และทดสอบ Branch `security/phase1-file-separation` ก่อน Production

## C. Deploy Preview และตรวจ Phase 5

1. หลัง Push ให้เปิด Cloudflare > Workers & Pages > `krumek` > Deployments
2. เปิด Preview Deployment ของ Branch `security/phase1-file-separation`
3. คลิก Visit/Open deployment
4. เปิดหน้าเว็บและกด Ctrl+Shift+R
5. ตรวจหน้าแรก, แผนที่, Logical View, Zoom, Device Detail, Ping, ปุ่มจำลอง ISP/Core/ไฟดับ/Attack, SPOF, VLAN, Firewall, Wi-Fi, Cable, Recommendations, BOM
6. กด F12 > Network > CSS ตรวจ `styles.css` ต้องเป็น 200
7. F12 > Network > JS ตรวจ `main.js`, `device-types.js`, `model.js`, `routing.js`, `legacy-app.js`, `recommendations.js` ต้องเป็น 200
8. F12 > Console ตรวจ Error สีแดง
9. CSP เริ่มต้นเป็น Report-Only อย่าเปลี่ยนเป็น Enforced จนกว่าจะเก็บ/แก้ violation ทั้งหมด

หมายเหตุ: Browser ยังสามารถดู JavaScript ได้ใน F12 เสมอ การแยก Module ไม่ได้เข้ารหัส/ซ่อนโค้ด จุดประสงค์คือจัดระเบียบ ส่วน Secret และสิทธิ์ต้องอยู่ Backend

## D. สร้าง D1 Database

Cloudflare Dashboard > Storage & databases > D1 SQL Database > Create database

ตั้งชื่อ:
`krumek-db`

จากนั้นเปิด Database > Console และวางเนื้อหา `migrations/0001_initial.sql` ทั้งหมด แล้ว Execute

ตรวจว่ามี 3 ตาราง:
- `admin_roles`
- `announcements`
- `audit_logs`

ใช้ SQL ตรวจ:
```sql
SELECT name FROM sqlite_master WHERE type = 'table';
```

## E. เชื่อม D1 Binding กับ Pages

Cloudflare > Workers & Pages > `krumek` > Settings > Bindings > Add > D1 database

กำหนด:
- Variable name: `DB`
- Database: `krumek-db`

บันทึก และตรวจให้ Binding มีทั้ง Production และ Preview Environment (ตั้งค่าแยกกันถ้า Dashboard แสดงแท็บ Preview/Production) จากนั้น Redeploy Preview

## F. ตั้ง Cloudflare Access ก่อนเปิด API Admin

ต้องมี Custom Domain ที่อยู่ใน Cloudflare Zone สำหรับใช้งาน Access/WAF production อย่างครบถ้วน

1. เปิด Cloudflare Zero Trust
2. เข้า Access > Applications > Add an application > Self-hosted
3. สร้าง Access Application สำหรับหน้า Admin path `/admin/*`
4. สร้างอีก Application สำหรับ API path `/api/admin/*` (สำคัญ: ปกป้อง API ด้วย ไม่ใช่เฉพาะหน้า Admin)
5. Policy ใช้ Action `Allow` และระบุเฉพาะ Email ของผู้ดูแลที่ได้รับอนุญาต
6. เปิด MFA/One-time PIN หรือ Identity Provider ที่องค์กรใช้งาน
7. ห้ามใช้ `Everyone` เป็น Allow Policy
8. คัดลอก Team domain จาก Zero Trust Settings
9. คัดลอก Audience (AUD) ของ Access Application ที่ป้องกัน `/api/admin/*`

ตั้ง Pages Environment Variables:
- `ACCESS_TEAM_DOMAIN` = Team domain เช่น `yourteam.cloudflareaccess.com` (ไม่ต้องใส่ https://)
- `ACCESS_AUD` = AUD ของ Application `/api/admin/*`

ตั้งค่าทั้ง Preview และ Production Environment ตามที่ใช้จริง

Backend จะตรวจ Cf-Access-Jwt-Assertion ด้วยลายเซ็น JWKS และตรวจ issuer, audience, expiry, not-before ก่อนเชื่อถือ Subject/Email

## G. สร้าง Admin คนแรก (Bootstrap)

1. Deploy Preview ให้สำเร็จ และตั้ง Access Application `/api/admin/*` ก่อน
2. เข้า URL:
   `https://PREVIEW-URL/api/admin/whoami`
3. Login ผ่าน Cloudflare Access
4. API จะแสดง `subject`, `email`, `role: null`, `provisioned: false` สำหรับ Admin ที่ยังไม่ได้เพิ่มในฐานข้อมูล
5. คัดลอกค่า `subject` และ `email` ของตัวเองไว้ส่วนตัว (อย่าโพสต์สาธารณะ)
6. เปิด Cloudflare D1 > `krumek-db` > Console
7. ใช้คำสั่งด้านล่าง โดยแทนค่าด้วยค่าของตัวเอง:
```sql
INSERT INTO admin_roles (subject, email, role)
VALUES ('วาง-subject-จริง-ตรงนี้', 'อีเมลผู้ดูแลจริง', 'admin');
```
8. ทดสอบ `/api/admin/whoami` อีกครั้ง ต้องแสดง `role: admin` และ `provisioned: true`

ข้อควรระวัง: `subject` เป็นตัวระบุจาก Access JWT ห้ามใช้ค่า email แทน เว้นแต่ Token ระบุ `sub` เป็นค่าเดียวกันจริง ๆ

## H. ทดสอบ API

Admin UI (ต้องผ่าน Access):
`https://PREVIEW-URL/admin/`

Health (สาธารณะ):
`https://PREVIEW-URL/api/health`

Public announcements:
`https://PREVIEW-URL/api/public/announcements`

Admin identity (ต้องผ่าน Access):
`https://PREVIEW-URL/api/admin/whoami`

Admin list (ต้องมี role ใน D1):
`https://PREVIEW-URL/api/admin/announcements`

Audit log (publisher/admin):
`https://PREVIEW-URL/api/admin/audit`

การเพิ่ม/แก้ไขประกาศทำผ่าน same-origin `fetch()` ใน `assets/js/services/api.js` หลังผู้ดูแล Login ผ่าน Access เท่านั้น โดย `editor` สร้าง Draft, `publisher/admin` เผยแพร่ได้ การลบเป็น Soft Archive เพื่อรักษาประวัติ

## I. ตั้งค่า Access Environment Variables

ใน Cloudflare Pages > Settings > Variables and Secrets:
- เพิ่ม `ACCESS_TEAM_DOMAIN`
- เพิ่ม `ACCESS_AUD`

ถ้ามีค่าลับของบริการอื่น ให้เพิ่มเป็น Secret ไม่ใส่ไว้ใน JS, HTML, GitHub หรือ SQL dump
ในแพ็กเกจนี้ยังไม่มี API key ภายนอกที่ต้องใช้ จึงไม่ต้องสร้าง Secret สมมติ

## J. Build และ Deploy

Build command:
`sh build.sh`

Output directory:
`dist`

Root:
ค่าเริ่มต้น/ว่าง

Pages Functions ต้องอยู่ที่ Root:
`functions/`

ห้ามย้าย `functions/` เข้า `dist/functions/`

## K. วิธีทดสอบและ Rollback

1. ทดสอบ Preview ก่อน Production
2. ถ้าหน้าเว็บหรือ API มีปัญหา อย่า Merge PR
3. แก้ใน Branch เดิม แล้ว Push ใหม่
4. ถ้า Production ถูก Deploy ผิดหลัง Merge ให้ใช้ Cloudflare Deployments เลือก Previous Deployment แล้ว Rollback หรือ Revert Commit ผ่าน GitHub PR
5. เก็บ GitHub Pages เดิมไว้จนกว่า Cloudflare Pages, Access, APIs, SQL และ Backup ผ่านการตรวจจริง

## ขอบเขตและข้อจำกัดที่ต้องทราบ
- JavaScript ที่ Browser โหลดได้ยังดูได้ใน DevTools; ไม่มีวิธีที่เชื่อถือได้ในการซ่อน Client-side code
- Backend API ต้องตรวจ Authentication/Authorization ทุก Request; การซ่อนปุ่มไม่ใช่การป้องกัน
- D1 ในแพ็กเกจนี้เก็บประกาศและ Audit Log ตัวอย่าง ไม่ได้เก็บข้อมูลเครือข่ายจริงหรือข้อมูลบุคคลโดยอัตโนมัติ
- ห้ามนำ IP จริง, รหัส Wi-Fi, รหัสผู้ดูแล, ข้อมูลนักเรียน/ครู หรือโครงสร้างเครือข่ายที่ไม่ควรเปิดเผยไปใส่ใน Public GitHub
- CSP ตั้งเป็น Report-Only ก่อน เพื่อไม่ทำให้ Inline style/legacy behavior ถูกบล็อกแบบทันที
- Access JWT audience ต้องเป็น AUD ของ Access App ที่ป้องกัน `/api/admin/*`
