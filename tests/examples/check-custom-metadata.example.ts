/**
 * ตัวอย่างการเช็คข้อมูล "อื่น ๆ ระบุ..." ใน MS_METADATA_LIST
 * 
 * ใช้สำหรับ validation test cases ที่ผู้ใช้เลือก "อื่น ๆ ระบุ..." และกรอกข้อมูลเอง
 */

import {
  expectCustomMetadataCreated,
  expectOtherMetadataExistsByMetadataId,
  expectOtherMetadataExists,
  getOtherMetadataCode,
} from "../helpers/oracle-db";

// ================================
// ตัวอย่างที่ 1: เช็คประเภทข้อมูล (customTypeName)
// ================================
// Form field: "ประเภทข้อมูล" เลือก "อื่น ๆ ระบุ..."
// Input field: customTypeName = "ข้อมูลประเภทอื่น ๆ ทดสอบ"
// METADATA_ID: 1
// CODE: "9"

async function checkCustomType() {
  const typeName = "ข้อมูลประเภทอื่น ๆ ทดสอบ";
  
  // วิธีที่ 1: ใช้ฟังก์ชัน expectCustomMetadataCreated (แนะนำ)
  await expectCustomMetadataCreated(1, typeName);
  // Output: ✓ พบข้อมูล "อื่น ๆ" [METADATA_ID=1, CODE=9]: 1 row(s)
  //         - ข้อมูลประเภทอื่น ๆ ทดสอบ (ID: 359)
  
  // วิธีที่ 2: ใช้ฟังก์ชัน expectOtherMetadataExistsByMetadataId
  await expectOtherMetadataExistsByMetadataId(1, typeName);
  
  // วิธีที่ 3: ดึง CODE มาเองแล้วเช็ค
  const code = getOtherMetadataCode(1); // "9"
  await expectOtherMetadataExists(typeName, code);
}

// ================================
// ตัวอย่างที่ 2: เช็คหน่วยความถี่ของการปรับปรุงข้อมูล
// ================================
// METADATA_ID: 9
// CODE: "X"

async function checkUpdateFrequencyUnit() {
  const frequencyUnit = "หน่วยความถี่ของการปรับปรุงข้อมูล23";
  
  await expectCustomMetadataCreated(9, frequencyUnit);
  // Output: ✓ พบข้อมูล "อื่น ๆ" [METADATA_ID=9, CODE=X]: 1 row(s)
  //         - หน่วยความถี่ของการปรับปรุงข้อมูล23 (ID: 360)
}

// ================================
// ตัวอย่างที่ 3: เช็ควัตถุประสงค์
// ================================
// METADATA_ID: 20
// CODE: "9"

async function checkObjective() {
  const objectiveName = "วัตถุประสงค์อื่น ๆ ทดสอบ";
  
  await expectCustomMetadataCreated(20, objectiveName);
}

// ================================
// ตัวอย่างการใช้ใน test case
// ================================

// Scenario Exception: ตรวจ validation Step 2 - ข้อมูลประเภทอื่น ๆ ระบุ
test("Scenario Exception: ตรวจ validation Step 2 - ข้อมูลประเภทอื่น ๆ ระบุ", async ({ page }) => {
  await mLogin(page);
  await mManageReportHeaderClick(page);
  await mReportPart1(page);

  // Step 2: กรอกข้อมูลทั่วไป
  const customTypeName = "ข้อมูลประเภทอื่น ๆ ทดสอบ";
  
  // เลือก "ประเภทข้อมูล" = "อื่น ๆ ระบุ..."
  await page.locator("#admin-report-type").click();
  await page.getByText("ข้อมูลประเภทอื่น ๆ ระบุ").click();
  
  // กรอกชื่อประเภทข้อมูล
  await page.locator("#admin-report-custom-type-name").fill(customTypeName);
  
  // กรอกข้อมูลอื่น ๆ และบันทึก
  // ...
  await saveReport(page);
  
  // ตรวจสอบข้อมูลใน database
  const dbResult = await expectLatestDatasetSaved();
  
  // เช็คว่าข้อมูล "อื่น ๆ" ถูกสร้างใน MS_METADATA_LIST
  await expectCustomMetadataCreated(1, customTypeName);
  // ✓ พบข้อมูล "อื่น ๆ" [METADATA_ID=1, CODE=9]: 1 row(s)
  //   - ข้อมูลประเภทอื่น ๆ ทดสอบ (ID: 359)
  
  // Verify
  expect(dbResult.latestId).toBeTruthy();
  expect(dbResult.dataset.length).toBe(1);
  expect(dbResult.metadata.length).toBeGreaterThan(0);
  expect(dbResult.dicts.length).toBeGreaterThan(0);
});

// ================================
// Mapping Reference
// ================================
/*
const OTHER_METADATA_CODES: Record<number, string> = {
  1: "9",    // ประเภทข้อมูล (type) - customTypeName
  8: "99",
  9: "X",    // หน่วยความถี่ของการปรับปรุงข้อมูล
  11: "99",
  13: "99",
  15: "99",
  20: "9",   // วัตถุประสงค์ (objective)
  21: "99",
  22: "99",
  28: "99",
  30: "99",
  35: "99",
};
*/
