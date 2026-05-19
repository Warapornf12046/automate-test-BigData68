import { test, expect, Page } from "@playwright/test";
import { login } from "../share/login.spec";
import { logout } from "../share/logout.spec";
import { randomText } from "../share/randomText";

const ENTITY_TYPE_OPTIONS = [
  { value: "reportDataGroup", label: "กลุ่มข้อมูลรายงาน" },
  { value: "reportGroup", label: "กลุ่มรายงาน" },
  { value: "reportDataset", label: "ชุดข้อมูลรายงาน" },
] as const;


export async function mLogin(page: Page) {
  await login(page);

  await page.locator("button#จัดการข้อมูล-5").click();
  await page.locator("a#จัดการกลุ่มชุดข้อมูล-2").click();
  await expect(page).toHaveURL(/.*manage\/dataset/);
}

export async function selectAntdOptionByText(
  page: Page,
  selectSelector: string,
  optionText: string,
  delayMs = 300,
) {
  await page.locator(selectSelector).click(); // คลิกที่ Select
  await page.waitForTimeout(1000); // หน่วงเวลาเล็กน้อยให้ dropdown เปิดขึ้น

  const dropdown = page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden)");
  await expect(dropdown).toBeVisible({ timeout: 10000 }); // รอให้ dropdown เปิดขึ้น

  const option = dropdown.locator(".ant-select-item-option").filter({
    hasText: optionText,
  }).first();

  await expect(option).toBeVisible({ timeout: 10000 });
  await option.click();

  await page.waitForTimeout(delayMs); // หน่วงหลังเลือกตัวเลือก
}
export async function delay(page: Page, ms = 0) {
  await page.waitForTimeout(ms);
}

export async function selectAntdOptionBySearch(
  page: Page,
  selectSelector: string,
  searchText: string,
  optionText: string,
) {
  await closeAntdDropdown(page);

  const select = page.locator(selectSelector);

  await expect(select).toBeVisible({ timeout: 10000 });
  await select.scrollIntoViewIfNeeded();

  const selectorBox = select.locator(".ant-select-selector");

  if (await selectorBox.isVisible().catch(() => false)) {
    await selectorBox.click({ force: true });
  } else {
    await select.click({ force: true });
  }

  await page.waitForTimeout(200);

  const searchInput = select.locator("input.ant-select-selection-search-input");

  if (await searchInput.isVisible().catch(() => false)) {
    await searchInput.fill("");
    await searchInput.pressSequentially(searchText, { delay: 20 });
  } else {
    await page.keyboard.press("Control+A");
    await page.keyboard.type(searchText, { delay: 20 });
  }

  const dropdown = page
    .locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden)")
    .last();

  await expect(dropdown).toBeVisible({ timeout: 10000 });

  const option = dropdown
    .locator(".ant-select-item-option")
    .filter({ hasText: optionText })
    .first();

  await expect(option).toBeVisible({ timeout: 10000 });

  await option.scrollIntoViewIfNeeded();
  await option.click({ force: true });

  await closeAntdDropdown(page);
}

export async function closeAntdDropdown(page: Page) {
  await page.keyboard.press("Escape");
  await page.mouse.click(5, 5);
  await page.waitForTimeout(100);
}

async function submitCustomDataset(page: Page, entityLabel: string) {
  await selectAntdOptionBySearch(page, ".ant-select:has(#entityType)", entityLabel, entityLabel);
  await selectAntdOptionBySearch(page, ".ant-select:has(#selectedName)", "อื่นๆ", "อื่นๆ");

  // รอให้ custom name input ปรากฏขึ้น
  const customNameInput = page.locator("#customName");
  await expect(customNameInput).toBeVisible({ timeout: 10000 });

  // หน่วงเวลาให้มั่นใจว่า input พร้อมใช้งาน
  await page.waitForTimeout(1000);

  await customNameInput.fill(`${randomText(8)}`);

  await page.getByRole("button", { name: "เพิ่มข้อมูล" }).click();

  await expect(page.getByText("บันทึกข้อมูลเสร็จสิ้น")).toBeVisible({
    timeout: 30000,
  });
}



async function updateCustomName(page: Page, customName: string) {
  const customNameInput = page.locator("#editName");

  await expect(customNameInput).toBeVisible({ timeout: 10000 });

  await customNameInput.fill(customName); // กรอกข้อมูลใหม่ที่ต้องการ
}

export async function searchReportAndClickEdit(page: Page, name: string) {
  const searchInput = page.locator("input[placeholder='ค้นหาชื่อกลุ่มข้อมูล']");

  await expect(searchInput).toBeVisible({ timeout: 10000 });

  await searchInput.click();
  await searchInput.fill("");

  await searchInput.pressSequentially(name, {
    delay: 120, // เพิ่มความเร็วการพิมพ์
  });

  await page.keyboard.press("Enter");

  // ค้นหาชื่อที่ตรงกับรายชื่อที่ค้นหาในตาราง
  const targetRow = page.locator("tbody tr").filter({
    hasText: name,
  }).first();

  await expect(targetRow).toBeVisible({
    timeout: 15000,
  });

  // คลิกปุ่ม Edit
  const editButton = targetRow.locator("#edit").first();

  await expect(editButton).toBeVisible({
    timeout: 10000,
  });

  await editButton.click();
}



test.describe("manage dataset", () => {

  test.beforeEach(async ({ page }) => {
    await mLogin(page);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });
  //testที่ละอัน

  test("เพิ่มกลุ่มชุดข้อมูลโดยเลือกชนิดกลุ่มข้อมูล - กลุ่มข้อมูลรายงาน", async ({ page }) => {
    test.setTimeout(360000);
    await submitCustomDataset(page, ENTITY_TYPE_OPTIONS[0].label);
  });

  test("เลือกชนิดกลุ่มข้อมูล - กลุ่มรายงาน", async ({ page }) => {
    test.setTimeout(360000);
    await submitCustomDataset(page, ENTITY_TYPE_OPTIONS[1].label);
  });

  test("เลือกชนิดกลุ่มข้อมูล - ชุดข้อมูลรายงาน", async ({ page }) => {
    test.setTimeout(360000);
    await submitCustomDataset(page, ENTITY_TYPE_OPTIONS[2].label);
  });



  test("Scenario Update Report Data Group", async ({ page }) => {
    test.setTimeout(400000);

    const reportNamePrefix = "test222"; // กำหนดชื่อกลุ่มข้อมูลรายงานที่ต้องการค้นหา
    const updatedReportName = `${reportNamePrefix}-${randomText(8)}`; // สร้างชื่อใหม่

    // 1. ค้นหาชื่อจากฟิลด์ค้นหาชื่อกลุ่มข้อมูล
    await searchReportAndClickEdit(page, reportNamePrefix);

    // 2. แก้ไขข้อมูลในช่อง customName
    await updateCustomName(page, updatedReportName);

    // 3. คลิกปุ่ม "บันทึกการแก้ไข"
    await page.getByRole("button", { name: "บันทึกการแก้ไข" }).click();

    // 4. รอข้อความ "บันทึกข้อมูลเสร็จสิ้น"
    await expect(page.getByText("บันทึกข้อมูลเสร็จสิ้น")).toBeVisible({
      timeout: 30000,
    });

    console.log(`ข้อมูลได้รับการอัปเดตเรียบร้อยแล้ว: ${updatedReportName}`);
  });


});