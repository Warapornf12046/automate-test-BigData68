// tests/fixtures/test-utils.ts
// สร้าง helper สำหรับ random text
// tests/fixtures/test-utils.ts

export function randomText(prefix = "ทดสอบ") {
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${rand}`;
}