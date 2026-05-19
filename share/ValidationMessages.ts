import { test, expect, Page } from "@playwright/test";

export async function expectValidationMessagesIfAvailable(
  page: Page,
  messages: string[],
) {
  const missingMessages: string[] = [];

  for (const message of messages) {
    try {
      // รอให้ message ปรากฏ (timeout 5 วินาที) และใช้ exact: false เพื่อความยืดหยุ่น
      await expect(page.getByText(message, { exact: false }))
        .toBeVisible({ timeout: 5000 });
    } catch {
      missingMessages.push(message);
    }
  }

  if (missingMessages.length > 0) {
    // แสดงข้อมูล debug เพิ่มเติม
    const allTextContent = await page.locator("body").innerText().catch(() => "");

    throw new Error(
      [
        "ไม่พบ validation message ต่อไปนี้:",
        ...missingMessages.map((text) => `- ${text}`),
        "",
        "หมายเหตุ: หาก UI แสดง validation แล้ว อาจเป็นเพราะ:",
        "1. Text ไม่ตรงกับที่คาดหวัง (เช่น มีช่องว่างหรือตัวพิมพ์ต่างกัน)",
        "2. Validation แสดงช้ากว่า 5 วินาที",
        "3. UI ใช้ format ต่างจากข้อความที่เช็ค",
        "",
        "Text บางส่วนที่เจอในหน้า:",
        allTextContent.substring(0, 500) + "...",
      ].join("\n"),
    );
  }
}