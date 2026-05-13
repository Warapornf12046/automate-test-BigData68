// tests/helpers/auth.ts
import { expect, Page } from "@playwright/test";

export async function login(page: Page) {
  await page.goto("/login", {
    waitUntil: "domcontentloaded",
  });

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
