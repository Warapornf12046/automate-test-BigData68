import { test, expect, Page } from "@playwright/test";

export async function save(page: Page) {
  await page.getByRole("button", { name: "บันทึก" }).click();

  await expect(page.getByText("บันทึกข้อมูลเสร็จสิ้น")).toBeVisible({
    timeout: 30000,
  });
}