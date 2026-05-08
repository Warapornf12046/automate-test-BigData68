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
  page: any,
  selectSelector: string,
  optionText: string,
) {
  await page.locator(selectSelector).click();

  const dropdown = page
    .locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden)")
    .last();

  await dropdown
    .locator(".ant-select-item-option")
    .filter({ hasText: optionText })
    .click();
}
