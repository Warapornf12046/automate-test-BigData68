import { test, expect, Page } from "@playwright/test";
import { randomText } from "../share/randomText";
import { selectAntdDateByDay, selectAntdOption } from "../share/selectAntd";
import { createRandomUploadFile } from "../share/fileRandom";
import { login } from "../share/login.spec";
import { logout } from "../share/logout.spec";

let firstRowIssueNumber: string ;

test("issuestagemanage test", async ({ page }) => {
  await test.step("login", async () => {
    await login(page);
  });
  await page.locator('button[id="บริหารส่วนกลาง-4"]').click();
  await page.locator('a[id="แบบฟอร์มการแจ้งปัญหา-0"]').click();
  await expect(page).toHaveURL(/.*report-issue/);

  await test.step("เช็คข้อมูล", async () => {
    await checkdata(page);
  });

  await test.step("เพิ่มข้อมูล", async () => {
    await adddata(page);
  });
  await page.locator('button[id="การจัดการ (Management)-7"]').click();
  await page.locator('a[id="จัดการสถานะการแจ้งปัญหาการใช้งาน-4"]').click();
  await expect(page).toHaveURL(/.*manage\/report-issue/);

  await test.step("แก้ไขข้อมูล และเช็ค", async () => {
    await editdata(page);
  });
});

async function checkdata(page: Page) {
  await page.locator('button:has-text("ยืนยัน")').click();
  await expect(page.locator("#category_help")).toHaveText(
    "กรุณาเลือกประเภทปัญหา",
  );
  await expect(page.locator("#subject_help")).toHaveText(
    "กรุณากรอกหัวข้อปัญหา",
  );
  await expect(page.locator("#details_help")).toHaveText(
    "กรุณาระบุรายละเอียดปัญหา",
  );
}

async function adddata(page: Page) {
  await selectAntdOption(page, "#category", "ปัญหาเกี่ยวกับข้อมูล (Data)");
  await selectAntdOption(page, "#urgency", "ต่ำ");
  const subject = randomText(20);
  await page.locator("#subject").fill(subject);
  const details = randomText(100);
  await page.locator("#details").fill(details);
  const suggestion = randomText(100);
  await page.locator("#suggestion").fill(suggestion);
  const pdfPath = createRandomUploadFile("pdf");

  await page.locator('input[name="file"]').setInputFiles(pdfPath);
  const createResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes(`api/Reportissue/create`) &&
      response.request().method() === "POST",
  );
  await page.locator('button:has-text("ยืนยัน")').click();
  const swal = page.locator(".swal2-popup");
  await expect(swal).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".swal2-title")).toContainText(
    "บันทึกข้อมูลเสร็จสิ้น",
  );
  const createResponse = await createResponsePromise;
  const createResult = await createResponse.json();
  expect(createResult.status).toBeTruthy();

  await page.locator('input[placeholder="Search"]').fill(subject);
  const firstRow = page.locator("table tbody tr.ant-table-row-level-0").first();

  // ดึงข้อมูลจากคอลัมน์ต่าง ๆ ของแถวแรก
  firstRowIssueNumber = await firstRow.locator("td:nth-child(1)").innerText();
  const status = await firstRow.locator("td:nth-child(5)").innerText();
  const buttonInUrgency = firstRow.locator("td:nth-child(7) button");
  // รอให้ปุ่มพร้อม
  await expect(buttonInUrgency).toBeVisible();
  await expect(buttonInUrgency).toBeEnabled();

  // คลิกปุ่ม
  await buttonInUrgency.click();

  const ticketIdLocator = page.locator("#ticketId");

  await ticketIdLocator.waitFor({ state: "visible", timeout: 10000 });

  await expect(ticketIdLocator).toContainText(firstRowIssueNumber);

  await expect(page.locator("#subject")).toContainText(subject);

  await expect(page.locator("#status")).toContainText(status);
  await expect(page.locator("#details")).toContainText(details);
  await expect(page.locator("#suggestion")).toContainText(suggestion);
}

async function editdata(page: Page) {
  // รอให้ table พร้อม
  await page.waitForSelector("#listreportissue");

  const listReportIssueDiv = page.locator("#listreportissue");

  // ใส่ค่า search
  await page
    .locator('input[placeholder="ค้นหา (Ticket ID / หัวข้อ / ผู้แจ้ง)"]')
    .fill(firstRowIssueNumber);

  // เลือกแถวแรกหลัง filter
  const firstRow = page.locator("table tbody tr.ant-table-row-level-0").first();

  // ดึงข้อมูลจากแต่ละ column
  const issueNumber = await firstRow.locator("td:nth-child(1)").innerText();
  const reporter = await firstRow.locator("td:nth-child(2)").innerText();
  const issueTitle = await firstRow.locator("td:nth-child(3)").innerText();
  const priority = await firstRow.locator("td:nth-child(4)").innerText();
  const status = await firstRow.locator("td:nth-child(5)").innerText();

  // เลือกปุ่มใน column 6 ของแถวแรก
  const actionButton = firstRow.locator("td:nth-child(6) button");
  await expect(actionButton).toBeVisible();
  await expect(actionButton).toBeEnabled();
  await actionButton.click();

  // ตรวจสอบว่าหน้า detail แสดงข้อมูลตรงกับ table
  await expect(page.locator("#ticketId")).toHaveText(issueNumber);
  await expect(page.locator("#nametitle")).toHaveText(issueTitle);
  await expect(page.locator("#statusDetail")).toHaveText(status);

  // กดปุ่ม edit
  await page.locator('button[id="edit-data"]').click();

  // เลือกค่า Antd select
  await selectAntdOption(
    page,
    "input[id='status']",
    "เจ้าหน้าที่รับเรื่องและมอบหมายทีมงาน",
  );
  await selectAntdOption(
    page,
    "input[id='adminAssignee']",
    "ทีมเทคนิค (Tech Team)",
  );

  // กรอก textarea
  const internal = randomText(10);
  await page.fill("textarea[id='adminInternalNote']", internal);

  const resolution = randomText(10);
  await page.fill("textarea[id='adminResolution']", resolution);

  // Submit form
  await page.locator('button[id="btn-submit"]').click();

  // รอ swal ขึ้น
  const swal = page.locator(".swal2-popup");
  await expect(swal).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".swal2-title")).toContainText(
    "แก้ไขข้อมูลเสร็จสิ้น",
  );
  await page.waitForTimeout(3000); 

  const searchInput = page.locator(
    'input[placeholder="ค้นหา (Ticket ID / หัวข้อ / ผู้แจ้ง)"]',
  );

  // รอให้ visible ก่อน
  await expect(searchInput).toBeVisible({ timeout: 10000 });

  // หลังจากนี้ค่อย fill
  await searchInput.fill(firstRowIssueNumber);
  await page.waitForTimeout(1000); // รอให้ table update หลัง search
  // เลือกแถวแรกหลัง filter
  const firstRows = page
    .locator("table tbody tr.ant-table-row-level-0")
    .first();

  // เลือกปุ่มใน column 7
  const checkbtn = firstRows.locator("td:nth-child(6) button");

  // รอให้ปุ่ม visible + enabled ก่อนคลิก
  await expect(checkbtn).toBeVisible();
  await expect(checkbtn).toBeEnabled();
  await checkbtn.click();

  // ตรวจสอบค่าที่แก้ไขแล้ว
  await expect(page.locator("#statusDetail")).toContainText(
    "เจ้าหน้าที่รับเรื่องและมอบหมายทีมงาน",
  );
  const adminAssigneeWrapper = page
    .locator("input[id='adminAssignee']")
    .locator(".."); // parent div
  await expect(adminAssigneeWrapper).toContainText("ทีมเทคนิค (Tech Team)");
  await expect(page.locator("textarea[id='adminInternalNote']")).toHaveValue(
    internal,
  );
  await expect(page.locator("textarea[id='adminResolution']")).toHaveValue(
    resolution,
  );

  // กดดู Timeline
  const timelineBtn = page.locator('button:has-text("ดูหน้า Tracking")');
  await expect(timelineBtn).toBeVisible();
  await timelineBtn.click();

  // รอ Timeline แสดง
  await page.waitForSelector("#timeline");

  // ดึง Timeline item ล่าสุด
  const lastTimelineItem = page.locator("#timeline .ant-timeline-item").last();
  const lastItemText = await lastTimelineItem.innerText();
  const lines = lastItemText.split("\n");

  // lines[1] = status line
  const statusLine = lines[1].trim();

  // เช็คว่า Timeline แสดง status ที่แก้ไข
  await expect(statusLine).toContain("เจ้าหน้าที่รับเรื่องและมอบหมายทีมงาน");
}
