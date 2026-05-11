import { expect, Page } from "@playwright/test";

export async function logout(page: Page) {
  //logout
  await page.locator("button#showmenudetail").click();

  await page.locator("button#logout").click();

  await expect(page).toHaveURL(/.*login/);
}
