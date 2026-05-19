import { expect, Page } from "@playwright/test";

export async function selectAntdDateByDay(
  page: Page,
  inputSelector: string,
  day: string | number,
) {
  const input = page.locator(inputSelector);

  await input.scrollIntoViewIfNeeded();
  await input.click();

  const dropdown = page.locator(
    ".ant-picker-dropdown:not(.ant-picker-dropdown-hidden)",
  );

  await expect(dropdown).toBeVisible({ timeout: 10000 });

  const dayText = String(day);

  const dayCellInner = dropdown
    .locator(
      ".ant-picker-cell:not(.ant-picker-cell-disabled) .ant-picker-cell-inner",
    )
    .filter({
      hasText: new RegExp(`^${dayText}$`),
    })
    .first();

  await expect(dayCellInner).toBeAttached({ timeout: 10000 });

  await dayCellInner.evaluate((el) => {
    (el as HTMLElement).click();
  });

  await dropdown.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
}

export async function selectAntdOption(
  page: Page,
  selectSelector: string,
  optionText: string,
) {
  const input = page.locator(selectSelector);

  // กด wrapper ของ AntD select
  await input.locator("..").click();

  const dropdown = page.locator(
    ".ant-select-dropdown:not(.ant-select-dropdown-hidden)",
  );

  // ถ้า select นี้ search ได้ ค่อยพิมพ์
  const canSearch = await input.isEditable().catch(() => false);

  if (canSearch) {
    await input.fill("");
    await input.fill(optionText);
  }

  const option = dropdown
    .locator(".ant-select-item-option")
    .filter({ hasText: optionText })
    .first();

  await expect(option).toBeVisible({ timeout: 15000 });
  await option.scrollIntoViewIfNeeded();
  await option.click();
}
