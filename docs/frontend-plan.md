# แผน frontend: OCR Playground

สถานะ: implementation สำหรับ Issues #4–#9 ผ่าน acceptance checks และ merge เข้า `main` ผ่าน PR #10 แล้ว การเชื่อมต่อ backend จริงผ่าน Next.js BFF ผ่าน local browser flow; Issue #3 ยังเป็น specification หลัก

## เป้าหมายและขอบเขต

สร้างเว็บ portfolio สำหรับทดลอง OCR บนเครื่อง รับ JPG, PNG หรือ PDF ครั้งละหนึ่งไฟล์ รองรับมือถือและเดสก์ท็อป ใช้ภาษาไทยก่อน หน้าหลักมีคำอธิบายสั้น ๆ และจุดอัปโหลดทันที ใช้แนวทาง Paperflow (C) ซึ่งบันทึกไว้ใน `DESIGN.md` และ `docs/design/concept-c.html`

## เทคโนโลยีที่ใช้

- Next.js App Router, React และ TypeScript
- Tailwind CSS และ component ของโปรเจกต์ใน `components/ui` โดยยังไม่ใช้ shadcn/ui
- TanStack Query สำหรับข้อมูลจาก backend และ polling
- React reducer ใน job session สำหรับหน้าปัจจุบันและข้อความที่ผู้ใช้แก้ในหน่วยความจำ
- Native fetch; Zod สำหรับตรวจข้อมูลที่ขอบเขต API
- Vitest และ React Testing Library สำหรับ unit/component tests; Playwright สำหรับ flow หลัก

## ขอบเขตระบบ

Browser เรียก Next.js Route Handlers ซึ่งส่งต่อไป OCR backend ผ่าน BFF แบบบาง โดยรักษา request และ response contract ของ backend เป็นหลัก และจัดการข้อผิดพลาดจากการเชื่อมต่อ ไม่ทำ business logic OCR ซ้ำ Local browser integration ทดสอบ multipart upload และภาพ binary กับ backend จริง ส่วน timeout และการยกเลิก request ทดสอบกับ HTTP fixture ดูผลและขอบเขตที่ยังไม่ได้วัดใน [`TESTING.md`](TESTING.md)

โครงสร้างปัจจุบัน:

```text
src/
  app/                 # App Router, providers, Route Handlers
  components/ui/       # UI พื้นฐานที่ไม่ขึ้นกับ OCR
  features/ocr/
    api/               # ติดต่อ BFF, ตรวจและแปลง response
    components/        # upload, progress, review, editor and page selector
    session/           # session และข้อความที่แก้ไข
    export/            # สร้าง TXT และ JSON
    queries.ts         # query keys, polling and mutations
  lib/server/          # อ่านค่า BFF environment
```

Reusable UI primitives ปัจจุบันมี button, card, progress และ textarea ส่วน upload ใช้ native file input โดย feature components เป็นผู้ประกอบ UI และพฤติกรรม OCR

## ข้อมูลและ workflow

1. เลือกไฟล์ ตรวจเบื้องต้นว่ามีไฟล์และชนิดรองรับ แล้วส่งไป backend; backend เป็นผู้ตรวจเนื้อหาและขีดจำกัดจริง
2. เมื่อได้รับ job ID ให้ตรวจสถานะเป็นระยะ และหยุดเมื่อ completed, partially completed หรือ failed; เปิดหน้าแก้ไขเมื่องานเข้าสู่สถานะสิ้นสุด
3. แสดงหน้าที่สำเร็จ หน้าว่าง และหน้าที่ล้มเหลวแยกกัน หน้าว่างแก้ไขได้ ส่วนหน้าที่ล้มเหลวไม่มีผล OCR ให้แก้
4. เก็บข้อความแก้ไขแยกตามงานและหน้าในหน่วยความจำ แยกจากผล OCR ต้นฉบับ สลับหน้าแล้วไม่หาย แต่รีเฟรชหรือปิดหน้าแล้วเริ่มใหม่ การคืนค่าหน้าปัจจุบันต้องยืนยันก่อน
5. ก่อนดาวน์โหลด ดึงผลทุกหน้าที่สำเร็จแม้ยังไม่เคยเปิด หากดึงไม่ครบเพราะเครือข่าย ให้แจ้งและลองใหม่ ไม่สร้างไฟล์ที่ขาดข้อมูลโดยไม่ตั้งใจ หากงานสำเร็จบางส่วนให้เตือนก่อนดาวน์โหลด
6. TXT มีเลขหน้าทุกหน้า รวมหน้าว่างและหน้าล้มเหลว JSON แยกข้อความแก้ไขจาก OCR ต้นฉบับและระบุหน้าที่ล้มเหลว พิกัดและ confidence เป็นของ OCR ต้นฉบับ
7. เริ่มใหม่หรือจบงานให้ส่ง DELETE หากลบไม่สำเร็จให้ลองอีกครั้งหรือเริ่มใหม่ต่อได้ พร้อมแจ้งว่าการลบเมื่อหมดอายุเป็นกลไกสำรองของ backend

ข้อความที่แก้จนว่างต้องไม่ถูกเข้าใจว่าไม่มี draft การดาวน์โหลดบันทึก snapshot ณ เวลานั้น หากแก้เพิ่มให้เตือนก่อนออกอีกครั้ง ใช้ browser warning เมื่อมีการแก้ไขที่ยังไม่ได้ดาวน์โหลด แต่ไม่พึ่งการปิดแท็บเพื่อส่ง DELETE หากงานหมดอายุ ให้ผู้ใช้คัดลอกข้อความที่ยังอยู่ในหน่วยความจำได้ก่อนเริ่มใหม่ และไม่สร้างไฟล์รวมที่รับประกันความครบถ้วนไม่ได้

หาก upload ขาดการเชื่อมต่อก่อนรับ job ID ให้ผู้ใช้เลือกส่งใหม่เอง เพราะ backend อาจรับงานไปแล้ว อาศัย backend ลบงานที่หมดอายุเป็นกลไกสำรอง ป้องกันผล async ของงานเก่ามาแก้ session ของงานใหม่

## ผลตรวจจาก backend

- Endpoint, status, error และ schema ตรงกับ [สัญญา API ของ backend](https://github.com/ADISAK-PORNCHAROEN/ocr-backend/blob/develop/docs/frontend-api.md) ใน local browser run; capabilities ใช้ตรวจชนิดและขนาดไฟล์ก่อนส่ง ส่วน backend เป็นผู้ตรวจข้อจำกัดของเอกสาร
- หน้าอัปโหลดไม่แสดงเพดานขนาดไฟล์ พิกเซล หรือจำนวนหน้า; backend ยังคงบังคับขนาดไฟล์และ pixel budgets โดยไม่มีเพดานจำนวนหน้าตายตัว
- ทดสอบ PDF สองหน้ากับภาพ PNG ผ่าน Next.js BFF แล้ว ได้ OCR text, ภาพหน้า, TXT, JSON และพิกัดบรรทัด จากนั้น DELETE สำเร็จ
- Backend TTL เป็นทางสำรองเมื่อปิดแท็บหรือ DELETE ล้มเหลว ทดสอบหมดอายุด้วย TTL 60 วินาทีแล้วได้ `404` และไม่มีไฟล์ใน isolated storage
- accuracy กับชุดเอกสารจริงและค่าตั้งของ production ยังไม่ได้วัด การตรวจนี้ยืนยัน local contract เท่านั้น

## สถานะงาน

1. Issue #3 เป็นข้อกำหนดผลิตภัณฑ์หลักและไม่สร้าง spec ซ้ำ
2. บันทึกแนวทาง Paperflow (C) สำหรับ desktop และ mobile แล้ว
3. Setup Next.js และ UI primitives ที่ใช้จริงแล้ว
4. ทำ workflow ผ่าน fixture ครอบคลุม loading, empty, partial failure และ expiry แล้ว
5. เชื่อม BFF กับ backend จริงและตรวจ contract แล้ว
6. ทดสอบ upload, polling, edit, restore, export, delete และ failure cases แล้ว ดูผลตรวจใน [`TESTING.md`](TESTING.md)

เอกสารอ้างอิง: `frontend-api.md`, `frontend-guide.md` และ `project-scope.md` ใน repository ของ backend
