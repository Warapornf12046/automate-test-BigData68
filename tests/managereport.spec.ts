// tests/managereport.spec.ts

import { test, expect, Page } from "@playwright/test";
import {
  loginData,
  reportStep1Data,
  commonMetadataInputData,
  metadataTypeData,
  organizationData,
  objectiveData,
  updateFrequencyUnitData,
  geoCoverageData,
  dataFormatData,
  dataGovernanceData,
  licenseData,
  statisticMetadataData,
  geoSpatialMetadataData,
  sponsorData,
  smallestUnitData,
  languageData,
  dictionaryRows,
} from "./fixtures/manage-report.data";

import type {
  InputFieldTestData,
  DictInputField,
  DictionaryRowTestData,
  SelectTestData,
  MultiSelectWithDetailData,
  DateFieldTestData,
} from "./fixtures/manage-report.data";

import { randomText } from "./fixtures/test-utils";

type SelectItem = {
  title: string;
  searchText?: string;
  optionText?: string;
  value?: string;
  code?: string;
  isOther?: boolean;
  otherInputSelector?: string;
  otherValue?: string;
};
type MultiSelectWithDetailItem = SelectItem & {
  detailSelector?: string;
  detail?: string;
};

type ObjectiveItem = {
  title: string;
  searchText?: string;
  optionText?: string;
  value: string;
  code: string;
  isOther: boolean;
  otherValue?: string;
  detail: string;
};

type OtherOptionItem = {
  title: string;
  isOther: boolean;
  otherInputSelector?: string;
  otherValue?: string;
};

async function fillSingleSelectOther(
  page: Page,
  selectSelector: string,
  item: SelectTestData,
) {
  await selectAntdOptionBySearch(
    page,
    selectSelector,
    item.searchText ?? item.title,
    item.optionText ?? item.title,
  );

  if (item.isOther && item.otherInputSelector && item.otherValue) {
    await fillMetadataInput(page, {
      selector: item.otherInputSelector,
      value: item.otherValue,
      maxLength: 150,
      inputType: "string",
    });
  }
}










async function selectAntdOptionBySearch(
  page: Page,
  selectSelector: string,
  searchText: string,
  optionText?: string,
) {
  const select = page.locator(selectSelector);

  await expect(select).toBeVisible({ timeout: 10000 });
  await select.click();

  await page.keyboard.press("Control+A");
  await page.keyboard.type(searchText);

  const dropdown = page.locator(
    ".ant-select-dropdown:not(.ant-select-dropdown-hidden)",
  );

  const option = dropdown
    .locator(".ant-select-item-option")
    .filter({ hasText: optionText ?? searchText })
    .first();

  await expect(option).toBeVisible({ timeout: 10000 });
  await option.click();

  await page.waitForTimeout(0);
}

async function fillMultiSelectOther(
  page: Page,
  selectSelector: string,
  items: readonly SelectTestData[],
) {
  for (const item of items) {
    await selectAntdMultipleOptionBySearch(
      page,
      selectSelector,
      item.searchText ?? item.title,
      item.optionText ?? item.title,
    );

    if (item.isOther && item.otherInputSelector && item.otherValue) {
      await fillMetadataInput(page, {
        selector: item.otherInputSelector,
        value: item.otherValue,
        maxLength: 150,
        inputType: "string",
      });
    }
  }
}

async function fillMultiSelectOtherAndDetail(
  page: Page,
  selectSelector: string,
  items: readonly MultiSelectWithDetailData[],
  buildOtherSelector: (value: string) => string,
  buildDetailSelector: (value: string) => string,
) {
  for (const item of items) {
    await selectAntdMultipleOptionBySearch(
      page,
      selectSelector,
      item.searchText ?? item.title,
      item.optionText ?? item.title,
    );

    const otherSelector = item.otherInputSelector ?? buildOtherSelector(item.value);
    const detailSelector = item.detailSelector ?? buildDetailSelector(item.value);

    if (item.isOther && item.otherValue) {
      const otherInput = page.locator(otherSelector);
      const commonObjectiveOther = page.locator("#admin-report-objective-other");

      if (await otherInput.isVisible().catch(() => false)) {
        await fillMetadataInput(page, {
          selector: otherSelector,
          value: item.otherValue,
          maxLength: 150,
          inputType: "string",
        });
      } else if (await commonObjectiveOther.isVisible().catch(() => false)) {
        await fillMetadataInput(page, {
          selector: "#admin-report-objective-other",
          value: item.otherValue,
          maxLength: 150,
          inputType: "string",
        });
      }
    }

    if (item.detail) {
      const detailValue =
        item.isOther && item.otherValue
          ? `${item.detail} (${item.otherValue})`
          : item.detail;

      await fillMetadataInput(page, {
        selector: detailSelector,
        value: detailValue,
        maxLength: 1000,
        inputType: "string",
      });
    }
  }
}



// ให้ report บอกครบว่าข้อความไหนหาย
async function expectValidationMessagesIfAvailable(
  page: Page,
  messages: string[],
) {
  const missingMessages: string[] = [];

  for (const message of messages) {
    const isVisible = await page
      .getByText(message, { exact: true })
      .isVisible()
      .catch(() => false);

    if (!isVisible) {
      missingMessages.push(message);
    }
  }

  if (missingMessages.length > 0) {
    throw new Error(
      [
        "ไม่พบ validation message ต่อไปนี้:",
        ...missingMessages.map((text) => `- ${text}`),
      ].join("\n"),
    );
  }
}



async function delay(page: Page, ms = 0) {
  await page.waitForTimeout(ms);
}

async function mLogin(page: Page) {
  await page.goto("/login");

  await expect(page).toHaveTitle(
    /โครงการพัฒนาฐานข้อมูลแรงงานอัจฉริยะและบูรณาการข้อมูลด้านแรงงาน/,
  );

  await page.locator("button#loginLDAP").click();

  await page.locator("#username").fill(loginData.username);
  await page.locator("#password").fill(loginData.password);

  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/.*main/, { timeout: 30000 });

  await page.locator("button#จัดการข้อมูล-5").click();
  await page.locator("a#จัดการรายงาน-3").click();

  await expect(page).toHaveURL(/.*manage\/admin-report/, {
    timeout: 30000,
  });
}

async function selectAntdOptionByText(
  page: Page,
  selectSelector: string,
  optionText: string,
  delayMs = 0,
) {
  await page.locator(selectSelector).click();

  const dropdown = page.locator(
    ".ant-select-dropdown:not(.ant-select-dropdown-hidden)",
  );

  const option = dropdown
    .locator(".ant-select-item-option")
    .filter({ hasText: optionText })
    .first();

  await expect(option).toBeVisible({ timeout: 10000 });
  await option.click();

  await delay(page, delayMs);
}

async function selectAntdMultipleOptionBySearch(
  page: Page,
  selectSelector: string,
  searchText: string,
  optionText?: string,
  delayMs = 0,
) {
  const select = page.locator(selectSelector);

  await expect(select).toBeVisible({ timeout: 10000 });
  await select.click();

  await page.keyboard.press("Control+A");
  await page.keyboard.type(searchText);

  await delay(page, 0);

  const dropdown = page.locator(
    ".ant-select-dropdown:not(.ant-select-dropdown-hidden)",
  );

  const option = dropdown
    .locator(".ant-select-item-option")
    .filter({ hasText: optionText ?? searchText })
    .first();

  await expect(option).toBeVisible({ timeout: 10000 });
  await option.click();

  await delay(page, delayMs);
}

async function fillRecordSpecificFields(page: Page) {
  await fillMetadataInput(page, commonMetadataInputData.accessCondition);

  await fillMetadataInput(page, commonMetadataInputData.url);

  await fillMultiSelectOtherAndDetail(
    page,
    "#admin-report-sponsor",
    sponsorData,
    (value) => `#admin-report-sponsor-other-${value}`,
    (value) => `#admin-report-sponsor-detail-${value}`,
  );

  await fillSingleSelectOther(
    page,
    "#admin-report-smallest-unit",
    smallestUnitData,
  );

  await fillMultiSelectOther(
    page,
    "#admin-report-language",
    languageData,
  );

  await setSwitch(
    page,
    "admin-report-high-value-dataset",
    commonMetadataInputData.highValueDataset,
  );

  await setSwitch(
    page,
    "admin-report-reference-data",
    commonMetadataInputData.referenceData,
  );
}

async function fillAndExpect(
  page: Page,
  selector: string,
  value: string,
  delayMs = 0,
) {
  const input = page.locator(selector);

  await expect(input).toBeVisible({ timeout: 10000 });
  await input.fill(value);
  await expect(input).toHaveValue(value);
  await delay(page, delayMs);
}

async function fillIfOther(page: Page, item: OtherOptionItem) {
  if (!item.isOther) return;

  if (!item.otherInputSelector || !item.otherValue) {
    throw new Error("กรณีเลือก อื่น ๆ ต้องระบุ otherInputSelector และ otherValue");
  }

  await fillAndExpect(page, item.otherInputSelector, item.otherValue);
}

async function setSwitch(page: Page, id: string, checked: boolean) {
  const sw = page.locator(`#${id}`);

  await expect(sw).toBeVisible({ timeout: 10000 });

  const current = await sw.getAttribute("aria-checked");

  if ((current === "true") !== checked) {
    await sw.click();
  }

  await expect(sw).toHaveAttribute("aria-checked", checked ? "true" : "false");
}

async function fillObjectiveItem(
  page: Page,
  item: ObjectiveItem
) {
  await selectAntdMultipleOptionBySearch(
    page,
    "#admin-report-objective",
    item.searchText ?? item.title,
    item.optionText ?? item.title,
    0,
  );

  const detailSelector = `#admin-report-objective-detail-${item.value}`;

  await expect(page.locator(detailSelector)).toBeVisible({ timeout: 10000 });

  if (item.isOther) {
    const specificOtherSelector = `#admin-report-objective-other-${item.value}`;
    const commonOtherSelector = "#admin-report-objective-other";

    const specificOtherInput = page.locator(specificOtherSelector);
    const commonOtherInput = page.locator(commonOtherSelector);

    if (await specificOtherInput.isVisible().catch(() => false)) {
      await specificOtherInput.fill(item.otherValue ?? "");
      await expect(specificOtherInput).toHaveValue(item.otherValue ?? "");
    } else {
      await expect(commonOtherInput).toBeVisible({ timeout: 10000 });
      await commonOtherInput.fill(item.otherValue ?? "");
      await expect(commonOtherInput).toHaveValue(item.otherValue ?? "");
    }
  }

  const detailValue =
    item.isOther && item.otherValue
      ? `${item.detail} (${item.otherValue})`
      : item.detail;

  await page.locator(detailSelector).fill(detailValue);
  await expect(page.locator(detailSelector)).toHaveValue(detailValue);
}

async function fillAndCheckTextLength(
  page: Page,
  selector: string,
  value: string,
  maxLength: number,
) {
  const input = page.locator(selector);

  await expect(input).toBeVisible({ timeout: 10000 });

  await input.fill(value);

  const actualValue = await input.inputValue();

  expect(actualValue.length).toBeLessThanOrEqual(maxLength);
}

async function expectCharacterCounter(page: Page, counterText: string) {
  await expect(page.getByText(counterText, { exact: false })).toBeVisible({
    timeout: 10000,
  });
}

async function goToMetadataStep(page: Page) {
  await mReportPart1(page);

  await page.locator("#admin-report-step-1-next").click();

  await expect(page.locator("#admin-report-type")).toBeVisible({
    timeout: 10000,
  });
}

async function checkInputType(
  page: Page,
  field: InputFieldTestData,
) {
  const value = getInputValue(field);
  const input = page.locator(field.selector);

  await expect(input).toBeVisible({ timeout: 10000 });
  await input.fill(value);

  const actualValue = await input.inputValue();

  switch (field.inputType) {
    case "number":
      expect(actualValue).toMatch(/^\d+$/);
      break;

    case "email":
      expect(actualValue).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      break;

    case "url":
      expect(actualValue).toMatch(/^https?:\/\/.+/);
      break;

    case "string":
      expect(typeof actualValue).toBe("string");
      expect(actualValue.length).toBeGreaterThan(0);
      break;
  }
}

async function checkInputMaxLength(
  page: Page,
  field: InputFieldTestData,
) {
  const value = getInputValue(field);
  const input = page.locator(field.selector);

  await expect(input).toBeVisible({ timeout: 10000 });
  await input.fill(value);

  const actualValue = await input.inputValue();

  if (field.maxLength !== undefined) {
    expect(actualValue.length).toBeLessThanOrEqual(field.maxLength);
  }
}

async function fillMetadataInput(
  page: Page,
  field: InputFieldTestData,
) {
  const value = getInputValue(field);
  const input = page.locator(field.selector);

  await expect(input).toBeVisible({ timeout: 10000 });
  await input.fill(value);
  await expect(input).toHaveValue(value);

  return value;
}

async function fillDateAndCheckFormat(
  page: Page,
  field: DateFieldTestData,
) {
  const input = page.locator(field.selector);

  await expect(input).toBeVisible({ timeout: 10000 });

  await input.evaluate((el) => {
    const inputEl = el as HTMLInputElement;
    inputEl.removeAttribute("readonly");
  });

  await input.click();
  await input.fill("");
  await input.type(field.value, { delay: 20 });
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");

  await input.evaluate((el) => {
    const inputEl = el as HTMLInputElement;
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    inputEl.dispatchEvent(new Event("change", { bubbles: true }));
    inputEl.dispatchEvent(new Event("blur", { bubbles: true }));
  });

  const actualValue = await input.inputValue();

  if (field.format === "YYYY-MM-DD") {
    expect(actualValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  }

  if (field.format === "YYYY-MM-DD-HH-mm") {
    expect(actualValue).toMatch(/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}$/);
  }

  await expect(input).toHaveValue(field.value);
}

async function forceFillDateAndCheckFormat(
  page: Page,
  field: DateFieldTestData,
) {
  const input = page.locator(field.selector);

  await expect(input).toBeVisible({ timeout: 10000 });

  await input.evaluate((el, val) => {
    const inputEl = el as HTMLInputElement;
    inputEl.value = String(val);
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    inputEl.dispatchEvent(new Event("change", { bubbles: true }));
  }, field.value);

  const actualValue = await input.inputValue();

  if (field.format === "YYYY-MM-DD") {
    expect(actualValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  }

  if (field.format === "YYYY-MM-DD-HH-mm") {
    expect(actualValue).toMatch(/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}$/);
  }
}

// async function fillCommonMetadataInputs(page: Page) {
//   await fillMetadataInput(page, commonMetadataInputData.datasetName);
//   await fillMetadataInput(page, commonMetadataInputData.contactName);
//   await fillMetadataInput(page, commonMetadataInputData.contactEmail);
//   await fillMetadataInput(page, commonMetadataInputData.keyword);
//   await fillMetadataInput(page, commonMetadataInputData.description);
//   await fillMetadataInput(page, commonMetadataInputData.updateFrequencyValue);
//   await fillMetadataInput(page, commonMetadataInputData.source);
//   await fillMetadataInput(page, commonMetadataInputData.accessCondition);
// }

async function fillCommonMetadataInputs(page: Page) {
  await fillMetadataInput(page, commonMetadataInputData.datasetName);
  await fillMetadataInput(page, commonMetadataInputData.contactName);
  await fillMetadataInput(page, commonMetadataInputData.contactEmail);
  await fillMetadataInput(page, commonMetadataInputData.keyword);
  await fillMetadataInput(page, commonMetadataInputData.description);
  await fillMetadataInput(page, commonMetadataInputData.updateFrequencyValue);
  await fillMetadataInput(page, commonMetadataInputData.source);
}

async function fillCommonMetadataSelects(page: Page) {
  await fillSingleSelectOther(page, "#admin-report-org", organizationData);

  await fillMultiSelectOtherAndDetail(
    page,
    "#admin-report-objective",
    objectiveData,
    (value) => `#admin-report-objective-other-${value}`,
    (value) => `#admin-report-objective-detail-${value}`,
  );

  await fillSingleSelectOther(
    page,
    "#admin-report-freq-unit",
    updateFrequencyUnitData,
  );

  await fillSingleSelectOther(
    page,
    "#admin-report-geo-scope",
    geoCoverageData,
  );

  await fillMultiSelectOther(page, "#admin-report-format", dataFormatData);

  await fillSingleSelectOther(
    page,
    "#admin-report-governance",
    dataGovernanceData,
  );

  await fillSingleSelectOther(page, "#admin-report-license", licenseData);
}

async function setDictionaryRequired(
  page: Page,
  index: number,
  required: boolean,
) {
  const checkboxWrapper = page.getByTestId(`dict-required-${index}`);

  await expect(checkboxWrapper).toBeVisible({ timeout: 10000 });

  const checkboxInput = checkboxWrapper.locator("input").first();

  const hasInput = await checkboxInput.count();

  if (hasInput > 0) {
    const isChecked = await checkboxInput.isChecked();

    if (isChecked !== required) {
      await checkboxWrapper.click();
    }

    if (required) {
      await expect(checkboxInput).toBeChecked();
    } else {
      await expect(checkboxInput).not.toBeChecked();
    }

    return;
  }

  // fallback กรณีไม่มี input ข้างใน ให้ดู class/aria-checked ของ wrapper
  const ariaChecked = await checkboxWrapper.getAttribute("aria-checked");
  const className = await checkboxWrapper.getAttribute("class");

  const isChecked =
    ariaChecked === "true" ||
    String(className ?? "").includes("ant-checkbox-wrapper-checked") ||
    String(className ?? "").includes("ant-checkbox-checked");

  if (isChecked !== required) {
    await checkboxWrapper.click();
  }
}

async function fillMetadataType(
  page: Page,
  typeItem: SelectTestData,
) {
  await fillSingleSelectOther(page, "#admin-report-type", typeItem);

  if (typeItem.isOther && typeItem.otherInputSelector && typeItem.otherValue) {
    await fillMetadataInput(page, {
      selector: typeItem.otherInputSelector,
      value: typeItem.otherValue,
      maxLength: 150,
      inputType: "string",
    });
  }
}

function getInputValue(field: InputFieldTestData) {
  return field.value ?? randomText(field.valuePrefix ?? "ทดสอบ");
}

function getMetadataInputFields(): InputFieldTestData[] {
  return [
    commonMetadataInputData.datasetName,
    commonMetadataInputData.contactName,
    commonMetadataInputData.contactEmail,
    commonMetadataInputData.keyword,
    commonMetadataInputData.description,
    commonMetadataInputData.updateFrequencyValue,
    commonMetadataInputData.source,
    commonMetadataInputData.accessCondition,
    commonMetadataInputData.url,
  ];
}

async function checkDictionaryRowType(
  page: Page,
  index: number,
  row: DictionaryRowTestData,
) {
  await checkDictInputType(
    page,
    `[data-testid="dict-column-name-${index}"]`,
    row.columnName,
  );

  await checkDictInputType(
    page,
    `[data-testid="dict-data-type-${index}"]`,
    row.dataType,
  );

  await checkDictInputType(
    page,
    `[data-testid="dict-size-value-${index}"]`,
    row.sizeValue,
  );

  await checkDictInputType(
    page,
    `[data-testid="dict-description-${index}"]`,
    row.description,
  );

  await checkDictInputType(
    page,
    `[data-testid="dict-sample-data-${index}"]`,
    row.sampleData,
  );
}

async function fillCommonSwitches(page: Page) {
  await setSwitch(
    page,
    "admin-report-high-value-dataset",
    commonMetadataInputData.highValueDataset,
  );

  await setSwitch(
    page,
    "admin-report-reference-data",
    commonMetadataInputData.referenceData,
  );
}

// async function fillCommonSwitchesIfVisible(page: Page) {
//   const highValue = page.locator("#admin-report-high-value-dataset");
//   const reference = page.locator("#admin-report-reference-data");

//   if (await highValue.isVisible().catch(() => false)) {
//     await setSwitch(
//       page,
//       "admin-report-high-value-dataset",
//       commonMetadataInputData.highValueDataset,
//     );
//   }

//   if (await reference.isVisible().catch(() => false)) {
//     await setSwitch(
//       page,
//       "admin-report-reference-data",
//       commonMetadataInputData.referenceData,
//     );
//   }
// }
async function fillCommonSwitchesIfVisible(page: Page) {
  const highValue = page.locator("#admin-report-high-value-dataset");
  const reference = page.locator("#admin-report-reference-data");

  if (await highValue.isVisible().catch(() => false)) {
    await setSwitch(
      page,
      "admin-report-high-value-dataset",
      commonMetadataInputData.highValueDataset,
    );
  }

  if (await reference.isVisible().catch(() => false)) {
    await setSwitch(
      page,
      "admin-report-reference-data",
      commonMetadataInputData.referenceData,
    );
  }
}
async function checkDictInputType(
  page: Page,
  selector: string,
  field: DictInputField,
) {
  const input = page.locator(selector);

  await expect(input).toBeVisible({ timeout: 10000 });
  await input.fill(field.value);

  const actualValue = await input.inputValue();

  switch (field.inputType) {
    case "number":
      expect(actualValue).toMatch(/^\d+$/);
      break;

    case "email":
      expect(actualValue).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      break;

    case "url":
      expect(actualValue).toMatch(/^https?:\/\/.+/);
      break;

    case "string":
    default:
      expect(typeof actualValue).toBe("string");
      expect(actualValue.length).toBeGreaterThan(0);
      break;
  }
}

async function checkTextVisibleOrLog(page: Page, text: string) {
  const locator = page.getByText(text);

  try {
    await expect(locator).toBeVisible({ timeout: 3000 });
    console.log(`พบข้อความ: ${text}`);
  } catch {
    console.warn(`ไม่พบข้อความ: ${text}`);
  }
}

async function saveReport(page: Page) {
  // กดปุ่มบันทึกหลักของหน้า
  await expect(page.locator("#admin-report-save")).toBeVisible({
    timeout: 10000,
  });

  await page.locator("#admin-report-save").click();

  // ตรวจว่า SweetAlert ยืนยันขึ้น
  await expect(page.getByText("ยืนยันการบันทึกข้อมูล")).toBeVisible({
    timeout: 10000,
  });

  // กดปุ่มบันทึกใน SweetAlert
  await page.getByRole("button", { name: "บันทึก" }).click();

  // ตรวจข้อความสำเร็จ
  await expect(page.getByText("บันทึกข้อมูลเสร็จสิ้น")).toBeVisible({
    timeout: 10000,
  });
}

async function fillDictionaryRow(
  page: Page,
  index: number,
  row: DictionaryRowTestData,
) {
  await fillAndValidateDictInput(
    page,
    `[data-testid="dict-column-name-${index}"]`,
    row.columnName,
  );

  await fillAndValidateDictInput(
    page,
    `[data-testid="dict-data-type-${index}"]`,
    row.dataType,
  );

  await fillAndValidateDictInput(
    page,
    `[data-testid="dict-size-value-${index}"]`,
    row.sizeValue,
  );

  await fillAndValidateDictInput(
    page,
    `[data-testid="dict-description-${index}"]`,
    row.description,
  );

  await fillAndValidateDictInput(
    page,
    `[data-testid="dict-sample-data-${index}"]`,
    row.sampleData,
  );

  await setDictionaryRequired(page, index, row.required);
}

async function fillAndValidateDictInput(
  page: Page,
  selector: string,
  field: DictInputField,
) {
  const input = page.locator(selector);

  await expect(input).toBeVisible({ timeout: 10000 });
  await input.fill(field.value);

  const actualValue = await input.inputValue();

  // เช็ค maxLength
  expect(actualValue.length).toBeLessThanOrEqual(field.maxLength);

  // เช็ค type
  switch (field.inputType) {
    case "number":
      expect(actualValue).toMatch(/^\d+$/);
      break;

    case "email":
      expect(actualValue).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      break;

    case "url":
      expect(actualValue).toMatch(/^https?:\/\/.+/);
      break;

    case "string":
    default:
      expect(typeof actualValue).toBe("string");
      expect(actualValue.length).toBeGreaterThan(0);
      break;
  }

  await expect(input).toHaveValue(actualValue);
}

async function mReportPart1(page: Page) {
  await selectAntdOptionByText(
    page,
    "#admin-report-add-category",
    reportStep1Data.categoryTitle,
  );

  await selectAntdOptionByText(
    page,
    "#admin-report-add-main",
    reportStep1Data.mainTitle,
  );

  await selectAntdOptionByText(
    page,
    "#admin-report-add-sub",
    reportStep1Data.subTitle,
  );

  await selectAntdOptionByText(
    page,
    "#admin-report-add-status",
    reportStep1Data.statusTitle,
  );

  await page.locator("#admin-report-add-date").click();
  await page.locator(`[title="${reportStep1Data.publishDateTitle}"]`).click();

  await fillAndExpect(
    page,
    "#admin-report-add-name",
    randomText(reportStep1Data.reportNamePrefix),
  );
}

// async function mReportPart2(page: Page) {
//   await page.locator("#admin-report-step-1-next").click();
//   await page.waitForTimeout(300);

//   await fillSingleSelectOther(page, "#admin-report-type", metadataTypeData.record);

//   await fillMetadataInput(page, commonMetadataInputData.datasetName);

//   await fillSingleSelectOther(page, "#admin-report-org", organizationData);

//   await fillMetadataInput(page, commonMetadataInputData.contactName);
//   await fillMetadataInput(page, commonMetadataInputData.contactEmail);
//   await fillMetadataInput(page, commonMetadataInputData.keyword);
//   await fillMetadataInput(page, commonMetadataInputData.description);

//   await fillMultiSelectOtherAndDetail(
//     page,
//     "#admin-report-objective",
//     objectiveData,
//     (value) => `#admin-report-objective-other-${value}`,
//     (value) => `#admin-report-objective-detail-${value}`,
//   );

//   await fillSingleSelectOther(
//     page,
//     "#admin-report-freq-unit",
//     updateFrequencyUnitData,
//   );

//   await fillMetadataInput(page, commonMetadataInputData.updateFrequencyValue);

//   await fillSingleSelectOther(
//     page,
//     "#admin-report-geo-scope",
//     geoCoverageData,
//   );

//   await fillMetadataInput(page, commonMetadataInputData.source);

//   await fillMultiSelectOther(page, "#admin-report-format", dataFormatData);

//   await fillSingleSelectOther(
//     page,
//     "#admin-report-governance",
//     dataGovernanceData,
//   );

//   await fillSingleSelectOther(page, "#admin-report-license", licenseData);

//   await fillMetadataInput(page, commonMetadataInputData.accessCondition);

//   await fillMetadataInput(page, commonMetadataInputData.url);

//   await fillMultiSelectOtherAndDetail(
//     page,
//     "#admin-report-sponsor",
//     sponsorData,
//     (value) => `#admin-report-sponsor-other-${value}`,
//     (value) => `#admin-report-sponsor-detail-${value}`,
//   );

//   await fillSingleSelectOther(
//     page,
//     "#admin-report-smallest-unit",
//     smallestUnitData,
//   );

//   await fillMultiSelectOther(page, "#admin-report-language", languageData);

//   await setSwitch(
//     page,
//     "admin-report-high-value-dataset",
//     commonMetadataInputData.highValueDataset,
//   );

//   await setSwitch(
//     page,
//     "admin-report-reference-data",
//     commonMetadataInputData.referenceData,
//   );
// }

// async function mReportPart3(page: Page) {
//   await page.locator("#admin-report-step-2-next").click();
//   await delay(page, 50);

//   await expect(page.getByText("3. Data Dictionary", { exact: true })).toBeVisible({
//     timeout: 10000,
//   });

//   for (let i = 0; i < dictionaryRows.length; i++) {
//     if (i > 0) {
//       await page.locator("#admin-report-add-dict-row").click();

//       await expect(page.getByTestId(`dict-column-name-${i}`)).toBeVisible({
//         timeout: 10000,
//       });
//     }

//     await fillDictionaryRow(page, i, dictionaryRows[i]);
//   }

//   await saveReport(page);
// }

async function mReportPart3(page: Page) {
  await expect(page.locator("#admin-report-step-2-next")).toBeVisible({
    timeout: 10000,
  });

  await page.locator("#admin-report-step-2-next").click();
  await page.waitForTimeout(0);

  const dataDictionaryTitle = page.getByText("3. Data Dictionary", {
    exact: true,
  });

  const isStep3Visible = await dataDictionaryTitle
    .isVisible()
    .catch(() => false);

  if (!isStep3Visible) {
    const errors = page.locator(".ant-form-item-explain-error");
    const errorTexts = await errors.allTextContents();

    throw new Error(
      [
        "ไม่สามารถไป Step 3: Data Dictionary ได้",
        "",
        "Validation errors ที่พบ:",
        errorTexts.length > 0
          ? errorTexts.map((x) => `- ${x}`).join("\n")
          : "- ไม่พบข้อความ validation บนหน้าจอ",
      ].join("\n"),
    );
  }

  await expect(dataDictionaryTitle).toBeVisible({
    timeout: 10000,
  });

  for (let i = 0; i < dictionaryRows.length; i++) {
    if (i > 0) {
      await page.locator("#admin-report-add-dict-row").click();

      await expect(page.getByTestId(`dict-column-name-${i}`)).toBeVisible({
        timeout: 10000,
      });
    }

    await fillDictionaryRow(page, i, dictionaryRows[i]);
  }

  await saveReport(page);
}
async function mReportPart2(page: Page) {
  await page.locator("#admin-report-step-1-next").click();
  await page.waitForTimeout(0);

  await fillMetadataType(page, metadataTypeData.record);

  await fillCommonMetadataInputs(page);
  await fillCommonMetadataSelects(page);

  await fillRecordSpecificFields(page);
}



test.describe("Manage Report Page", () => {
  test.beforeEach(async ({ page }) => {
    await mLogin(page);

    await expect(page).toHaveURL(/.*manage\/admin-report/);
  });






  // test("Scenario 1: happy case กรอกข้อมูลครบทุก field เลือกอื่น ๆ แล้วบันทึกสำเร็จ", async ({
  //   page,
  // }) => {
  //   test.setTimeout(120000);

  //   await mReportPart1(page);
  //   await mReportPart2(page);
  //   await mReportPart3(page);
  // });

  // test("Scenario 2: ตรวจสอบ maxLength ของ input ใน Metadata", async ({
  //   page,
  // }) => {
  //   await goToMetadataStep(page);

  //   // ต้องเลือกประเภทข้อมูลก่อน เพราะบาง input จะแสดงตาม type
  //   await fillSingleSelectOther(page, "#admin-report-type", typeData);

  //   await page.waitForTimeout(300);

  //   const fields = getMetadataInputFields();

  //   for (const field of fields) {
  //     await checkInputMaxLength(page, field);
  //   }
  // });

  // test("Scenario 3: ตรวจสอบ type การกรอกข้อมูล string / number / email / url และ Data Dictionary", async ({
  //   page,
  // }) => {
  //   test.setTimeout(120000);

  //   await goToMetadataStep(page);

  //   // ต้องเลือกประเภทข้อมูลก่อน เพราะบาง field ใน Metadata จะแสดงหลังเลือก type
  //   await fillSingleSelectOther(page, "#admin-report-type", typeData);

  //   // ตรวจ type ของ Metadata input
  //   const fields = getMetadataInputFields();

  //   for (const field of fields) {
  //     await checkInputType(page, field);
  //   }

  //   // กรอก field อื่น ๆ ที่จำเป็นใน Metadata ให้ครบก่อน เพื่อไป Step 3 ได้
  //   await fillSingleSelectOther(page, "#admin-report-org", organizationData);

  //   await fillMultiSelectOtherAndDetail(
  //     page,
  //     "#admin-report-objective",
  //     objectiveData,
  //     (value) => `#admin-report-objective-other-${value}`,
  //     (value) => `#admin-report-objective-detail-${value}`,
  //   );

  //   await fillSingleSelectOther(
  //     page,
  //     "#admin-report-freq-unit",
  //     update_frequency_unitData,
  //   );

  //   await fillSingleSelectOther(
  //     page,
  //     "#admin-report-geo-scope",
  //     geo_coverageData,
  //   );

  //   await fillMultiSelectOther(page, "#admin-report-format", data_formatData);

  //   await fillSingleSelectOther(
  //     page,
  //     "#admin-report-governance",
  //     data_governanceData,
  //   );

  //   await fillSingleSelectOther(page, "#admin-report-license", licenseData);

  //   await fillMultiSelectOtherAndDetail(
  //     page,
  //     "#admin-report-sponsor",
  //     sponsorData,
  //     (value) => `#admin-report-sponsor-other-${value}`,
  //     (value) => `#admin-report-sponsor-detail-${value}`,
  //   );

  //   await fillSingleSelectOther(
  //     page,
  //     "#admin-report-smallest-unit",
  //     smallest_unitData,
  //   );

  //   await fillMultiSelectOther(page, "#admin-report-language", languageData);

  //   await setSwitch(
  //     page,
  //     "admin-report-high-value-dataset",
  //     metadataBasicData.highValueDataset,
  //   );

  //   await setSwitch(
  //     page,
  //     "admin-report-reference-data",
  //     metadataBasicData.referenceData,
  //   );

  //   // ไป Step 3 Data Dictionary
  //   await page.locator("#admin-report-step-2-next").click();

  //   await expect(page.getByText("3. Data Dictionary", { exact: true })).toBeVisible({
  //     timeout: 10000,
  //   });

  //   // ตรวจ type ของ Data Dictionary
  //   for (let i = 0; i < dictionaryRows.length; i++) {
  //     if (i > 0) {
  //       await page.locator("#admin-report-add-dict-row").click();

  //       await expect(page.getByTestId(`dict-column-name-${i}`)).toBeVisible({
  //         timeout: 10000,
  //       });
  //     }

  //     await checkDictionaryRowType(page, i, dictionaryRows[i]);
  //   }
  // });

  // test("Scenario 4: ตรวจ validation Step 1 เมื่อกดถัดไปโดยไม่กรอกข้อมูล", async ({
  //   page,
  // }) => {
  //   await page.locator("#admin-report-step-1-next").click();

  //   await page.waitForTimeout(300);

  //   await expectValidationMessagesIfAvailable(page, [
  //     "กรุณาเลือกกลุ่มข้อมูลรายงาน",
  //     "กรุณาเลือกกลุ่มรายงาน",
  //     "กรุณาเลือกชุดข้อมูลรายงาน",
  //     "กรุณาเลือกสถานะ",
  //     "กรุณาเลือกวันที่",
  //     "กรุณากรอกชื่อรายงาน",
  //   ]);
  // });

  // test("Scenario 5: ตรวจ validation ของ Metadata เมื่อกดถัดไปโดยไม่กรอกข้อมูล", async ({
  //   page,
  // }) => {
  //   await goToMetadataStep(page);



  //   await page.locator("#admin-report-step-2-next").click();

  //   await page.waitForTimeout(300);

  //   await expectValidationMessagesIfAvailable(page, [
  //     "กรุณาเลือกประเภทข้อมูล",
  //     "กรุณากรอกชื่อชุดข้อมูล",
  //     "กรุณาเลือกองค์กร",
  //     "กรุณากรอกชื่อผู้ติดต่อ",
  //     "กรุณากรอกอีเมลผู้ติดต่อ",
  //     "กรุณากรอกรายละเอียด",
  //     "กรุณาเลือกวัตถุประสงค์",
  //   ]);
  // });

  // -------------
  test("Scenario 1: happy case ข้อมูลระเบียน", async ({ page }) => {
    test.setTimeout(120000);

    await mReportPart1(page);
    await mReportPart2(page);
    await mReportPart3(page);
  });

  test("Scenario 6: happy case ข้อมูลสถิติ และตรวจรูปแบบวันที่", async ({ page }) => {
    test.setTimeout(120000);

    await mReportPart1(page);

    await page.locator("#admin-report-step-1-next").click();

    await fillMetadataType(page, metadataTypeData.statistic);

    await fillCommonMetadataInputs(page);
    await fillCommonMetadataSelects(page);

    // ข้อมูลสถิติมี field นี้ ต้องกรอก
    await fillMetadataInput(page, commonMetadataInputData.accessCondition);
    await fillDateAndCheckFormat(page, statisticMetadataData.startDataYear);
    await fillDateAndCheckFormat(page, statisticMetadataData.latestPublishedYear);
    await fillDateAndCheckFormat(page, statisticMetadataData.publishedDate);
    await fillMultiSelectOther(
      page,
      "#admin-report-classification",
      statisticMetadataData.classificationData,
    );

    await fillMetadataInput(page, statisticMetadataData.measureUnit);

    await fillSingleSelectOther(
      page,
      "#admin-report-multiplier-unit",
      statisticMetadataData.multiplierUnit,
    );

    await fillMetadataInput(page, statisticMetadataData.calculationMethod);
    await fillMetadataInput(page, statisticMetadataData.dataStandard);
    await fillMetadataInput(page, statisticMetadataData.url);

    await fillMultiSelectOther(
      page,
      "#admin-report-language",
      statisticMetadataData.languageData,
    );

    await setSwitch(
      page,
      "admin-report-official-statistic",
      statisticMetadataData.officialStatistic,
    );

    await mReportPart3(page);
  });

  test("Scenario 7: happy case ข้อมูลภูมิสารสนเทศเชิงพื้นที่ และตรวจรูปแบบวันที่", async ({ page }) => {
    test.setTimeout(120000);

    await mReportPart1(page);

    await page.locator("#admin-report-step-1-next").click();

    await fillMetadataType(page, metadataTypeData.geoSpatial);

    await fillCommonMetadataInputs(page);
    await fillCommonMetadataSelects(page);

    await fillSingleSelectOther(
      page,
      "#admin-report-geographic-dataset",
      geoSpatialMetadataData.geographicDataset,
    );

    await fillMultiSelectOther(
      page,
      "#admin-report-map-scale",
      geoSpatialMetadataData.mapScaleData,
    );

    await fillMetadataInput(page, geoSpatialMetadataData.westBoundLongitude);
    await fillMetadataInput(page, geoSpatialMetadataData.eastBoundLongitude);
    await fillMetadataInput(page, geoSpatialMetadataData.northBoundLatitude);
    await fillMetadataInput(page, geoSpatialMetadataData.southBoundLatitude);
    await fillMetadataInput(page, geoSpatialMetadataData.positionalAccuracy);

    await fillDateAndCheckFormat(page, geoSpatialMetadataData.referenceTime);
    await fillDateAndCheckFormat(page, geoSpatialMetadataData.scheduledPublishedDateTime);
    await fillDateAndCheckFormat(page, geoSpatialMetadataData.publishedDate);

    await fillMetadataInput(page, geoSpatialMetadataData.url);

    await fillMultiSelectOther(
      page,
      "#admin-report-language",
      geoSpatialMetadataData.languageData,
    );

    await mReportPart3(page);
  });

  // test("Scenario 8: happy case ข้อมูลประเภทอื่น ๆ ระบุ", async ({ page }) => {
  //   test.setTimeout(120000);

  //   await mReportPart1(page);

  //   await page.locator("#admin-report-step-1-next").click();

  //   await fillMetadataType(page, metadataTypeData.other);

  //   await fillCommonMetadataInputs(page);
  //   await fillCommonMetadataSelects(page);

  //   await mReportPart3(page);
  // });

  test("Scenario 9: happy case ข้อมูลหลากหลายประเภท เห็นเฉพาะ field พื้นฐานแล้วบันทึกสำเร็จ", async ({
    page,
  }) => {
    test.setTimeout(120000);

    await mReportPart1(page);

    await page.locator("#admin-report-step-1-next").click();
    await page.waitForTimeout(300);

    await fillMetadataType(page, metadataTypeData.multiple);

    await fillCommonMetadataInputs(page);
    await fillCommonMetadataSelects(page);

    // ข้อมูลหลากหลายประเภทไม่เห็น highValueDataset/referenceData
    await fillCommonSwitchesIfVisible(page);

    await mReportPart3(page);
  });

  test("Scenario 10: happy case ข้อมูลประเภทอื่น ๆ ระบุ เห็น field พื้นฐานและกรอกชื่อประเภทข้อมูล", async ({
    page,
  }) => {
    test.setTimeout(120000);

    await mReportPart1(page);

    await page.locator("#admin-report-step-1-next").click();
    await page.waitForTimeout(300);

    // ประเภทข้อมูล = ข้อมูลประเภทอื่น ๆ ระบุ...
    // helper นี้จะกรอก #admin-report-custom-type-name ให้ด้วย
    await fillMetadataType(page, metadataTypeData.other);

    await fillCommonMetadataInputs(page);
    await fillCommonMetadataSelects(page);
    await fillCommonSwitchesIfVisible(page);

    await mReportPart3(page);
  });


});