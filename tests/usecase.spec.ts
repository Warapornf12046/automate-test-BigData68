import { test, expect, Page } from "@playwright/test";
import { randomText } from "../share/randomText";
import { selectAntdDateByDay, selectAntdOption } from "../share/selectAntd";
import { createRandomUploadFile } from "../share/fileRandom";
import { login } from "../share/login.spec";

test("usecase test", async ({ page }) => {
  await test.step("เพิ่มข้อมูล", async () => {
    await adddata(page);
  });

  await test.step("แก้ไขข้อมูล", async () => {
    await updatedata(page);
  });

  await test.step("ลบข้อมูล", async () => {
    await deletedata(page);
  });
});

//createdocpub
async function adddata(page: Page) {
  login(page);

  //ไปที่menu จัดการข้อมูลและ เข้าหน้าจัดการรายงาน
  await page.locator("button#จัดการข้อมูล-5").click();
  await page.locator("a#จัดการวิเคราะห์ข้อมูลตามกรณีศึกษา-4").click();
  await expect(page).toHaveURL(/.*manage\/usecase/);

  //addข้อมูล
  const usecasName = randomText(20);
  await page.locator("#usecaseName").fill(usecasName);

  await selectAntdOption(page, "#orgCode", "กรมพัฒนาฝีมือแรงงาน");

  const detail = randomText(60);

  await page.locator("#detail").fill(detail);

  await selectAntdOption(
    page,
    "#reportDataGroupCode",
    "โครงสร้างแรงงานและการจ้างงาน",
  );

  await selectAntdOption(page, "#entryType", "อุปทานแรงงาน");

  await selectAntdOption(page, "#status", "เผยแพร่");

  const analysisName = randomText(60);
  await page.locator("#analysisName").fill(analysisName);

  await page.keyboard.press("Enter");
  const swal = page.locator(".swal2-popup");
  await expect(swal).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".swal2-title")).toContainText(
    "บันทึกข้อมูลเสร็จสิ้น",
  );

  //check data is update?
  const targetRow = page
    .locator(".ant-table-tbody tr.ant-table-row", {
      has: page.locator("td", { hasText: usecasName }),
    })
    .first();
  await targetRow.locator('button[id^="edit-"]').click();

  await expect(page.locator("#usecaseName")).toHaveValue(usecasName);

  await expect(page.locator("#orgCode").locator("..")).toContainText(
    "กรมพัฒนาฝีมือแรงงาน",
  );

  await expect(page.locator("#detail")).toHaveValue(detail);

  await expect(
    page.locator("#reportDataGroupCode").locator(".."),
  ).toContainText("โครงสร้างแรงงานและการจ้างงาน");

  await expect(page.locator("#entryType").locator("..")).toContainText(
    "อุปทานแรงงาน",
  );

  await expect(page.locator("#status").locator("..")).toContainText("เผยแพร่");

  await expect(page.locator("#analysisName")).toHaveValue(analysisName);
}

//updatedata
async function updatedata(page: Page) {
  login(page);

  //ไปที่menu จัดการข้อมูลและ เข้าหน้าจัดการรายงาน
  await page.locator("button#จัดการข้อมูล-5").click();
  await page.locator("a#จัดการวิเคราะห์ข้อมูลตามกรณีศึกษา-4").click();
  await expect(page).toHaveURL(/.*manage\/usecase/);

  await page.locator('[id^="edit-"]').first().click();

  const usecasName = randomText(20);
  await page.locator("#usecaseName").fill(usecasName);

  await selectAntdOption(page, "#orgCode", "กรมการจัดหางาน");

  const detail = randomText(60);

  await page.locator("#detail").fill(detail);

  await selectAntdOption(
    page,
    "#reportDataGroupCode",
    "ผู้ประกันตนและประกันสังคม",
  );

  await selectAntdOption(page, "#entryType", "อุปสงค์แรงงาน");

  await selectAntdOption(page, "#status", "ฉบับร่าง");

  const analysisName = randomText(60);
  await page.locator("#analysisName").fill(analysisName);

  await page.locator("#submit").click();
  const swal = page.locator(".swal2-popup");
  await expect(swal).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".swal2-title")).toContainText(
    "แก้ไขข้อมูลเสร็จสิ้น",
  );

  //check data is update?
  const targetRow = page
    .locator(".ant-table-tbody tr.ant-table-row", {
      has: page.locator("td", { hasText: usecasName }),
    })
    .first();
  await targetRow.locator('button[id^="edit-"]').click();

  await expect(page.locator("#usecaseName")).toHaveValue(usecasName);

  await expect(page.locator("#orgCode").locator("..")).toContainText(
    "กรมการจัดหางาน",
  );

  await expect(page.locator("#detail")).toHaveValue(detail);

  await expect(
    page.locator("#reportDataGroupCode").locator(".."),
  ).toContainText("ผู้ประกันตนและประกันสังคม");

  await expect(page.locator("#entryType").locator("..")).toContainText(
    "อุปสงค์แรงงาน",
  );

  await expect(page.locator("#status").locator("..")).toContainText("ฉบับร่าง");

  await expect(page.locator("#analysisName")).toHaveValue(analysisName);
}

//deletedata
async function deletedata(page: Page) {
  login(page);

  //ไปที่menu จัดการข้อมูลและ เข้าหน้าจัดการรายงาน
  await page.locator("button#จัดการข้อมูล-5").click();
  await page.locator("a#จัดการวิเคราะห์ข้อมูลตามกรณีศึกษา-4").click();
  await expect(page).toHaveURL(/.*manage\/usecase/);

  const rows = page.locator(".ant-table-tbody tr:not(.ant-table-measure-row)");

  const firstRow = rows.first();
  await expect(firstRow).toBeVisible({ timeout: 10000 });

  // เก็บชื่อที่จะลบไว้เป็น string
  const deletedDocName = (
    await firstRow.locator("td").nth(1).innerText()
  ).trim();

  // กดลบจากแถวเดียวกัน
  await firstRow.locator('[id^="delete-"]').click();

  // popup confirm ลบ
  await expect(page.locator(".swal2-popup")).toBeVisible({ timeout: 10000 });
  await page.locator(".swal2-confirm").click();

  // popup success
  await expect(page.locator(".swal2-popup")).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".swal2-title")).toContainText("ลบข้อมูลเสร็จสิ้น");

  // เช็คว่าชื่อที่ลบหายไปจาก table แล้ว
  await expect(page.locator(".ant-table-tbody")).not.toContainText(
    deletedDocName,
    { timeout: 10000 },
  );
}
