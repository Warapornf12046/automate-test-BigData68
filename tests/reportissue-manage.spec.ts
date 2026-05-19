import { test, expect, Page } from "@playwright/test";
import { randomText } from "../share/randomText";
import { selectAntdDateByDay, selectAntdOption } from "../share/selectAntd";
import { createRandomUploadFile } from "../share/fileRandom";
import { login } from "../share/login.spec";
import { logout } from "../share/logout.spec";

test("reportissue-manage test", async ({ page }) => {
  await test.step("login", async () => {
    await login(page);
  });
  await page.locator('button[id="การจัดการ (Management)-7"]').click();
  await page.locator('a[id="จัดการปัญหาการใช้งาน-3"]').click();
  await expect(page).toHaveURL(/.*report-issue\/manage/);

  await test.step("เพิ่มข้อมูล", async () => {
    await adddata(page);
  });
  await test.step("แก้ไขข้อมูล", async () => {
    await updatedata(page);
  });
  await test.step("ลบข้อมูล", async () => {
    await deletedata(page);
  });

  await test.step("กรอกข้อมูลไม่ครบ", async () => {
    await checkdata(page);
  });
});

async function adddata(page: Page) {
  //file data
  const issueCategoryName = randomText(20);
  await page.locator('input[id="issueCategoryName"]').fill(issueCategoryName);

  await selectAntdOption(page, 'input[id="urgencyLevelCode"]', "กลาง");

  await page.locator("#submit").click();
  const swal = page.locator(".swal2-popup");
  await expect(swal).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".swal2-title")).toContainText(
    "บันทึกข้อมูลเสร็จสิ้น",
  );
  //check data
  const targetRow = page.locator(".ant-table-tbody tr.ant-table-row", {
    has: page.locator("td", { hasText: issueCategoryName }),
  });
  await expect(targetRow).toBeVisible();

  await targetRow.locator('button[id^="edit-"]').click();

  await expect(page.locator("#issueCategoryName")).toHaveValue(
    issueCategoryName,
  );

  await expect(page.locator("#urgencyLevelCode").locator("..")).toContainText(
    "กลาง",
  );
}

async function updatedata(page: Page) {
  //check data
  await page.locator('[id^="edit-"]').first().click();

  const issueCategoryName = randomText(20);
  await page.locator('input[id="issueCategoryName"]').fill(issueCategoryName);

  await selectAntdOption(page, 'input[id="urgencyLevelCode"]', "สูง");

  await page.locator("#submit").click();
  const swal = page.locator(".swal2-popup");
  await expect(swal).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".swal2-title")).toContainText(
    "แก้ไขข้อมูลเสร็จสิ้น",
  );

  //check data
  const targetRow = page.locator(".ant-table-tbody tr.ant-table-row", {
    has: page.locator("td", { hasText: issueCategoryName }),
  });
  await expect(targetRow).toBeVisible();

  await targetRow.locator('button[id^="edit-"]').click();

  await expect(page.locator("#issueCategoryName")).toHaveValue(
    issueCategoryName,
  );
  await expect(page.locator("#urgencyLevelCode").locator("..")).toContainText(
    "สูง",
  );
}

async function deletedata(page: Page) {
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

async function checkdata(page: Page) {
  await page.locator("#submit").click();
  await expect(page.locator("#issueCategoryName_help")).toContainText(
    "กรุณากรอกประเภทปัญหา",
  );
  await expect(page.locator("#urgencyLevelCode_help")).toContainText(
    "กรุณาเลือกระดับความสำคัญ",
  );
}
