import { test, expect, Page } from "@playwright/test";
import { randomText } from "../share/randomText";
import { selectAntdDateByDay, selectAntdOption } from "../share/selectAntd";
import { createRandomUploadFile } from "../share/fileRandom";
import { login } from "../share/login.spec";

test("document test", async ({ page }) => {
  await adddata(page);
  await updatedata(page);
  await deletedata(page);
});

//createdocpub
async function adddata(page: Page) {
  await login(page);

  //ไปที่menu จัดการข้อมูลและ เข้าหน้าจัดการรายงาน
  await page.locator("button#จัดการข้อมูล-5").click();
  await page.locator("a#จัดการเอกสารเผยแพร่-1").click();
  await expect(page).toHaveURL(/.*manage\/document/);

  //addข้อมูล
  const docName = randomText(20);
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
  await expect(swal).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".swal2-title")).toContainText(
    "บันทึกข้อมูลเสร็จสิ้น",
  );
  //chack data is have value
  await page.locator('[id^="edit-"]').first().click();
  await expect(page.locator("#docName")).toHaveValue(docName);

  await expect(page.locator("#catalogCode").locator("..")).toContainText(
    "รายงานสถานการณ์แรงงาน",
  );
  await expect(page.locator("#detail")).toHaveValue(docDetail);

  await expect(page.locator("#publishStatus").locator("..")).toContainText(
    "เผยแพร่",
  );

  await expect(page.locator("#pubDate")).toHaveValue(/^12/);

  await expect(page.locator("#expiryDate")).toHaveValue(/^18/);

  await expect(page.locator("#periodType").locator("..")).toContainText(
    "รายเดือน",
  );

  await expect(page.locator("#tags")).toHaveValue(doctag);
}

//updatedata
async function updatedata(page: Page) {
  await page.goto("/login");
  login(page);

  //ไปที่menu จัดการข้อมูลและ เข้าหน้าจัดการรายงาน
  await page.locator("button#จัดการข้อมูล-5").click();
  await page.locator("a#จัดการเอกสารเผยแพร่-1").click();
  await expect(page).toHaveURL(/.*manage\/document/);

  //updata data
  await page.locator('[id^="edit-"]').first().click();

  const docName = randomText(20);
  await page.locator("#docName").fill(docName);

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

  //check data is update?
  await page.locator('[id^="edit-"]').first().click();
  await expect(page.locator("#docName")).toHaveValue(docName);

  await expect(page.locator("#catalogCode").locator("..")).toContainText(
    "สถิติผลการดำเนินงาน",
  );
  await expect(page.locator("#detail")).toHaveValue(docDetail);

  // await expect(page.locator("#publishStatus")).toHaveValue("ฉบับร่าง");
  await expect(page.locator("#publishStatus").locator("..")).toContainText(
    "ฉบับร่าง",
  );

  await expect(page.locator("#pubDate")).toHaveValue(/^16/);

  await expect(page.locator("#expiryDate")).toHaveValue(/^29/);

  await expect(page.locator("#periodType").locator("..")).toContainText(
    "รายไตรมาส",
  );

  await expect(page.locator("#tags")).toHaveValue(doctag);
}

//deletedata
async function deletedata(page: Page) {
  login(page);

  //ไปที่menu จัดการข้อมูลและ เข้าหน้าจัดการรายงาน
  await page.locator("button#จัดการข้อมูล-5").click();
  await page.locator("a#จัดการเอกสารเผยแพร่-1").click();
  await expect(page).toHaveURL(/.*manage\/document/);

  // เลือกแถวข้อมูลจริงแถวแรก ไม่เอา ant-table-measure-row
  const firstRow = page
    .locator(".ant-table-tbody tr:not(.ant-table-measure-row)")
    .first();

  await expect(firstRow).toBeVisible({ timeout: 10000 });

  // เก็บชื่อเอกสารจาก column ชื่อเอกสาร
  // nth(0) = ลำดับ, nth(1) = ชื่อเอกสาร
  const deletedDocName = (
    await firstRow.locator("td").nth(1).innerText()
  ).trim();

  console.log("deletedDocName:", deletedDocName);

  // กดปุ่มลบของแถวแรก ไม่ใช้ page.locator(...).first()
  // เพื่อให้มั่นใจว่าลบแถวเดียวกับชื่อที่เก็บไว้
  await firstRow.locator('[id^="delete-"]').click();

  // กดยืนยันลบ
  await page.locator(".swal2-confirm").click();

  // รอ popup ลบสำเร็จ
  const swal = page.locator(".swal2-popup");
  await expect(swal).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".swal2-title")).toContainText("ลบข้อมูลเสร็จสิ้น");

  // กด OK popup สำเร็จ ถ้าระบบมีปุ่ม confirm อีกครั้ง
  await page.locator(".swal2-confirm").click();

  // เช็คว่าชื่อที่ลบหายไปจากตารางแล้ว
  await expect(page.locator(".ant-table-tbody")).not.toContainText(
    deletedDocName,
    {
      timeout: 10000,
    },
  );
}
