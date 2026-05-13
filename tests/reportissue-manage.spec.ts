import { test, expect, Page } from "@playwright/test";
import { randomText } from "../share/randomText";
import { selectAntdDateByDay, selectAntdOption } from "../share/selectAntd";
import { createRandomUploadFile } from "../share/fileRandom";
import { login } from "../share/login.spec";
import { logout } from "../share/logout.spec";

test("document test", async ({ page }) => {
  await test.step("login", async () => {
    await login(page);
  });
  await test.step("เพิ่มข้อมูล", async () => {
    await adddata(page);
  });
});

async function adddata(page: Page) {
  await page.locator('button[id="การจัดการ (Management)-7"]').click();
  await page.locator('a[id="จัดการปัญหาการใช้งาน-3"]').click();
  await expect(page).toHaveURL(/.*report-issue\/manage/);

  //file data
  const issueCategoryName = randomText(20);
  await page.locator('input[id="issueCategoryName"]').fill(issueCategoryName);

  await selectAntdOption(page, 'input[id="urgencyLevelCode"]', "กลาง");

  await page.locator("#submit").click();
}
