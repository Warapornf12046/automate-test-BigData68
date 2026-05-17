import { test, expect, Page } from "@playwright/test";
import { login } from "../share/login.spec";
import { logout } from "../share/logout.spec";
import { randomText } from "../share/randomText";
import {expectValidationMessagesIfAvailable} from "../share/ValidationMessages"

export async function searchReportAndClickEdit(page: Page, name: string) {
  const searchInput = page.locator("input[placeholder='ค้นหาชื่อกลุ่มสิทธิ์']");
  
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
  // const editButton = targetRow.locator("#changeStatus").first();
   const editButton = targetRow.locator("button[aria-label='Edit']").first();

  await expect(editButton).toBeVisible({
    timeout: 10000,
  });

  await editButton.click();
}

export async function fillDataAccessDetailForm(
  page: Page,
  roleName: string,
  roleNameEn: string,
  description: string,
) {
  await page
    .getByPlaceholder("กรอกชื่อกลุ่มสิทธิ", { exact: true })
    .fill(roleName);
  await page
    .getByPlaceholder("กรอกชื่อกลุ่มสิทธิภาษาอังกฤษ", { exact: true })
    .fill(roleNameEn);
  await selectAntdOptionByText(
    page,
    ".ant-select:has(#status)",
    "เปิดใช้งาน",
  );
  await page.getByPlaceholder("กรอกรายละเอียด").fill(description);
}


export async function mLogin(page: Page) {
  await login(page);
  

  await page.locator('button[id="การจัดการ (Management)-7"]').click();
  await page.locator("a#จัดการสิทธิ์การเข้าถึงข้อมูล-1").click();
  // await expect(page).toHaveURL(/.*opendata\/admin/);
  await expect(page).toHaveURL(/.*manage\/data-access/);
}

export async function selectAntdOptionByText(
  page: Page,
  selectSelector: string,
  optionText: string,
) {
  const select = page.locator(selectSelector).first();

  await expect(select).toBeVisible({ timeout: 10000 });
  await select.scrollIntoViewIfNeeded();
  await select.click({ force: true });

  const dropdown = page
    .locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden)")
    .last();

  await expect(dropdown).toBeVisible({ timeout: 10000 });

  const option = dropdown
    .locator(".ant-select-item-option")
    .filter({ hasText: optionText })
    .first();

  await expect(option).toBeVisible({ timeout: 10000 });
  await option.click({ force: true });
  await dropdown.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
}

export async function waitForPermissionList(page: Page) {
  await page
    .getByText("กำลังโหลดรายการสิทธิ์การใช้งาน...")
    .waitFor({ state: "hidden", timeout: 30000 })
    .catch(() => {});

  await expect(page.locator(".ant-collapse-item").first()).toBeVisible({
    timeout: 30000,
  });
}

export async function checkPermissionByLabel(page: Page, label: string) {
  await expect(page.locator(".ant-collapse").first()).toBeVisible({
    timeout: 30000,
  });

  const permissionItem = page
    .locator(".ant-collapse-item")
    .filter({
      has: page.getByText(label, { exact: true }),
    })
    .first();

  await expect(permissionItem).toBeVisible({ timeout: 30000 });

  const checkboxInput = permissionItem.locator(".ant-checkbox-input").first();

  if (!(await checkboxInput.isChecked())) {
    await permissionItem
      .locator(".ant-checkbox-wrapper, .ant-checkbox")
      .first()
      .click({ force: true });
  }

  await expect(checkboxInput).toBeChecked();
}

 


test.describe("จัดการสิทธิ์การเข้าถึงข้อมูล" ,() => {
  test.beforeEach(async ({ page }) => {
    await mLogin(page);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("เปลี่ยนสถานะ" ,  async ({ page }) =>{
    test.setTimeout(180000);

    const roleName = "แม่บ้าน";

    const searchInput = page.locator("input[placeholder='ค้นหาชื่อกลุ่มสิทธิ์']");
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill("");
    await searchInput.pressSequentially(roleName, { delay: 120 });
    await page.keyboard.press("Enter");

    const targetRow = page.locator("tbody tr").filter({ hasText: roleName }).first();
    await expect(targetRow).toBeVisible({ timeout: 15000 });

    const statusButton = targetRow.locator("#changeStatus").first();
    await expect(statusButton).toBeVisible({ timeout: 10000 });
    const isActive = (await statusButton.getAttribute("aria-checked")) === "true";
    await statusButton.click();

    const confirmSwal = page.locator(".swal2-popup:visible");
    await expect(confirmSwal).toBeVisible({ timeout: 10000 });
    const expectedConfirmTitle = isActive
      ? "ต้องการปิดการใช้งานกลุ่มสิทธิ์ใช่หรือไม่?"
      : "ต้องการเปิดใช้งานกลุ่มสิทธิ์ใช่หรือไม่?";

    await expect(confirmSwal.locator(".swal2-title")).toContainText(
      expectedConfirmTitle,
    );
    const confirmButton = confirmSwal.locator(".swal2-confirm");
    await expect(confirmButton).toBeEnabled({ timeout: 10000 });
    await confirmButton.click();

    const successSwal = page.locator(".swal2-popup:visible");
    await expect(successSwal).toBeVisible({ timeout: 30000 });
    await expect(successSwal.locator(".swal2-title")).toContainText(
      "แก้ไขข้อมูลเสร็จสิ้น",
      { timeout: 30000 },
    );
    await successSwal.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});

  })

  test("เพิ่มกลุ่มสิทธิ์" ,  async ({ page }) =>{
    test.setTimeout(180000);

    const suffix = randomText(8).replace(/\d/g, "a");
    const roleName = `กลุ่มสิทธิ์ทดสอบ ${suffix}`;
    const roleNameEn = `Test Permission ${suffix}`;

    await page.getByRole("button", { name: "เพิ่มกลุ่มสิทธิ์" }).click();
    await expect(page).toHaveURL(/.*manage\/data-access\/detail.*mode=add/);
    await expect(
      page.getByRole("heading", { name: "สร้างกลุ่มสิทธิการใช้งาน" }),
    ).toBeVisible({ timeout: 10000 });
    await waitForPermissionList(page);

    await page
      .getByPlaceholder("กรอกชื่อกลุ่มสิทธิ", { exact: true })
      .fill(roleName);
    await page
      .getByPlaceholder("กรอกชื่อกลุ่มสิทธิภาษาอังกฤษ", { exact: true })
      .fill(roleNameEn);
    // await selectAntdOptionByText(
    //   page,
    //   ".ant-select:has(#status)",
    //   "เปิดใช้งาน",
    // );
     await fillDataAccessDetailForm(
      page,
       roleName,
      roleNameEn,
      `รายละเอียดสำหรับ ${roleName}`,
    );
    // await page.getByPlaceholder("กรอกรายละเอียด").fill(
    //   `รายละเอียดสำหรับ ${roleName}`,
    // );

    await checkPermissionByLabel(page, "หน้าหลัก");

    await page.getByRole("button", { name: "บันทึก" }).click();

    const swalSuccess = page.locator(".swal2-container .swal2-title", {
      hasText: "บันทึกข้อมูลเสร็จสิ้น",
    });

    await expect(swalSuccess).toBeVisible({ timeout: 30000 });
    await swalSuccess.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  })

   test("แก้ไขกลุ่มสิทธิ์" ,  async ({ page }) =>{
    test.setTimeout(180000);

    const searchRoleName = "แม่บ้าน";
    const suffix = randomText(8).replace(/\d/g, "a");
    const roleName = `${searchRoleName} ทดสอบ ${suffix}`;
    const roleNameEn = `Housekeeper Test ${suffix}`;
    const description = `รายละเอียดแก้ไขกลุ่มสิทธิ์ ${roleName}`;

    await searchReportAndClickEdit(page, searchRoleName);
    await expect(page).toHaveURL(/.*manage\/data-access\/detail.*mode=edit/);
    await expect(
      page.getByRole("heading", { name: "แก้ไขกลุ่มสิทธิการใช้งาน" }),
    ).toBeVisible({ timeout: 10000 });

    const nameInput = page.getByPlaceholder("กรอกชื่อกลุ่มสิทธิ", {
      exact: true,
    });
    await expect(nameInput).toHaveValue(/แม่บ้าน/, { timeout: 30000 });
    await waitForPermissionList(page);

    await fillDataAccessDetailForm(page, roleName, roleNameEn, description);
    await checkPermissionByLabel(page, "หน้าหลัก");
    await checkPermissionByLabel(page, "AI Search");

    await page.getByRole("button", { name: "บันทึก" }).click();

    const swalSuccess = page.locator(".swal2-container .swal2-title", {
      hasText: "แก้ไขข้อมูลเสร็จสิ้น",
    });

    await expect(swalSuccess).toBeVisible({ timeout: 30000 });
    await swalSuccess.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  })

  test("บังคับการกรอกข้อมูล" ,async ({ page }) =>{

    test.setTimeout(180000);
    await page.getByRole("button", { name: "เพิ่มกลุ่มสิทธิ์" }).click();

     await page.getByRole("button", { name: "บันทึก" }).click();

     await expectValidationMessagesIfAvailable(page,
      [
        "กรุณากรอกชื่อกลุ่มสิทธิ์",
        "กรุณากรอกชื่อกลุ่มสิทธิภาษาอังกฤษ",

      ]
     )
    })


});
