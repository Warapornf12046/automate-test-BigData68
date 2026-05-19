import { test, expect, Page } from "@playwright/test";
import {
  randomNumberText,
  randomText,
  randomThaiText,
} from "../share/randomText";
import { selectAntdDateByDay, selectAntdOption } from "../share/selectAntd";
import { createRandomUploadFile } from "../share/fileRandom";
import { login } from "../share/login.spec";
import { logout } from "../share/logout.spec";

test("profile test", async ({ page, request }) => {
  await test.step("login", async () => {
    await login(page);
  });

  await page.locator('button[id="showmenudetail"]').click();
  (await page.locator('span:has-text("จัดการบัญชี")').click(),
    await expect(page).toHaveURL(/.*guides\/account/));

  await test.step("เช็คข้อมูล", async () => {
    await checkdata(page, request);
  });

  await test.step("แก้ไขข้อมูล", async () => {
    await editdata(page, request);
  });
});

async function checkdata(page: Page, request: any) {
  const authData = await page.evaluate(() => {
    const raw = localStorage.getItem("currentUser");
    return raw ? JSON.parse(raw) : null;
  });
  const token = await page.evaluate(() => localStorage.getItem("token"));

  const userId = authData.userId ? authData.userId : 1;
  const response = await request.get(`api/Register/detail/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const apiData = await response.json();
  expect(apiData.status).toBe(1);
  const data = apiData.dataenum;

  await expect(page.locator("#firstName")).toHaveValue(data.firstName);
  await expect(page.locator("#lastName")).toHaveValue(data.lastName);
  await expect(page.locator("#email")).toHaveValue(data.email);
  await expect(page.locator("#username")).toHaveValue(data.userName);
  await expect(page.locator("#orgName")).toHaveValue(data.orgName);
  await expect(page.locator("#houseNo")).toHaveValue(data.houseNo);
  await expect(page.locator("#moo")).toHaveValue(data.moo);
  await expect(page.locator("#soi")).toHaveValue(data.soi);
  await expect(page.locator("#road")).toHaveValue(data.road);
  await expect(page.locator("#subdist").locator("..")).toContainText(
    data.subdist,
  );

  await expect(page.locator("#distrist").locator("..")).toContainText(
    data.distrist,
  );
  await expect(page.locator("#province").locator("..")).toContainText(
    data.province,
  );
  await expect(page.locator("#zip")).toHaveValue(data.zip);

  await page.locator("#firstName").fill("");
  await page.locator("#lastName").fill("");
  await page.locator("#houseNo").fill("");
  await page.locator("#moo").fill("");
  await page.locator("#soi").fill("");
  await page.locator("#road").fill("");
  await selectAntdOption(page, "#province", "สมุทรปราการ");
  await page.locator("button:has-text('แก้ไขข้อมูล')").click();
  await expect(page.locator("#firstName_help")).toHaveText("กรุณากรอกชื่อ");
  await expect(page.locator("#lastName_help")).toHaveText("กรุณากรอกนามสกุล");
  await expect(page.locator("#houseNo_help")).toHaveText("กรุณากรอกบ้านเลขที่");
  await expect(page.locator("#moo_help")).toHaveText("กรุณากรอกหมู่");
  await expect(page.locator("#soi_help")).toHaveText("กรุณากรอกซอย");
  await expect(page.locator("#road_help")).toHaveText("กรุณากรอกถนน");
  await expect(page.locator("#subdist_help")).toHaveText(
    "กรุณาเลือกตำบล / แขวง",
  );
  await expect(page.locator("#distrist_help")).toHaveText(
    "กรุณาเลือกอำเภอ / เขต",
  );
}

async function editdata(page: Page, request: any) {
  const firstName = randomThaiText(10);
  const lastName = randomThaiText(10);
  const houseNo = randomNumberText(5);
  const moo = randomText(5);
  const soi = randomText(5);
  const road = randomText(5);

  await page.locator("#firstName").fill(firstName);
  await page.locator("#lastName").fill(lastName);
  await page.locator("#houseNo").fill(houseNo);
  await page.locator("#moo").fill(moo);
  await page.locator("#soi").fill(soi);
  await page.locator("#road").fill(road);
  await selectAntdOption(page, "#province", "สมุทรปราการ");
  await selectAntdOption(page, "#distrist", "เมืองสมุทรปราการ");

  await selectAntdOption(page, "#subdist", "บางเมืองใหม่");
  await page.locator("#submit-btn").click();

  const swal = page.locator(".swal2-popup");
  await expect(swal).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".swal2-title")).toContainText(
    "แก้ไขข้อมูลเสร็จสิ้น",
  );

  await expect(page.locator("#firstName")).toHaveValue(firstName);
  await expect(page.locator("#lastName")).toHaveValue(lastName);
  await expect(page.locator("#houseNo")).toHaveValue(houseNo);
  await expect(page.locator("#moo")).toHaveValue(moo);
  await expect(page.locator("#soi")).toHaveValue(soi);
  await expect(page.locator("#road")).toHaveValue(road);
  await expect(page.locator("#province").locator("..")).toContainText(
    "สมุทรปราการ",
  );
  await expect(page.locator("#distrist").locator("..")).toContainText(
    "เมืองสมุทรปราการ",
  );

  await expect(page.locator("#subdist").locator("..")).toContainText(
    "บางเมืองใหม่",
  );
}
