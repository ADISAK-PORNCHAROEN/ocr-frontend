# แผน frontend: OCR Playground

สถานะ: ผู้ใช้ยืนยันทิศทาง frontend แล้ว สัญญา API และขีดจำกัดของ backend ยังไม่ยืนยัน

## เป้าหมายและขอบเขต

สร้างเว็บ portfolio สำหรับทดลอง OCR บนเครื่อง รับ JPG, PNG หรือ PDF ครั้งละหนึ่งไฟล์ รองรับมือถือและเดสก์ท็อป ใช้ภาษาไทยก่อน หน้าหลักมีคำอธิบายสั้น ๆ และจุดอัปโหลดทันที การออกแบบ UX/UI โดยละเอียดจะใช้ impeccable ในขั้นถัดไป

## เทคโนโลยีที่เสนอ

- Next.js App Router, React และ TypeScript
- Tailwind CSS และ component ของโปรเจกต์ใน `components/ui` โดยยังไม่ใช้ shadcn/ui
- TanStack Query สำหรับข้อมูลจาก backend และ polling
- React Context และ reducer สำหรับ session และข้อความที่ผู้ใช้แก้ในหน่วยความจำ
- Native fetch; Zod สำหรับตรวจข้อมูลที่ขอบเขต API
- Vitest และ React Testing Library สำหรับ unit/component tests; Playwright สำหรับ flow หลัก

## ขอบเขตระบบ

Browser เรียก Next.js Route Handlers ซึ่งส่งต่อไป OCR backend ผ่าน BFF แบบบาง โดยรักษา request และ response contract ของ backend เป็นหลัก และจัดการข้อผิดพลาดจากการเชื่อมต่อ ไม่ทำ business logic OCR ซ้ำ ต้องทดสอบ multipart upload, ภาพ binary, ขนาดไฟล์, timeout และการยกเลิก request กับระบบจริง

โครงสร้างเบื้องต้น:

```text
src/
  app/                 # App Router, providers, Route Handlers
  components/ui/       # UI พื้นฐานที่ไม่ขึ้นกับ OCR
  features/ocr/
    api/               # ติดต่อ BFF, ตรวจและแปลง response
    components/        # upload, progress, viewer, editor, page selector
    session/           # session และข้อความที่แก้ไข
    export/            # สร้าง TXT และ JSON
    types.ts
    OcrWorkspace.tsx
  lib/                 # สิ่งที่ใช้ข้าม feature จริง
```

UI primitives เช่น button, input, select, textarea, dialog และ progress สร้างเมื่อจำเป็น พร้อมรองรับ keyboard, focus และ accessibility โดย feature components เป็นผู้ประกอบ UI และพฤติกรรม OCR

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

## จุดที่ต้องยืนยันกับ backend

- API ยังเป็นข้อเสนอ: ตรวจ endpoint, status, error และ schema จาก implementation จริง
- กำหนดขนาดไฟล์ จำนวนหน้าสูงสุด อายุข้อมูล และแหล่งค่าเหล่านี้ก่อนแสดงข้อจำกัดจริง
- ยืนยันรูปแบบ OCR, confidence, พิกัด และความตรงกับภาพแต่ละหน้า
- ทดสอบการลบเมื่อหมดอายุและกรณีปิดแท็บหรือ upload ขาดการเชื่อมต่อ
- ตรวจการส่งต่อไฟล์และภาพผ่าน Next.js พร้อมขีดจำกัดและ timeout ของสภาพแวดล้อมที่ใช้จริง

## ลำดับงานที่เสนอ

1. ทบทวนแผนและยืนยันข้อตกลงที่เหลือกับผู้ใช้และ backend
2. ใช้ impeccable เก็บ product context และออกแบบ UX/UI ทั้ง desktop และมือถือ
3. Setup Next.js และเครื่องมือพัฒนา สร้าง UI primitives ที่จำเป็น
4. พัฒนา workflow ด้วย mock API ครอบคลุม loading, empty, partial failure และ expiry
5. เชื่อม BFF กับ backend จริงและตรวจ contract
6. ทดสอบ upload, polling, edit, restore, export, delete และกรณีผิดพลาดแบบ end-to-end

เอกสารอ้างอิง: `frontend-api.md`, `frontend-guide.md` และ `project-scope.md` ใน repository ของ backend
