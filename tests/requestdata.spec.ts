import { test, expect, Page } from "@playwright/test";
import { login } from "../share/login.spec";
import { logout } from "../share/logout.spec";
import { save } from "../share/save";

export async function mLogin(page: Page) {
  await login(page);


  await page.locator('button[id="การจัดการ (Management)-7"]').click();
  await page.locator("a#จัดการร้องขอชุดข้อมูล-2").click();
  // await expect(page).toHaveURL(/.*opendata\/admin/);
  await expect(page).toHaveURL(/.*opendata\/admin/, { timeout: 20000 });
}

export async function searchReportAndClickEdit(page: Page, name: string) {
  const searchInput = page.locator("input[placeholder='ค้นหาชื่อ-นามสกุล']");

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
  const editButton = targetRow.locator("#changeStatus").first();

  await expect(editButton).toBeVisible({
    timeout: 10000,
  });

  await editButton.click();
}

export async function selectAntdOptionBySearch(
  page: Page,
  selectSelector: string,
  searchText: string,
  optionText: string,
) {
  // await closeAntdDropdown(page);

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
  const dropdown = page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden)").last();

  await page.keyboard.press("Escape");
  await dropdown.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
} 


export async function clickModalSubmit(page: Page) {
  // รอ modal visible
  const modal = page.locator('.ant-modal:visible');
  await expect(modal).toBeVisible({ timeout: 10000 });

  // รอปุ่ม submit ภายใน modal ให้แน่นอน
  const submitButton = modal.locator('button.submit-btn');

  // ใช้ waitFor + retry แทน scrollIntoView
  await submitButton.waitFor({
    state: 'visible',
    timeout: 10000
  });

  await expect(submitButton).toBeEnabled({ timeout: 10000 });

  // คลิกแบบ force แทน scrollIntoView
  await submitButton.click({ force: true });
}

test.describe("จัดการร้องขอชุดข้อมูล", () => {
  test.beforeEach(async ({ page }) => {
    await mLogin(page);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("เปลี่ยนสถานะ", async ({ page }) => {
    test.setTimeout(30000); // เพิ่มเวลา timeout สำหรับการทดสอบนี้
    const memberName = "John Smith";
    await searchReportAndClickEdit(page, memberName);
    await selectAntdOptionBySearch(page, "#changeStatusDropdown", "กำลังดำเนินการ", "กำลังดำเนินการ");

    await clickModalSubmit(page)

    // await expect(page.getByText("แก้ไขข้อมูลเสร็จสิ้น")).toBeVisible({
    //   timeout: 10000,
    // });
    // รอ Swal ปรากฏ
    const swalSuccess = page.locator('.swal2-container .swal2-title', { hasText: 'แก้ไขข้อมูลเสร็จสิ้น' });
    await expect(swalSuccess).toBeVisible({ timeout: 5000 });


    // (Optional) รอ Swal หายก่อนทำงานต่อ
    await page.waitForTimeout(5100); // รอ timer 5000ms หมด



  })
})