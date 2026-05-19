import { test, expect, Page } from "@playwright/test";
import { randomText } from "../share/randomText";
import { selectAntdDateByDay, selectAntdOption } from "../share/selectAntd";
import { createRandomUploadFile } from "../share/fileRandom";
import { login } from "../share/login.spec";
import { logout } from "../share/logout.spec";

test("data-request test", async ({ page, request }) => {
  await test.step("login", async () => {
    await login(page);
  });
  await page.locator('button[id="บริหารส่วนกลาง-4"]').click();
  await page.locator('a[id="แบบฟอร์มร้องขอชุดข้อมูล-1"]').click();
  await expect(page).toHaveURL(/.*data-request/);

  await test.step("เช็คข้อมูลไม่ครบ", async () => {
    await checkdata(page, request);
  });

  await test.step("เพิ่มข้อมูล และเช็ค", async () => {
    await adddata(page, request);
  });
});

async function adddata(page: Page, request: any) {
  const authData = await page.evaluate(() => {
    const raw = localStorage.getItem("currentUser");
    return raw ? JSON.parse(raw) : null;
  });

  const userId = authData.userId ? authData.userId : 1;

  const response = await request.get(
    `api/DataSetRequest/user-profile?usersId=${userId}`,
  );

  const apiData = await response.json();
  expect(apiData.status).toBe(1);
  const data = apiData.dataenum;

  await expect(page.locator("#organizationName")).toHaveValue(
    data.organizationName,
  );
  await expect(page.locator("#email")).toHaveValue(data.email);
  await expect(page.locator("#firstName")).toHaveValue(data.firstName);
  await expect(page.locator("#lastName")).toHaveValue(data.lastName);
  await expect(page.locator("#phone")).toHaveValue(data.phone);

  const datasetName = randomText(20);
  await page.locator("#datasetName").fill(datasetName);

  const objective = randomText(20);
  await page.locator("#objective").fill(objective);
  // const createResponsePromise = page.waitForResponse(
  //   (response) =>
  //     response.url().includes(`api/DataSetRequest/create?usersId=${userId}`) &&
  //     response.request().method() === "POST",
  // );
  await page.locator('button:has-text("ยืนยัน")').click();

  const swal = page.locator(".swal2-popup");
  await expect(swal).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".swal2-title")).toContainText(
    "บันทึกข้อมูลเสร็จสิ้น",
  );

  // const createResponse = await createResponsePromise;
  // const createResult = await createResponse.json();

  // expect(createResult.status).toBeTruthy();
  await page.locator('button[id="การจัดการ (Management)-7"]').click();
  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/api/ManageRequesData/List") &&
        res.status() === 200,
      { timeout: 10000 },
    ),
    await page.locator('a[id="จัดการร้องขอชุดข้อมูล-2"]').click(),
  ]);
  await expect(page).toHaveURL(/.*opendata\/admin/);
  await page
    .locator(
      "input[placeholder='ค้นหา ชื่อ,วัตถุประสงค์,เบอร์โทรศัพท์,อีเมล,ชื่อชุดข้อมูล']",
    )
    .fill(datasetName);
  await expect(page.locator("table")).toContainText(datasetName);
}

async function checkdata(page: Page, request: any) {
  await page.locator('button:has-text("ยืนยัน")').click();
  expect(page.locator("#datasetName_help")).toContainText(
    "กรุณากรอกชื่อชุดข้อมูล",
  );
  expect(page.locator("#objective_help")).toContainText(
    "กรุณากรอกวัตถุประสงค์",
  );
}
