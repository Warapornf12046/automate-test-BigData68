import { test, expect, Page } from "@playwright/test";
import { login } from "../share/login.spec";
import { logout } from "../share/logout.spec";
import {save} from "../share/save";
export async function mLogin(page: Page) {
  await login(page);
  

  await page.locator('button[id="การจัดการ (Management)-7"]').click();
  await page.locator("a#จัดการสมาชิกผู้ลงทะเบียน-0").click();
  await expect(page).toHaveURL(/.*manage\/registered-members/);
}

//ค้นหาชื่อสมาชิกที่ต้องการแก้ไขและคลิกปุ่มแก้ไข
export async function searchReportAndClickEdit(page: Page, name: string) {
  const searchInput = page.locator("input[placeholder='ค้นหาชื่อและ Email']");
  
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

export async function searchReportAndClickView(page: Page, name: string) {
  const searchInput = page.locator("input[placeholder='ค้นหาชื่อและ Email']");
  
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

  // คลิกปุ่ม View
  const viewButton = targetRow.locator("#view").first();

  await expect(viewButton).toBeVisible({
    timeout: 10000,
  });

  await viewButton.click();
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

 

test.describe("Register Member", () => {
  test.beforeEach(async ({ page }) => {
    await mLogin(page);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("แก้ไขข้อมูลสมาชิกผู้ลงทะเบียน", async ({ page }) => {
    // คลิกปุ่มแก้ไขของสมาชิกคนแรกในตาราง
   test.setTimeout(360000); // เพิ่มเวลา timeout สำหรับการทดสอบนี้
    const memberName = "tetxc wer";
    await searchReportAndClickEdit(page, memberName);

    //
    await page.locator("#roleId").click();
    await selectAntdOptionBySearch(page, "#roleId", "ประชาชน", "ประชาชนทั่วไป");

    await save(page);


  });

test("ตรวจสอบสิทธิ์การเข้าถึง", async ({ page }) => {
    test.setTimeout(360000); // เพิ่มเวลา timeout สำหรับการทดสอบนี้
    const memberName = "tetxc wer";

    const searchInput = page.locator("input[placeholder='ค้นหาชื่อและ Email']");
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill("");
    await searchInput.pressSequentially(memberName, { delay: 120 });
    await page.keyboard.press("Enter");

    // ค้นหาแถวที่ตรงกับชื่อ แล้วตรวจสอบ Tag สิทธิ์การเข้าถึงโดยตรง
    const targetRow = page.locator("tbody tr").filter({ hasText: memberName }).first();
    await expect(targetRow).toBeVisible({ timeout: 15000 });

    await expect(targetRow.locator("#textRole")).toHaveText("ประชาชนทั่วไป");
});
  
});