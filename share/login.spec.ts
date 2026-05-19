// tests/helpers/auth.ts
import { expect, Page } from "@playwright/test";

export async function login(page: Page) {
  await page.goto("/main");

  const loginButton = page.locator("#login-btn");
  await page.waitForSelector("#login-btn", { state: "visible" }); 
  if (await loginButton.isVisible()) {
    await loginButton.click();

    const ldapButton = page.locator('button[data-login-type="LDAP"]');
    const username = page.locator("#username");
    const password = page.locator("#password");

    await ldapButton.click();

    await username.fill("admin");
    await password.fill("password123");

    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/.*main/, {
      timeout: 15000,
    });
  } 
  else {
    console.log("ไม่มีปุ่ม");
  }
}

 
