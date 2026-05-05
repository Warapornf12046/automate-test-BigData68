// tests/fixtures/test-utils.ts
// สร้าง helper สำหรับ random text
// tests/fixtures/test-utils.ts

export function randomText(prefix: string, maxLength = 50) {
  const suffix = "1234567890".repeat(20);
  return `${prefix}${suffix}`.slice(0, maxLength);
}