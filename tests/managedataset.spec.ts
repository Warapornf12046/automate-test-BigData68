import { test, expect, Page } from "@playwright/test";
import { login } from "../share/login.spec";
import { logout } from "../share/logout.spec";
import { selectAntdOptionByText } from "./managereport.spec";


export async function mLogin(page: Page) {
  await login(page);

  await page.locator("button#จัดการข้อมูล-5").click();
  await page.locator("a#จัดการกลุ่มชุดข้อมูล-2").click();
  await expect(page).toHaveURL(/.*manage\/dataset/);
}



test.describe("manage dataset", () => {

   test.beforeEach(async ({ page }) => {
    await mLogin(page);
  });

   test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("Scenario Add Report Data Group", async ({ page }) => {

    test.setTimeout(180000);
    await selectAntdOptionByText(page, "#entityType", "เลือกชนิดกลุ่มข้อมูล");
    // await page.locator("#dataset-name").fill("ชุดข้อมูลทดสอบ");
    // await page.locator("#dataset-description").fill("รายละเอียดชุดข้อมูลทดสอบ");
    // await page.locator("#dataset-source").fill("แหล่งที่มาของชุดข้อมูลทดสอบ");
    // await page.locator("#dataset-update-frequency").fill("ความถี่ในการอัปเดตชุดข้อมูลทดสอบ");
    // await page.locator("#dataset-contact-info").fill("ข้อมูลติดต่อสำหรับชุดข้อมูลทดสอบ");
  });



});