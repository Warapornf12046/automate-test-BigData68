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
  } else {
    console.log("ไม่มีปุ่ม");
  }
}

// export async function logout(page: Page) {
//   await page.locator("button#showmenudetail").click();
//   await page.locator("button#logout").click();
//   await expect(page).toHaveURL(/.*login/);
// }
// export async function logout(page: Page) {
//   // ถ้ามี SweetAlert ค้าง ให้ปิดก่อน
//   const swalConfirm = page.locator(".swal2-confirm").last();

// <<<<<<< HEAD
//   if (await swalConfirm.isVisible().catch(() => false)) {
//     await swalConfirm.click().catch(() => {});
//     await page.waitForTimeout(1000);
//   }
// =======
//   if (await swalConfirm.isVisible().catch(() => false)) {
//     await swalConfirm.click().catch(() => { });
//     await page.waitForTimeout(1000);
//   }
// >>>>>>> b1dffa5e29af9a20d0d43a5abdb491b35eddc582

//   await page.locator("button#showmenudetail").click();
//   await page.locator("button#logout").click();

// <<<<<<< HEAD
//   await page.waitForLoadState("domcontentloaded").catch(() => {});
// =======
// //   await page.waitForLoadState("domcontentloaded").catch(() => { });
// >>>>>>> b1dffa5e29af9a20d0d43a5abdb491b35eddc582

//   await expect(page).toHaveURL(/.*login/, {
//     timeout: 30000,
//   });
// }
