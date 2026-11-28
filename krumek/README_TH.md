# krumek — Phase 5 ถึง Phase 7

โปรเจกต์นี้ต่อยอดจากเว็บไซต์จำลองเครือข่ายเดิม โดยรักษา HTML และ CSS เดิมไว้ และจัด JavaScript เป็นโมดูล พร้อมเตรียม Cloudflare Pages Functions และ D1 SQL

อ่านคู่มือฉบับเต็มที่ `CLOUDFLARE_PHASE5_TO_7_GUIDE_TH.md`

## โครงสร้าง
- `assets/js/main.js` จุดเริ่มต้นของ Frontend
- `assets/js/network/` ข้อมูล topology และ routing จำลอง
- `assets/js/core/legacy-app.js` UI/Simulator เดิมที่ยังเชื่อมโยงกัน
- `assets/js/ui/recommendations.js` Landing และ Checklist
- `assets/js/services/api.js` ตัวช่วยเรียก API
- `functions/` Backend Pages Functions
- `migrations/` SQL migrations สำหรับ D1
- `build.sh` สร้าง Static Output ใน `dist/`

## Build
```bash
sh build.sh
```

Cloudflare Pages:
- Build command: `sh build.sh`
- Build output directory: `dist`
- Root directory: ค่าเริ่มต้น/ว่าง

## สำคัญ
- Branch ทดสอบก่อน ห้าม Merge เข้า `main` จนกว่าจะผ่านการทดสอบทุกฟังก์ชัน
- JavaScript ที่ส่งให้ Browser สามารถอ่านได้เสมอ ห้ามใส่ Secret หรือข้อมูลส่วนตัวลง Frontend
- Backend Admin APIs ต้องผ่าน Cloudflare Access และ D1 role check
