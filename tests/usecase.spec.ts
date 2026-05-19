import { test, expect, Page } from "@playwright/test";
import { randomText } from "../share/randomText";
import { selectAntdDateByDay, selectAntdOption } from "../share/selectAntd";
import { createRandomUploadFile } from "../share/fileRandom";
import { login } from "../share/login.spec";
let usecaseName: string;

test("usecase test", async ({ page }) => {
  await test.step("login", async () => {
    await login(page);
  });
  await page.locator("button#จัดการข้อมูล-5").click();
  await page.locator("a#จัดการวิเคราะห์ข้อมูลตามกรณีศึกษา-4").click();
  await expect(page).toHaveURL(/.*manage\/usecase/);
  await test.step("เพิ่มข้อมูล", async () => {
    await adddata(page);
  });

  await test.step("แก้ไขข้อมูล", async () => {
    await updatedata(page);
  });

  await test.step("ลบข้อมูล", async () => {
    await deletedata(page);
  });
});

//createdocpub
async function adddata(page: Page) {
  //addข้อมูล
  const usecasName = randomText(20);
  usecaseName = usecasName;
  await page.locator("#usecaseName").fill(usecasName);

  await selectAntdOption(page, "#orgCode", "กรมสวัสดิการและคุ้มครองแรงงาน");

  const detail = randomText(60);

  await page.locator("#detail").fill(detail);

  await selectAntdOption(
    page,
    "#reportDataGroupCode",
    "โครงสร้างแรงงานและการจ้างงาน",
  );

  await selectAntdOption(page, "#entryType", "อุปทานแรงงาน");

  await selectAntdOption(page, "#status", "เผยแพร่");

  const analysisName = randomText(60);
  await page.locator("#analysisName").fill(analysisName);

  await page.keyboard.press("Enter");
  const swal = page.locator(".swal2-popup");
  await expect(swal).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".swal2-title")).toContainText(
    "บันทึกข้อมูลเสร็จสิ้น",
  );
  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/api/Opendata/Opendata") && res.status() === 200,
      { timeout: 10000 },
    ),
    expect(swal).toHaveCount(0, { timeout: 10000 }),
  ]);

  const searchInput = page.locator(
    'input[placeholder="ค้นหา ชื่อกรณีศึกษา,นักวิเคราะห์"]',
  );

  await expect(searchInput).toBeVisible({ timeout: 10000 });
  await expect(searchInput).toBeEnabled({ timeout: 10000 });

  await searchInput.clear();
  await searchInput.fill(usecaseName);

  //check data is update?
  const targetRow = page
    .locator(".ant-table-tbody tr.ant-table-row", {
      has: page.locator("td", { hasText: usecaseName }),
    })
    .first();
  await targetRow.locator('button[id^="edit-"]').click();

  await expect(page.locator("#usecaseName")).toHaveValue(usecaseName);

  await expect(page.locator("#orgCode").locator("..")).toContainText(
    "กรมสวัสดิการและคุ้มครองแรงงาน",
  );

  await expect(page.locator("#detail")).toHaveValue(detail);

  await expect(
    page.locator("#reportDataGroupCode").locator(".."),
  ).toContainText("โครงสร้างแรงงานและการจ้างงาน");

  await expect(page.locator("#entryType").locator("..")).toContainText(
    "อุปทานแรงงาน",
  );

  await expect(page.locator("#status").locator("..")).toContainText("เผยแพร่");

  await expect(page.locator("#analysisName")).toHaveValue(analysisName);
}

//updatedata
async function updatedata(page: Page) {
  const searchInput = page.locator(
    'input[placeholder="ค้นหา ชื่อกรณีศึกษา,นักวิเคราะห์"]',
  );

  await expect(searchInput).toBeVisible({ timeout: 10000 });
  await expect(searchInput).toBeEnabled({ timeout: 10000 });

  await searchInput.clear();
  await searchInput.fill(usecaseName);

  const firstRows = page
    .locator("table tbody tr.ant-table-row-level-0")
    .first();

  await expect(firstRows).toBeVisible({ timeout: 10000 });

  const checkbtn = firstRows.locator('td:nth-child(7)  button[id*="edit"]');
  await checkbtn.click();

  const usecasName = randomText(20);
  await page.locator("#usecaseName").fill(usecasName);
  usecaseName = usecasName; // อัพเดทชื่อตัวแปร global เพื่อใช้ในการค้นหาต่อในขั้นตอนลบ
  await selectAntdOption(page, "#orgCode", "ชื่อหน่วยงานb62afea9");

  const detail = randomText(60);

  await page.locator("#detail").fill(detail);

  await selectAntdOption(
    page,
    "#reportDataGroupCode",
    "ผู้ประกันตนและประกันสังคม",
  );

  await selectAntdOption(page, "#entryType", "อุปสงค์แรงงาน");

  await selectAntdOption(page, "#status", "ฉบับร่าง");

  const analysisName = randomText(60);
  await page.locator("#analysisName").fill(analysisName);

  await page.locator("#submit").click();
  const swal = page.locator(".swal2-popup");
  await expect(swal).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".swal2-title")).toContainText(
    "แก้ไขข้อมูลเสร็จสิ้น",
  );

  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/api/Opendata/Opendata") && res.status() === 200,
      { timeout: 10000 },
    ),
    expect(swal).toHaveCount(0, { timeout: 10000 }),
  ]);

  //check data is update?

  await expect(
    page.locator("table tbody tr.ant-table-row-level-0").first(),
  ).toBeVisible({ timeout: 10000 });

  const searchInputcheck = page.locator(
    'input[placeholder="ค้นหา ชื่อกรณีศึกษา,นักวิเคราะห์"]',
  );

  await expect(searchInputcheck).toBeVisible({ timeout: 10000 });
  await expect(searchInputcheck).toBeEnabled({ timeout: 10000 });

  await searchInputcheck.clear();
  await searchInputcheck.fill(usecaseName);

  const firstRowscheck = page
    .locator("table tbody tr.ant-table-row-level-0")
    .first();

  await expect(firstRowscheck).toBeVisible({ timeout: 10000 });

  const checkbtncheck = firstRowscheck.locator(
    'td:nth-child(7)  button[id*="edit"]',
  );
  await checkbtncheck.click();

  await expect(page.locator("#usecaseName")).toHaveValue(usecasName);

  await expect(page.locator("#orgCode").locator("..")).toContainText(
    "ชื่อหน่วยงานb62afea9",
  );

  await expect(page.locator("#detail")).toHaveValue(detail);

  await expect(
    page.locator("#reportDataGroupCode").locator(".."),
  ).toContainText("ผู้ประกันตนและประกันสังคม");

  await expect(page.locator("#entryType").locator("..")).toContainText(
    "อุปสงค์แรงงาน",
  );

  await expect(page.locator("#status").locator("..")).toContainText("ฉบับร่าง");

  await expect(page.locator("#analysisName")).toHaveValue(analysisName);
}

//deletedata
async function deletedata(page: Page) {
  const searchInput = page.locator(
    'input[placeholder="ค้นหา ชื่อกรณีศึกษา,นักวิเคราะห์"]',
  );

  await expect(searchInput).toBeVisible({ timeout: 10000 });
  await expect(searchInput).toBeEnabled({ timeout: 10000 });

  await searchInput.clear();
  await searchInput.fill(usecaseName);

  const firstRows = page
    .locator("table tbody tr.ant-table-row-level-0")
    .first();

  await expect(firstRows).toBeVisible({ timeout: 10000 });
  // เลือกปุ่มใน column 7
  const checkbtn = firstRows.locator('td:nth-child(7)  button[id*="delete"]');
  await checkbtn.click();

  // popup confirm ลบ
  await expect(page.locator(".swal2-popup")).toBeVisible({ timeout: 10000 });
  await page.locator(".swal2-confirm").click();

  // popup success
  await expect(page.locator(".swal2-popup")).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".swal2-title")).toContainText("ลบข้อมูลเสร็จสิ้น");

  // เช็คว่าชื่อที่ลบหายไปจาก table แล้ว
  await expect(page.locator(".ant-table-tbody")).not.toContainText(
    usecaseName,
    { timeout: 10000 },
  );
}
