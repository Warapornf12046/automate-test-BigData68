// tests/helpers/auth.ts
import { expect, Page } from "@playwright/test";

export async function login(page: Page) {
  await page.goto("/login", {
    waitUntil: "domcontentloaded",
  });

  const ldapButton = page.locator('button[data-login-type="LDAP"]');

  const result = await Promise.race([
    page
      .waitForURL(/.*\/main|.*\/manage\/document|.*\/login\/sso-finish.*/, {
        timeout: 10000,
      })
      .then(() => "alreadyLoggedIn" as const),

    ldapButton
      .waitFor({ state: "visible", timeout: 10000 })
      .then(() => "loginPageReady" as const),
  ]).catch(() => "notFound" as const);

  if (result === "alreadyLoggedIn") {
    if (page.url().includes("/login/sso-finish")) {
      await page.waitForURL(/.*\/main|.*\/manage\/document/, {
        timeout: 15000,
      });
    }

    return;
  }

  if (result === "notFound") {
    throw new Error(
      `ไม่พบปุ่ม LDAP และยังไม่ login, current URL: ${page.url()}`,
    );
  }

  await ldapButton.click();

  await page.locator("#username").fill("admin");
  await page.locator("#password").fill("password123");

  await page.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(/.*main/, {
    timeout: 15000,
  });
}
