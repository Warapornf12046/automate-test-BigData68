import { test, expect, Page } from "@playwright/test";

//เรียกฟังก์ชั้นย่อย
test("run test", async ({ page }) => {
  await login(page);
  await loginLDAP(page);
  await loginfail(page);
  await loginLDAPfail(page);
  await loginThaiId(page);
});

//ระบบ login/logout Bigdata68 ประชาชนทั่วไป/หน่วยงานภายนอก
async function login(page: Page) {
  await page.goto("/login");

  await expect(page).toHaveTitle(
    /โครงการพัฒนาฐานข้อมูลแรงงานอัจฉริยะและบูรณาการข้อมูลด้านแรงงาน/,
  );
  //ใส่ Username password
  await page.locator("#username").fill("jijee");
  await page.locator("#password").fill("Test1234#");

  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/.*main/);


  //logout
  await page.locator("button#showmenudetail").click();

  await page.locator("button#logout").click();
  await expect(page).toHaveURL(/.*login/);

}

//ทดสอบระบบ login/logout Big data68 หน่วยงานภายใน
async function loginLDAP(page: Page) {
  await page.goto("/login");

  await expect(page).toHaveTitle(
    /โครงการพัฒนาฐานข้อมูลแรงงานอัจฉริยะและบูรณาการข้อมูลด้านแรงงาน/,
  );

  //ใส่ Username password
  await page.locator("button#loginLDAP").click();
  await page.locator("#username").fill("admin");
  await page.locator("#password").fill("password123");

  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/.*main/);


  //logout
  await page.locator("button#showmenudetail").click();

  await page.locator("button#logout").click();

  await expect(page).toHaveURL(/.*login/);
}

//ระบบ login/logout Bigdata68 fail ประชาชนทั่วไป/หน่วยงานภายนอก
async function loginfail(page: Page) {
  await page.goto("http://localhost:3000/login");

  await expect(page).toHaveTitle(
    /โครงการพัฒนาฐานข้อมูลแรงงานอัจฉริยะและบูรณาการข้อมูลด้านแรงงาน/,
  );

  //ใส่ Username password
  await page.locator("#username").fill("EEEEE");
  await page.locator("#password").fill("EEEEE");

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/.*login/);
  await expect(page.locator("#alert")).toHaveText(
    /ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง/,
  );
}

//ทดสอบระบบ login/logout Bigdata68 fail หน่วยงานภายใน
async function loginLDAPfail(page: Page) {
  await page.goto("http://localhost:3000/login");

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(
    /โครงการพัฒนาฐานข้อมูลแรงงานอัจฉริยะและบูรณาการข้อมูลด้านแรงงาน/,
  );

  //ใส่ Username password
  await page.locator("button#loginLDAP").click();
  await page.locator("#username").fill("EEEEE");
  await page.locator("#password").fill("EEEEE");

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/.*login/);
  await expect(page.locator("#alert")).toHaveText(
    /ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง/,
  );
}

//ทดสอบระบบ login Big data68 ThaiId
async function loginThaiId(page: Page) {
  await page.goto("http://localhost:3000/login");
  await expect(page).toHaveTitle(
    /โครงการพัฒนาฐานข้อมูลแรงงานอัจฉริยะและบูรณาการข้อมูลด้านแรงงาน/,
  );

  //ใส่ Username password
  await page.locator("button#loginThaiID").click();

  await expect(page).toHaveURL(/.*register\/thaid/);

}
