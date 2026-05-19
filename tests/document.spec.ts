import { test, expect, Page } from "@playwright/test";
import { randomText } from "../share/randomText";
import { selectAntdDateByDay, selectAntdOption } from "../share/selectAntd";
import { createRandomUploadFile } from "../share/fileRandom";
import { login } from "../share/login.spec";
import { logout } from "../share/logout.spec";
let docnamecheck: string;
test("document test", async ({ page }) => {
  await test.step("login", async () => {
    await login(page);
  });
  await page.locator("button#จัดการข้อมูล-5").click();
  await page.locator("a#จัดการเอกสารเผยแพร่-1").click();
  await expect(page).toHaveURL(/.*manage\/document/);

  await test.step("ตรวจสอบข้อมูล", async () => {
    await checkdata(page);
    // await logout(page);
  });

  await test.step("เพิ่มข้อมูล", async () => {
    await adddata(page);
    // await logout(page);
  });

  await test.step("แก้ไขข้อมูล", async () => {
    await updatedata(page);
    // await logout(page);
  });

  await test.step("ลบข้อมูล", async () => {
    await deletedata(page);
    // await logout(page);
  });
});

async function checkdata(page: Page) {
  await page.locator("#submit").click();
  await expect(page.locator("#docName_help")).toContainText(
    "กรุณากรอกชื่อเอกสาร",
  );
  await expect(page.locator("#catalogCode_help")).toContainText(
    "กรุณาเลือกหมวดหมู่",
  );
  await expect(page.locator("#detail_help")).toContainText(
    "กรุณากรอกรายละเอียดเอกสาร",
  );
  await expect(page.locator("#publishStatus_help")).toContainText(
    "กรุณาเลือกสถานะ",
  );
  await expect(page.locator("#pubDate_help")).toContainText(
    "กรุณาเลือกวันเผยแพร่",
  );
  await expect(page.locator("#expiryDate_help")).toContainText(
    "กรุณาเลือกวันหมดอายุ",
  );
  await expect(page.locator("#periodType_help")).toContainText(
    "กรุณาเลือกช่วงเวลา",
  );
}

//createdocpub
async function adddata(page: Page) {
  //addข้อมูล
  const docName = randomText(20);
  docnamecheck = docName; // กำหนดค่าให้กับตัวแปร globalเพื่อใช้ในการค้นหาต่อในขั้นตอนแก้ไข
  await page.locator("#docName").fill(docName);

  await selectAntdOption(page, "#catalogCode", "รายงานสถานการณ์แรงงาน");

  const docDetail = randomText(60);
  await page.locator("#detail").fill(docDetail);

  await selectAntdOption(page, "#publishStatus", "เผยแพร่");

  await selectAntdDateByDay(page, "#pubDate", "12");
  await selectAntdDateByDay(page, "#expiryDate", "18");

  await selectAntdOption(page, "#periodType", "รายเดือน");

  const doctag = randomText(9);
  await page.locator("#tags").fill(doctag);

  const pdfPath = createRandomUploadFile("pdf");

  await page.locator('input[name="file"]').setInputFiles(pdfPath);

  await page.keyboard.press("Enter");
  const swal = page.locator(".swal2-popup");

  // รอ swal แสดง
  await expect(swal).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".swal2-title")).toContainText(
    "บันทึกข้อมูลเสร็จสิ้น",
  );

  // 2️⃣ รอ swal ปิด / disappear
  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/api/managedocument/Read/List") &&
        res.status() === 200,
      { timeout: 10000 },
    ),
    expect(swal).toHaveCount(0, { timeout: 10000 }),
  ]);

  const searchInput = page.locator(
    'input[placeholder="ค้นหา ชื่อเอกสาร,รายละเอียด"]',
  );

  await expect(searchInput).toBeVisible({ timeout: 10000 });
  await expect(searchInput).toBeEnabled({ timeout: 10000 });

  await searchInput.clear();
  await searchInput.fill(docnamecheck);

  // เลือกแถวแรกหลัง filter
  const firstRows = page
    .locator("table tbody tr.ant-table-row-level-0")
    .first();
  await expect(firstRows).toBeVisible({ timeout: 10000 });

  // เลือกปุ่มใน column 8
  const checkbtn = firstRows.locator('td:nth-child(8)  button[id*="edit"]');
  await checkbtn.click();

  await expect(page.locator("#docName")).toHaveValue(docName);

  await expect(page.locator("#catalogCode").locator("..")).toContainText(
    "รายงานสถานการณ์แรงงาน",
  );
  await expect(page.locator("#detail")).toHaveValue(docDetail);

  await expect(page.locator("#publishStatus").locator("..")).toContainText(
    "เผยแพร่",
  );

  await expect(page.locator("#pubDate")).toHaveValue(/-12$/);

  await expect(page.locator("#expiryDate")).toHaveValue(/-18$/);

  await expect(page.locator("#periodType").locator("..")).toContainText(
    "รายเดือน",
  );

  await expect(page.locator("#tags")).toHaveValue(doctag);
}

//updatedata
async function updatedata(page: Page) {
  const searchInput = page.locator(
    'input[placeholder="ค้นหา ชื่อเอกสาร,รายละเอียด"]',
  );

  await expect(searchInput).toBeVisible({ timeout: 10000 });
  await expect(searchInput).toBeEnabled({ timeout: 10000 });

  await searchInput.clear();
  await searchInput.fill(docnamecheck);

  const firstRows = page
    .locator("table tbody tr.ant-table-row-level-0")
    .first();

  await expect(firstRows).toBeVisible({ timeout: 10000 });
  // เลือกปุ่มใน column 8
  const checkbtn = firstRows.locator('td:nth-child(8)  button[id*="edit"]');
  await checkbtn.click();

  const docName = randomText(20);
  await page.locator("#docName").fill(docName);
  docnamecheck = docName; // อัพเดทชื่อตัวแปร global เพื่อใช้ในการค้นหาต่อในขั้นตอนลบ
  await selectAntdOption(page, "#catalogCode", "สถิติผลการดำเนินงาน");

  const docDetail = randomText(60);
  await page.locator("#detail").fill(docDetail);

  await selectAntdOption(page, "#publishStatus", "ฉบับร่าง");

  await selectAntdDateByDay(page, "#pubDate", "16");
  await selectAntdDateByDay(page, "#expiryDate", "29");

  await selectAntdOption(page, "#periodType", "รายไตรมาส");

  const doctag = randomText(9) + "," + randomText(9);
  await page.locator("#tags").fill(doctag);

  await page.locator("#submit").click();
  const swal = page.locator(".swal2-popup");
  await expect(swal).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".swal2-title")).toContainText(
    "แก้ไขข้อมูลเสร็จสิ้น",
  );
  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/api/managedocument/Read/List") &&
        res.status() === 200,
      { timeout: 10000 },
    ),
    expect(swal).toHaveCount(0, { timeout: 10000 }),
  ]);

  // รอ table reload เสร็จจริง
  await expect(
    page.locator("table tbody tr.ant-table-row-level-0").first(),
  ).toBeVisible({ timeout: 10000 });

  //check data is update?
  await searchInput.waitFor({ state: "visible", timeout: 10000 });
  // รอให้ visible ก่อน
  await expect(searchInput).toBeVisible({ timeout: 10000 });

  await searchInput.fill(docName);
  await page.waitForTimeout(1000); // รอให้ table update หลัง search
  // เลือกแถวแรกหลัง filter
  const firstRowscheck = page
    .locator("table tbody tr.ant-table-row-level-0")
    .first();
  await expect(firstRows).toBeVisible({ timeout: 10000 });
  // เลือกปุ่มใน column 8
  const checkbtnupdate = firstRowscheck.locator(
    'td:nth-child(8)  button[id*="edit"]',
  );
  checkbtnupdate.click();

  await expect(page.locator("#docName")).toHaveValue(docName);

  await expect(page.locator("#catalogCode").locator("..")).toContainText(
    "สถิติผลการดำเนินงาน",
  );
  await expect(page.locator("#detail")).toHaveValue(docDetail);

  // await expect(page.locator("#publishStatus")).toHaveValue("ฉบับร่าง");
  await expect(page.locator("#publishStatus").locator("..")).toContainText(
    "ฉบับร่าง",
  );

  await expect(page.locator("#pubDate")).toHaveValue(/-16$/);

  await expect(page.locator("#expiryDate")).toHaveValue(/-29$/);

  await expect(page.locator("#periodType").locator("..")).toContainText(
    "รายไตรมาส",
  );

  await expect(page.locator("#tags")).toHaveValue(doctag);
}

//deletedata
async function deletedata(page: Page) {
  const searchInput = page.locator(
    'input[placeholder="ค้นหา ชื่อเอกสาร,รายละเอียด"]',
  );

  await expect(searchInput).toBeVisible({ timeout: 10000 });
  await expect(searchInput).toBeEnabled({ timeout: 10000 });

  await searchInput.clear();
  await searchInput.fill(docnamecheck);

  const firstRows = page
    .locator("table tbody tr.ant-table-row-level-0")
    .first();

  await expect(firstRows).toBeVisible({ timeout: 10000 });
  // เลือกปุ่มใน column 8
  const checkbtn = firstRows.locator('td:nth-child(8)  button[id^="delete-"]');
  await checkbtn.click();

  // popup confirm ลบ
  await expect(page.locator(".swal2-popup")).toBeVisible({ timeout: 10000 });
  await page.locator(".swal2-confirm").click();

  // popup success
  await expect(page.locator(".swal2-popup")).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".swal2-title")).toContainText("ลบข้อมูลเสร็จสิ้น");

  // เช็คว่าชื่อที่ลบหายไปจาก table แล้ว
  await expect(page.locator(".ant-table-tbody")).not.toContainText(
    docnamecheck,
    { timeout: 10000 },
  );
}
