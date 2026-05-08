import { test, expect, Page } from "@playwright/test";
import { randomText } from "../share/randomText";
import { selectAntdDateByDay, selectAntdOption } from "../share/selectAntd";
import { createRandomUploadFile } from "../share/fileRandom";
import { login } from "../share/login.spec";

test("usecase test", async ({ page }) => {
  await adddata(page);
  await updatedata(page);
  await deletedata(page);
});

//createdocpub
async function adddata(page: Page) {
  login(page);

  //ไปที่menu จัดการข้อมูลและ เข้าหน้าจัดการรายงาน
  await page.locator("button#จัดการข้อมูล-5").click();
  await page.locator("a#จัดการวิเคราะห์ข้อมูลตามกรณีศึกษา-4").click();
  await expect(page).toHaveURL(/.*manage\/usecase/);

  //addข้อมูล
  await page.locator("#usecaseName").fill(randomText(20));
  await page.locator("#orgCode").click();
  await page.getByTitle("กรมพัฒนาฝีมือแรงงาน").click();

  await page.locator("#detail").fill(randomText(60));

  await page.locator("#reportDataGroupCode").click();
  await page.getByTitle("โครงสร้างแรงงานและการจ้างงาน").click();

  await page.locator("#entryType").click();
  await page.getByTitle("อุปทานแรงงาน").click();

  await page.locator("#status").click();
  await page.getByTitle("เผยแพร่").click();

  await page.locator("#analysisName").fill(randomText(20));

  await page.keyboard.press("Enter");
  const swal = page.locator(".swal2-popup");
  await expect(swal).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".swal2-title")).toContainText(
    "บันทึกข้อมูลเสร็จสิ้น",
  );
}

//updatedata
async function updatedata(page: Page) {
  login(page);

  //ไปที่menu จัดการข้อมูลและ เข้าหน้าจัดการรายงาน
  await page.locator("button#จัดการข้อมูล-5").click();
  await page.locator("a#จัดการวิเคราะห์ข้อมูลตามกรณีศึกษา-4").click();
  await expect(page).toHaveURL(/.*manage\/usecase/);

  await page.locator('[id^="edit-"]').last().click();

  await page.locator("#usecaseName").fill(randomText(20));

  await selectAntdOption(page, "#orgCode", "กรมการจัดหางาน");

  await page.locator("#detail").fill(randomText(60));

  await page.locator("#submit").click();
  const swal = page.locator(".swal2-popup");
  await expect(swal).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".swal2-title")).toContainText(
    "แก้ไขข้อมูลเสร็จสิ้น",
  );
}

//deletedata
async function deletedata(page: Page) {
  login(page);

  //ไปที่menu จัดการข้อมูลและ เข้าหน้าจัดการรายงาน
  await page.locator("button#จัดการข้อมูล-5").click();
  await page.locator("a#จัดการวิเคราะห์ข้อมูลตามกรณีศึกษา-4").click();
  await expect(page).toHaveURL(/.*manage\/usecase/);

  await page.locator('[id^="delete-"]').last().click();
  await page.locator(".swal2-confirm").click();

  const swal = page.locator(".swal2-popup");
  await expect(swal).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".swal2-title")).toContainText("ลบข้อมูลเสร็จสิ้น");
}
