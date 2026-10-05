# CoC QA Dashboard

แดชบอร์ดภาษาไทยสำหรับติดตาม FTET/FTES และข้อมูลประกอบการประกันคุณภาพของวิทยาลัยการคอมพิวเตอร์ ม.อ.ภูเก็ต ข้อมูลตั้งต้นมาจากไฟล์ Excel ทุกแท็บ และมี snapshot ใน `public/data/snapshot.json` สำหรับเปิดใช้งานแบบ offline/local

## เริ่มใช้งาน

ต้องมี Node.js 18 ขึ้นไป

```bash
npm install
npm run dev
```

Vite เรียก `npm run sync` อัตโนมัติก่อนเริ่ม dev server และก่อน build; เปิด URL ที่แสดงใน terminal (โดยปกติ `http://localhost:5173`). เส้นทางใช้ hash routing เพื่อรองรับ GitHub Pages โดยไม่ต้องตั้งค่า rewrite

คำสั่งที่ใช้ได้:

```bash
npm run sync       # อ่าน workbook แล้วเขียน public/data/snapshot.json
npm test           # รันทดสอบสูตรด้วย Vitest
npm run build      # sync และสร้างไฟล์ production ใน dist/
npm run preview    # ทดลองเปิด production build ในเครื่อง
```

## เปลี่ยนไฟล์ Excel หรือเพิ่มปี

1. วางไฟล์ `.xlsx` รุ่นใหม่ไว้ที่โฟลเดอร์หลัก แทนไฟล์เดิม (หรือกำหนด `FTET_WORKBOOK` ใน `.env` เป็น path สัมพัทธ์จากโฟลเดอร์หลัก)
2. รัน `npm run sync` เพื่อตรวจการอ่าน workbook; ระบบอ่านทุกแท็บและตัดช่องว่างหัวท้ายของชื่อแท็บ
3. รัน `npm run dev` หรือ `npm run build` อีกครั้ง ข้อมูล snapshot จะถูกสร้างใหม่ก่อนเสมอ
4. ตรวจชื่อแท็บ/แถวที่มีข้อมูลด้วย `node scripts/inspect-workbook.mjs` ก่อนปรับรูปแบบ workbook ใหม่

ตัว normalize หา header จากชื่อฟิลด์ (อาจารย์, รหัสวิชา, FTET, section, ชั่วโมงบรรยาย/ปฏิบัติ, โครงงาน, สัปดาห์) และแถวหน่วยกำกับถัดไป ไม่อิงตำแหน่งคอลัมน์ตายตัว ข้อมูลต้นทางทุกแท็บยังคงอยู่ใน snapshot เพื่อให้เปิดตรวจได้

ปี 2564–2566 ไม่มีแท็บรายละเอียดรายอาจารย์/วิชาใน workbook นี้ จึงแสดงเฉพาะข้อมูลสรุปและหน้า detail จะแจ้งว่าไม่มีข้อมูลแทนการใส่ค่า 0

## เชื่อม Google Sheets (ไม่บังคับ)

1. สร้าง `.env` จาก `.env.example` และกำหนด `VITE_SHEET_ID=<spreadsheet-id>`
2. แชร์ Google Sheet เป็น “Anyone with the link – Viewer” และให้ชื่อแท็บตรงกับชื่อใน snapshot
3. เริ่มแอปใหม่หรือใช้ปุ่ม “รีเฟรชข้อมูล” ในแอป ระบบเรียก `gviz/tq?tqx=out:csv&sheet=...` แยกทุกแท็บ; ถ้าดึงแท็บใดไม่ได้จะใช้ snapshot สำหรับแท็บนั้นและแสดงสถานะ fallback ในหน้า Settings

Google Sheets อาจปิดกั้น cross-origin request ตามนโยบายขององค์กร/เบราว์เซอร์ได้ หากเห็น fallback ให้ตรวจสิทธิ์การแชร์และนโยบาย CORS; แอปไม่ต้องพึ่ง Google Sheets เพื่อเปิดใช้งาน

## หน้าต่าง ๆ และข้อมูลต้นทาง

| หน้า | ข้อมูลหลัก |
| --- | --- |
| ภาพรวม | `62-67 สรุป FTE-All`, ตารางรายละเอียดที่มี, เส้นเป้าหมายจาก Settings |
| FTET รายหลักสูตร | `62-67 สรุป FTE-All`, `62-67 สรุป FTE-All -เทอม`, `สรุป FTET` สำหรับข้อมูลเก่า; ค่าในแท็บเปรียบเทียบวิธีของ IT/SE/EBiz แสดงแยกในหน้าวิธีคำนวณ |
| รายอาจารย์ | แท็บ `FTET_*`/`FTE_*` ที่มีรายละเอียด; ค่า FTET รายแถวคำนวณใหม่ |
| รายวิชา | แท็บรายละเอียด `FTET_*`/`FTE_*` ที่มีรายละเอียด |
| องค์ประกอบโหลด | รายละเอียดรายวิชา รวมชั่วโมงตามหลักสูตรและเทอม |
| เปรียบเทียบ | ตารางสรุปรายเทอม/รายปีและการเปลี่ยนแปลง YoY |
| วิธีคำนวณ | `วิธีการคำนวณ`, `สรุป`, และตัวอย่างแท็บ `Met1/Met2/Met4/Met234` |
| ตรวจสอบข้อมูล | `สรุป FTET`, ตารางสรุปหลัก, ค่า FTETS ในแท็บรายละเอียด, แถวข้อความ/ซ้ำ/#REF! |
| เครื่องมือ FTES | สูตร FTES/Teaching Load และเกณฑ์จาก `สรุปอาจารย์ที่เหมาะสม` |
| ตั้งค่า | ค่าคงที่ เป้าหมาย alias/mapping ธีม รูปแบบปี และสถานะแท็บ |

## สูตร

- FTET ต่อแถว = `((ชั่วโมงบรรยาย × 2) + (ชั่วโมงปฏิบัติ × 1.5) + โครงงาน) × section × สัปดาห์ / (35 × 15)`
- FTETS อาจารย์ = ผลรวม FTET ต่อแถวของอาจารย์ในเทอมนั้น
- FTET หลักสูตรรายเทอมมาจากตารางสรุปใน workbook; ค่าเฉลี่ย CoC คำนวณจาก Comp, DE, Dbiz, MsComp โดยไม่รวม AISE
- FTES = `(หน่วยกิต × นักศึกษา) / 18`; Teaching Load = `(ชั่วโมงบรรยาย + ชั่วโมงปฏิบัติ / 2) × section`
- ช่องตัวเลขที่มีข้อความ (เช่น เรียนร่วม/ประสานงาน) ถูกนับเป็น 0 และติดธง; `#REF!` ถือเป็น error/ไม่มีข้อมูล ไม่ใช่ 0 ในผลตรวจสอบ

หน้า Settings และ what-if ยอมให้ปรับค่าคงที่ใน browser; การแก้ค่าดังกล่าวไม่เขียนทับ source workbook หรือ snapshot

เพิ่มหน้าใหม่ได้โดยสร้างไฟล์ใน `src/pages/` แล้วเพิ่ม route object หนึ่งบรรทัดใน `src/config/routes.js` โดยกำหนด `page: lazy(() => import("../pages/NewPage.jsx"))`; sidebar และ router ใช้ config ชุดเดียวกัน

## Deploy

### Vercel

นำ repository เข้า Vercel แล้วใช้ค่าเริ่มต้น:

- Build command: `npm run build`
- Output directory: `dist`

หากใช้ Google Sheets ให้ตั้ง `VITE_SHEET_ID` ใน Environment Variables ก่อน build; snapshot ยังเป็น fallback

### GitHub Pages

เปิด GitHub Pages ให้ deploy เนื้อหาใน `dist/` (เช่นผ่าน GitHub Actions จาก branch `main`). ตัวแอปใช้ hash routing จึง refresh หน้า route ได้โดยไม่ต้องสร้าง rewrite rules. หาก repository เป็น project page, ตั้ง Vite `base` ให้ตรงชื่อ repository ก่อน build (เช่น `/coc-qa-dashboard/`) และใช้ `npm run build`; ถ้าเป็น `username.github.io` ให้ใช้ base `/`.

> ข้อมูลนี้เป็นเครื่องมือช่วยวิเคราะห์และตรวจสอบความสอดคล้องเท่านั้น ค่าที่คำนวณจากรายละเอียดอาจต่างจากค่าเฉลี่ยสรุปใน workbook ซึ่งเป็นคนละระดับการ aggregate; ตรวจสอบต้นทางและเกณฑ์อย่างเป็นทางการก่อนนำไปใช้ตัดสินใจ
