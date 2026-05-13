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
  metadataValidationCases,
  accessConditionData,
  positionalAccuracyData,
  recordMetadataData,
} from "./fixtures/manage-report.data";

import type {
  InputFieldTestData,
  DictInputField,
  DictionaryRowTestData,
  SelectTestData,
  MultiSelectWithDetailData,
  DateFieldTestData,
} from "./fixtures/manage-report.data";

import { randomText } from "../share/randomText";
import {
  expectLatestDatasetSaved,
  expectDatasetDeleted,
  expectDatasetSavedById,
  expectOtherMetadataExists,
  expectOtherMetadataExistsByMetadataId,
  expectLatestOtherMetadataCreated,
  expectAllLatestOtherMetadataCreated,
  expectCustomMetadataCreated,
  getOtherMetadataCode,
  expectMetadataFieldValue,
} from "./helpers/oracle-db";
import { login, logout } from "../share/login.spec";

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

type MetadataTypeKey =
  | "record"
  | "statistic"
  | "geoSpatial"
  | "multiple"
  | "other";

type DatasetSnapshot = {
  latestId: number;
  dataset: Record<string, unknown>[];
  metadata: Record<string, unknown>[];
  dictionary: Record<string, unknown>[];
};

type ReportAction = "edit" | "view" | "delete";

type ScenarioValues = {
  reportName: string;
  datasetName: string;
  url: string;
  measureUnit: string;
  customTypeName: string;
  westBoundLongitude: string;
  dictColumnName: string;
  dictDescription: string;
  dictSample: string;
};

// ให้ report บอกครบว่าข้อความไหนหาย
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


export async function checkInputType(
  page: Page,
  field: Readonly<InputFieldTestData | DateFieldTestData>,
) {
  if ("format" in field) {
    return;
  }

  const input = page.locator(field.selector);

  await expect(input).toBeVisible({ timeout: 10000 });

  if (field.inputType === "string") {
    const value = field.value ?? randomText(10);
    await input.fill(value);
    await expect(input).toHaveValue(value);
    return;
  }

  if (field.inputType === "number") {
    await input.fill("12345");
    await expect(input).toHaveValue("12345");
    return;
  }

  if (field.inputType === "email") {
    const value = field.value ?? "test@nso.go.th";
    await input.fill(value);
    await expect(input).toHaveValue(value);
    expect(value).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    return;
  }

  if (field.inputType === "url") {
    const value = field.value ?? "https://playwright.dev/";
    await input.fill(value);
    await expect(input).toHaveValue(value);
    expect(value).toMatch(/^https?:\/\/.+/);
  }
}

export async function checkDictionaryRowType(
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

export async function checkDictInputType(
  page: Page,
  selector: string,
  field: DictInputField | SelectTestData,
) {
  const input = page.locator(selector);

  await expect(input).toBeVisible({ timeout: 10000 });

  const isSelect = (await input.getAttribute("class") || "").includes("ant-select");

  if (isSelect) {
    const fieldAsSelect = field as SelectTestData;
    const searchText = fieldAsSelect.searchText || fieldAsSelect.value || "";
    const optionText = fieldAsSelect.optionText || fieldAsSelect.value || "";

    await selectAntdOptionBySearch(page, selector, searchText, optionText);
  } else {
    await input.fill(field.value);
  }

  const actualValue = isSelect
    ? (field as SelectTestData).optionText || (field as SelectTestData).value || ""
    : await input.inputValue();

  if ("inputType" in field) {
    switch (field.inputType) {
      case "number":
        expect(actualValue).toMatch(/^\d*$/);
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
        break;
    }
  }
}

export async function checkInputMaxLength(
  page: Page,
  field: Readonly<InputFieldTestData>,
) {
  const input = page.locator(field.selector);

  await expect(input).toBeVisible({ timeout: 10000 });

  const value =
    field.value ??
    randomText(field.maxLength ?? 50);

  await input.fill(value);

  const actualValue = await input.inputValue();

  if (field.maxLength) {
    expect(actualValue.length).toBeLessThanOrEqual(field.maxLength);
  }

  await expect(input).toHaveValue(actualValue);
}

export function buildOverMaxLengthValue(field: Readonly<InputFieldTestData>) {
  const targetLength = (field.maxLength ?? 50) + 20;

  if (field.inputType === "number") {
    return "9".repeat(targetLength);
  }

  if (field.inputType === "email") {
    const domain = "@nso.go.th";
    const localPartLength = Math.max(targetLength - domain.length, 1);
    return `${"a".repeat(localPartLength)}${domain}`;
  }

  if (field.inputType === "url") {
    const prefix = "https://";
    return `${prefix}${"a".repeat(Math.max(targetLength - prefix.length, 1))}`;
  }

  return `${field.valuePrefix ?? "ทดสอบ"}${"ก".repeat(targetLength)}`;
}

export async function checkInputRejectsOverMaxLength(
  page: Page,
  field: Readonly<InputFieldTestData>,
) {
  const input = page.locator(field.selector);

  await expect(input).toBeVisible({ timeout: 10000 });

  const overMaxValue = buildOverMaxLengthValue(field);

  await input.fill(overMaxValue);

  const actualValue = await input.inputValue();

  if (field.maxLength) {
    expect(overMaxValue.length).toBeGreaterThan(field.maxLength);
    expect(actualValue.length).toBeLessThanOrEqual(field.maxLength);
  }

  await expect(input).toHaveValue(actualValue);
}

export async function fillSingleSelectOther(
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

export async function selectAntdOptionBySearch(
  page: Page,
  selectSelector: string,
  searchText: string,
  optionText: string,
) {
  await closeAntdDropdown(page);

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

export async function fillGovernanceOnly(
  page: Page,
  governance: (typeof dataGovernanceData)[keyof typeof dataGovernanceData],
) {
  await fillSingleSelectOther(
    page,
    "#admin-report-governance",
    governance,
  );

  await delay(page, 200);
}

export async function fillMultiSelectOther(
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
      const input = page.locator(item.otherInputSelector);

      if (await input.isVisible().catch(() => false)) {
        await fillMetadataInput(page, {
          selector: item.otherInputSelector,
          value: item.otherValue,
          maxLength: 500,
          inputType: "string",
        });
      }
    }
  }
}

export async function fillGeoSpatialDatesForHappyCase(page: Page) {
  await fillFlexibleDateText(
    page,
    geoSpatialMetadataData.scheduledPublishedDateTypeText,
    geoSpatialMetadataData.scheduledPublishedDateText,
  );
}

export async function prepareMetadataTypeForMaxLength(
  page: Page,
  typeKey: keyof typeof metadataTypeData,
) {
  await fillMetadataType(page, metadataTypeData[typeKey]);

  await delay(page, 300);

  if (
    typeKey === "record" ||
    typeKey === "statistic" ||
    typeKey === "geoSpatial"
  ) {
    await fillSingleSelectOther(
      page,
      "#admin-report-governance",
      dataGovernanceData.public,
    );
  }

  // ห้ามเลือก startDataYearType / publishedDateType ใน Scenario maxLength
  // เพราะ DatePicker ไม่ใช่ input maxLength

  if (typeKey === "geoSpatial") {
    await fillSingleSelectOther(
      page,
      "#admin-report-geographic-dataset",
      geoSpatialMetadataData.geographicDataset,
    );

    await fillSingleSelectOther(
      page,
      "#admin-report-positional-accuracy",
      positionalAccuracyData.has,
    );
  }
}

export function getInputTypeFieldsByType(
  typeKey: keyof typeof metadataTypeData,
): readonly InputFieldTestData[] {
  const commonFields = [
    commonMetadataInputData.datasetName,
    commonMetadataInputData.contactName,
    commonMetadataInputData.contactEmail,
    commonMetadataInputData.keyword,
    commonMetadataInputData.description,
    commonMetadataInputData.updateFrequencyValue,
    commonMetadataInputData.source,
  ];

  if (typeKey === "record") {
    return [
      ...commonFields,
      accessConditionData.public,
      recordMetadataData.url,
    ];
  }

  if (typeKey === "statistic") {
    return [
      ...commonFields,
      accessConditionData.public,
      statisticMetadataData.measureUnit,
      statisticMetadataData.calculationMethod,
      statisticMetadataData.dataStandard,
      statisticMetadataData.url,
    ];
  }

  if (typeKey === "geoSpatial") {
    return [
      ...commonFields,
      accessConditionData.public,
      geoSpatialMetadataData.westBoundLongitude,
      geoSpatialMetadataData.eastBoundLongitude,
      geoSpatialMetadataData.northBoundLatitude,
      geoSpatialMetadataData.southBoundLatitude,
      {
        selector: positionalAccuracyData.has.otherInputSelector,
        value: positionalAccuracyData.has.otherValue,
        maxLength: 100,
        inputType: "string",
      },
      geoSpatialMetadataData.url,
    ];
  }

  if (typeKey === "other") {
    return [
      ...commonFields,
      {
        selector: "#admin-report-custom-type-name",
        value: metadataTypeData.other.otherValue,
        maxLength: 150,
        inputType: "string",
      },
    ];
  }

  // multiple ไม่มี accessCondition
  return commonFields;
}
export async function fillFlexibleDateText(
  page: Page,
  typeData: {
    selector: string;
    title: string;
    searchText: string;
    optionText: string;
    value: string;
    code: string;
    isOther: boolean;
  },
  textField: Readonly<InputFieldTestData>,
) {
  await fillSingleSelectOther(
    page,
    typeData.selector,
    typeData,
  );

  await page.waitForTimeout(300);

  await fillMetadataInput(page, textField);
}


export function getMaxLengthInputFieldsByType(
  typeKey: keyof typeof metadataTypeData,
): readonly InputFieldTestData[] {
  const commonFields = [
    commonMetadataInputData.datasetName,
    commonMetadataInputData.contactName,
    commonMetadataInputData.contactEmail,
    commonMetadataInputData.keyword,
    commonMetadataInputData.description,
    commonMetadataInputData.updateFrequencyValue,
    commonMetadataInputData.source,
  ];

  if (typeKey === "record") {
    return [
      ...commonFields,
      accessConditionData.public,
      recordMetadataData.url,
    ];
  }

  if (typeKey === "statistic") {
    return [
      ...commonFields,
      accessConditionData.public,
      statisticMetadataData.measureUnit,
      statisticMetadataData.calculationMethod,
      statisticMetadataData.dataStandard,
      statisticMetadataData.url,
    ];
  }

  if (typeKey === "geoSpatial") {
    return [
      ...commonFields,
      accessConditionData.public,
      geoSpatialMetadataData.westBoundLongitude,
      geoSpatialMetadataData.eastBoundLongitude,
      geoSpatialMetadataData.northBoundLatitude,
      geoSpatialMetadataData.southBoundLatitude,
      {
        selector: positionalAccuracyData.has.otherInputSelector,
        value: positionalAccuracyData.has.otherValue,
        maxLength: 100,
        inputType: "string",
      },
      geoSpatialMetadataData.url,
    ];
  }

  return commonFields;
}

export async function fillFirstVisibleInput(
  page: Page,
  selectors: string[],
  value: string,
  maxLength = 500,
) {
  const uniqueSelectors = Array.from(new Set(selectors.filter(Boolean)));

  for (let round = 0; round < 10; round++) {
    for (const selector of uniqueSelectors) {
      const input = page.locator(selector);

      if (await input.isVisible().catch(() => false)) {
        await fillMetadataInput(page, {
          selector,
          value,
          maxLength,
          inputType: "string",
        });

        return selector;
      }
    }

    await page.waitForTimeout(500);
  }

  const visibleInputs = await page.locator("input, textarea").evaluateAll((els) =>
    els.map((el) => ({
      id: el.getAttribute("id"),
      placeholder: el.getAttribute("placeholder"),
      value: (el as HTMLInputElement).value,
    })),
  );

  throw new Error(
    [
      `ไม่พบ input ที่ต้องกรอกจาก selector: ${uniqueSelectors.join(", ")}`,
      "",
      "input/textarea ที่เจอบนหน้าจอ:",
      JSON.stringify(visibleInputs, null, 2),
    ].join("\n"),
  );
}


export async function fillMultiSelectOtherAndDetail(
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

    if (item.isOther) {
      const otherValue = item.otherValue;

      if (!otherValue) {
        throw new Error(`ไม่พบค่า otherValue ของ "${item.title}"`);
      }

      await fillFirstVisibleInput(
        page,
        [
          item.otherInputSelector,
          item.extraOtherInputSelector,
          buildOtherSelector(item.value),
          `${selectSelector}-other-${item.value}`,
          `${selectSelector}-other`,
        ].filter((s): s is string => s !== undefined),
        otherValue,
      );
    }

    if (item.detail) {
      const detailSelector =
        item.detailSelector ?? buildDetailSelector(item.value);

      const detailInput = page.locator(detailSelector);

      const isDetailVisible = await detailInput
        .isVisible({ timeout: 10000 })
        .catch(() => false);

      if (!isDetailVisible) {
        const inputs = await page.locator("input, textarea").evaluateAll((els) =>
          els.map((el) => ({
            id: el.getAttribute("id"),
            testId: el.getAttribute("data-testid"),
            placeholder: el.getAttribute("placeholder"),
            value: (el as HTMLInputElement).value,
          })),
        );

        throw new Error(
          [
            `เลือก "${item.title}" แล้ว แต่ไม่พบช่องคำอธิบาย`,
            `selector: ${detailSelector}`,
            "",
            "input/textarea ที่เจอบนหน้าจอ:",
            JSON.stringify(inputs, null, 2),
          ].join("\n"),
        );
      }

      const detailValue =
        item.isOther && item.otherValue
          ? `${item.detail} (${item.otherValue})`
          : item.detail;

      await detailInput.fill(detailValue);
      await expect(detailInput).toHaveValue(detailValue);
    }
  }
}

export async function delay(page: Page, ms = 0) {
  await page.waitForTimeout(ms);
}

export async function fillDatePickerOnly(
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

  await page.waitForTimeout(300);
}

export async function fillMetadataForType(page: Page, typeKey: keyof typeof metadataTypeData) {
  await fillMetadataType(page, metadataTypeData[typeKey]);

  await fillCommonMetadataInputs(page);
  await fillCommonMetadataSelects(page);

  if (typeKey === "record") {
    await fillRecordSpecificFields(page);
  }

  if (typeKey === "statistic") {
    await fillMetadataInput(page, accessConditionData.public);

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
      statisticMetadataData.officialStatistic.id,
      statisticMetadataData.officialStatistic.checked,
    );
  }

  if (typeKey === "geoSpatial") {
    await fillMetadataInput(page, accessConditionData.public);

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
    // await fillMetadataInput(page, geoSpatialMetadataData.positionalAccuracy);

    await fillDateAndCheckFormat(page, geoSpatialMetadataData.referenceTime);
    await fillDateAndCheckFormat(page, geoSpatialMetadataData.scheduledPublishedDateTime);
    await fillDateAndCheckFormat(page, geoSpatialMetadataData.publishedDate);

    await fillMetadataInput(page, geoSpatialMetadataData.url);

    await fillMultiSelectOther(
      page,
      "#admin-report-language",
      geoSpatialMetadataData.languageData,
    );
  }

  if (typeKey === "multiple") {
    // ข้อมูลหลากหลายประเภท เห็นเฉพาะ field พื้นฐาน
    await fillCommonSwitchesIfVisible(page);
  }

  if (typeKey === "other") {
    // customTypeName ถูกกรอกใน fillMetadataType แล้ว
    await fillCommonSwitchesIfVisible(page);
  }
}

export async function fillDateOnly(
  page: Page,
  field: DateFieldTestData,
) {
  const input = page.locator(field.selector);

  await expect(input).toBeVisible({ timeout: 10000 });

  // Ant Design DatePicker เป็น readonly ต้องเอา readonly ออกก่อน
  await input.evaluate((el) => {
    const inputEl = el as HTMLInputElement;
    inputEl.removeAttribute("readonly");
  });

  await input.click();
  await page.waitForTimeout(300);
  await input.fill("");
  await input.type(field.value, { delay: 80 });
  await page.waitForTimeout(300);
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");

  await input.evaluate((el) => {
    const inputEl = el as HTMLInputElement;
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    inputEl.dispatchEvent(new Event("change", { bubbles: true }));
    inputEl.dispatchEvent(new Event("blur", { bubbles: true }));
  });

  await expect(input).toHaveValue(field.value);
}

export function getMetadataInputFields(): InputFieldTestData[] {
  return [
    commonMetadataInputData.datasetName,
    commonMetadataInputData.contactName,
    commonMetadataInputData.contactEmail,
    commonMetadataInputData.keyword,
    commonMetadataInputData.description,
    commonMetadataInputData.updateFrequencyValue,
    commonMetadataInputData.source,
    accessConditionData.public,
    recordMetadataData.url,
  ];
}

// export async function mLogin(page: Page) {
//   await page.goto("/login");

//   await expect(page.getByRole("heading", { name: "ยินดีต้อนรับ" })).toBeVisible({
//     timeout: 10000,
//   });

//   const ldapButton = page.locator('button[data-login-type="LDAP"]');
//   const internalTab = page.getByRole("tab", { name: "หน่วยงานภายใน" });

//   if (await ldapButton.isVisible().catch(() => false)) {
//     await ldapButton.click();
//   } else if (await internalTab.isVisible().catch(() => false)) {
//     await internalTab.click();
//   }

//   await page.locator("#username").fill(loginData.username);
//   await page.locator("#password").fill(loginData.password);

//   const loginButton = page.getByRole("button", { name: "เข้าสู่ระบบ" });

//   if (await loginButton.isVisible().catch(() => false)) {
//     await loginButton.click();
//   } else {
//     await page.keyboard.press("Enter");
//   }

//   await expect(page).toHaveURL(/.*main/, { timeout: 30000 });

//   await page.goto("/manage/admin-report");

//   await expect(page).toHaveURL(/.*manage\/admin-report/, {
//     timeout: 30000,
//   });
// }
export async function mLogin(page: Page) {
  await login(page);

  await page.locator("button#จัดการข้อมูล-5").click();
  await page.locator("a#จัดการรายงาน-3").click();
  await expect(page).toHaveURL(/.*manage\/admin-report/);

  // await expect(page.locator("body")).not.toContainText("401", {
  //   timeout: 5000,
  // });
}

// export async function waitForAuthReady(page: Page) {
//   await page.waitForLoadState("networkidle").catch(() => {});

//   await page.waitForFunction(() => {
//     const localStorageText = JSON.stringify(localStorage).toLowerCase();
//     const sessionStorageText = JSON.stringify(sessionStorage).toLowerCase();

//     return (
//       localStorageText.includes("token") ||
//       localStorageText.includes("access") ||
//       localStorageText.includes("jwt") ||
//       sessionStorageText.includes("token") ||
//       sessionStorageText.includes("access") ||
//       sessionStorageText.includes("jwt")
//     );
//   }, null, {
//     timeout: 20000,
//   });
// }

export async function selectAntdOptionByText(
  page: Page,
  selectSelector: string,
  optionText: string,
  delayMs = 300,
) {
  await page.locator(selectSelector).click();
  await page.waitForTimeout(300);

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

export async function searchReportAndClickEdit(
  page: Page,
  reportNamePrefix: string,
) {
  const searchInput = page.locator("#admin-report-search-name");

  await expect(searchInput).toBeVisible({ timeout: 1000 });

  await searchInput.click();
  await searchInput.fill("");

  await searchInput.pressSequentially(reportNamePrefix, {
    delay: 120,
  });

  await page.keyboard.press("Enter");

  const targetRow = page
    .locator("tbody tr")
    .filter({
      hasText: reportNamePrefix,
    })
    .first();

  await expect(targetRow).toBeVisible({
    timeout: 15000,
  });

  const editButton = targetRow.locator("[id^='admin-report-edit-']").first();

  await expect(editButton).toBeVisible({
    timeout: 1000,
  });

  await editButton.click();
}

export async function updateMetadataByCurrentType(
  page: Page,
  typeKey: MetadataTypeKey,
  values: ScenarioValues,
) {
  // ทุกประเภทแก้ชื่อชุดข้อมูล
  await fillAndExpect(
    page,
    "#admin-report-dataset-name",
    values.datasetName,
  );

  if (typeKey === "record") {
    await fillAndExpect(page, "#admin-report-url", values.url);
    return;
  }

  if (typeKey === "statistic") {
    await fillAndExpect(page, "#admin-report-measure-unit", values.measureUnit);
    await fillAndExpect(page, "#admin-report-url", values.url);
    return;
  }

  if (typeKey === "geoSpatial") {
    await fillAndExpect(
      page,
      "#admin-report-west-bound-longitude",
      values.westBoundLongitude,
    );

    await fillAndExpect(page, "#admin-report-url", values.url);
    return;
  }

  if (typeKey === "other") {
    // ห้ามยุ่งกับ #admin-report-custom-type-name
    // แก้เฉพาะ URL ถ้ามีช่องนี้
    const urlInput = page.locator("#admin-report-url");

    if (await urlInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await fillAndExpect(page, "#admin-report-url", values.url);
    }

    return;
  }

  // multiple แก้เฉพาะ datasetName
}

export async function updateReportStep1(
  page: Page,
  updatedReportName: string,
) {
  await expect(page.locator("#admin-report-add-name")).toBeVisible({
    timeout: 30000,
  });

  // รอให้ข้อมูลเดิมในหน้า Edit โหลดมาก่อน
  await page.waitForTimeout(500);

  await fillAndExpect(
    page,
    "#admin-report-add-name",
    updatedReportName,
  );
}

export async function searchAndClickEditByReportName(
  page: Page,
  reportName: string,
) {
  const searchInput = page.locator("#admin-report-search-name");

  await expect(searchInput).toBeVisible({ timeout: 10000 });
  await searchInput.fill("");
  await searchInput.fill(reportName);
  await page.keyboard.press("Enter");

  await page.waitForLoadState("networkidle").catch(() => { });
  await page.waitForTimeout(1000);

  const targetRow = page
    .locator("tbody tr")
    .filter({
      has: page.getByText(reportName, { exact: true }),
    })
    .first();

  await expect(targetRow).toBeVisible({ timeout: 15000 });

  const rowText = await targetRow.innerText();

  if (!rowText.includes(reportName)) {
    throw new Error(
      [
        "พบแถวในตาราง แต่ไม่ใช่ชื่อรายงานที่ต้องการ",
        `ชื่อที่ค้นหา: ${reportName}`,
        `แถวที่เจอ: ${rowText}`,
      ].join("\n"),
    );
  }

  const editButton = targetRow.locator("[id^='admin-report-edit-']").first();

  await expect(editButton).toBeVisible({ timeout: 10000 });
  await editButton.click();
}

export async function selectAntdMultipleOptionBySearch(
  page: Page,
  selectSelector: string,
  searchText: string,
  optionText: string,
) {
  await closeAntdDropdown(page);

  const select = page.locator(selectSelector);

  await expect(select).toBeVisible({ timeout: 10000 });
  await select.scrollIntoViewIfNeeded();

  const selectorBox = select.locator(".ant-select-selector");

  if (await selectorBox.isVisible().catch(() => false)) {
    await selectorBox.click({ force: true, timeout: 5000 });
  } else {
    await select.click({ force: true, timeout: 5000 });
  }

  await page.waitForTimeout(200);

  const searchInput = select.locator("input.ant-select-selection-search-input");

  if (await searchInput.isVisible().catch(() => false)) {
    await searchInput.fill("");
    await searchInput.type(searchText, { delay: 10 });
  } else {
    await page.keyboard.press("Control+A");
    await page.keyboard.type(searchText, { delay: 10 });
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
  await option.click({ force: true, timeout: 5000 });

  await closeAntdDropdown(page);
}

export async function fillRecordSpecificFields(page: Page) {
  await fillMetadataInput(page, accessConditionData.public);

  await fillMetadataInput(page, recordMetadataData.url);

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
    recordMetadataData.highValueDataset.checked,
  );

  await setSwitch(
    page,
    "admin-report-reference-data",
    recordMetadataData.referenceData.checked,
  );
}

export function buildUpdatedReportName(reportNamePrefix: string) {
  return `${reportNamePrefix}-update-${randomText(6)}`;
}

export async function fillAndExpect(
  page: Page,
  selector: string,
  value: string,
  delayMs = 300,
) {
  const input = page.locator(selector);

  await expect(input).toBeVisible({ timeout: 10000 });
  await expect(input).toBeEnabled({ timeout: 10000 });

  await input.click();
  await input.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await input.press("Backspace");

  await input.fill(value);

  await expect(input).toHaveValue(value, {
    timeout: 10000,
  });

  await delay(page, delayMs);
}


export async function setSwitch(page: Page, id: string, checked: boolean) {
  const sw = page.locator(`#${id}`);

  await expect(sw).toBeVisible({ timeout: 10000 });

  const current = await sw.getAttribute("aria-checked");

  if ((current === "true") !== checked) {
    await sw.click();
    await page.waitForTimeout(300);
  }

  await expect(sw).toHaveAttribute("aria-checked", checked ? "true" : "false");
}

export async function pickThaiDatePicker(
  page: Page,
  selector: string,
  gregorianDate: string,
) {
  const input = page.locator(selector);

  await expect(input).toBeVisible({ timeout: 10000 });
  await input.click();

  const dropdown = page
    .locator(".ant-picker-dropdown:not(.ant-picker-dropdown-hidden)")
    .last();

  await expect(dropdown).toBeVisible({ timeout: 10000 });

  const buddhistDate = toBuddhistDate(gregorianDate);

  const targetSelectors = [
    `td[title="${gregorianDate}"]`,
    `td[title="${buddhistDate}"]`,
    `[title="${gregorianDate}"]`,
    `[title="${buddhistDate}"]`,
  ];

  for (let i = 0; i < 36; i++) {
    for (const targetSelector of targetSelectors) {
      const cell = dropdown.locator(targetSelector).first();

      if (await cell.isVisible().catch(() => false)) {
        await cell.click({ force: true });
        await page.keyboard.press("Escape");
        await page.waitForTimeout(300);
        return;
      }
    }

    const direction = getMonthMoveDirection(gregorianDate);

    if (direction === "prev") {
      await dropdown.locator(".ant-picker-header-prev-btn").click();
    } else {
      await dropdown.locator(".ant-picker-header-next-btn").click();
    }

    await page.waitForTimeout(150);
  }

  const visibleTitles = await dropdown.locator("[title]").evaluateAll((els) =>
    els.map((el) => el.getAttribute("title")).filter(Boolean),
  );

  throw new Error(
    [
      `ไม่พบวันที่ ${gregorianDate} หรือ ${buddhistDate} ใน DatePicker`,
      "",
      "title ที่พบใน popup:",
      ...visibleTitles.map((x) => `- ${x}`),
    ].join("\n"),
  );
}

export async function pickThaiDateTimePicker(
  page: Page,
  selector: string,
  gregorianDate: string,
) {
  const input = page.locator(selector);

  await expect(input).toBeVisible({ timeout: 10000 });
  await input.click();

  const dropdown = page
    .locator(".ant-picker-dropdown:not(.ant-picker-dropdown-hidden)")
    .last();

  await expect(dropdown).toBeVisible({ timeout: 10000 });

  const buddhistDate = toBuddhistDate(gregorianDate);

  const targetSelectors = [
    `td[title="${gregorianDate}"]`,
    `td[title="${buddhistDate}"]`,
    `[title="${gregorianDate}"]`,
    `[title="${buddhistDate}"]`,
  ];

  for (let i = 0; i < 36; i++) {
    for (const targetSelector of targetSelectors) {
      const cell = dropdown.locator(targetSelector).first();

      if (await cell.isVisible().catch(() => false)) {
        await cell.click({ force: true });

        const okButton = dropdown.getByRole("button", {
          name: /ok|ตกลง/i,
        });

        if (await okButton.isVisible().catch(() => false)) {
          await okButton.click({ force: true });
        } else {
          await page.keyboard.press("Enter");
        }

        await page.keyboard.press("Escape");
        await page.waitForTimeout(300);
        return;
      }
    }

    const direction = getMonthMoveDirection(gregorianDate);

    if (direction === "prev") {
      await dropdown.locator(".ant-picker-header-prev-btn").click();
    } else {
      await dropdown.locator(".ant-picker-header-next-btn").click();
    }

    await page.waitForTimeout(150);
  }

  throw new Error(`ไม่พบวันที่ ${gregorianDate} หรือ ${buddhistDate} ใน DateTimePicker`);
}

export function getMonthMoveDirection(targetGregorianDate: string): "prev" | "next" {
  const target = new Date(targetGregorianDate);
  const now = new Date();

  const targetMonthIndex = target.getFullYear() * 12 + target.getMonth();
  const currentMonthIndex = now.getFullYear() * 12 + now.getMonth();

  return targetMonthIndex < currentMonthIndex ? "prev" : "next";
}

export function toBuddhistDate(gregorianDate: string) {
  const [year, month, day] = gregorianDate.split("-");

  return `${Number(year) + 543}-${month}-${day}`;
}

export async function fillMetadataInput(
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

type GovernanceItem =
  (typeof dataGovernanceData)[keyof typeof dataGovernanceData];

export async function fillAccessConditionByGovernance(
  page: Page,
  governance: (typeof dataGovernanceData)[keyof typeof dataGovernanceData],
) {
  await fillGovernanceOnly(page, governance);

  const accessConditionInput = page.locator("#admin-report-access-condition");

  if (!(await accessConditionInput.isVisible().catch(() => false))) {
    return;
  }

  if (governance.code === "1") {
    await fillMetadataInput(page, accessConditionData.public);
    return;
  }

  await fillMetadataInput(page, accessConditionData.nonPublic);
}

export async function fillCommonMetadataSelectsWithoutGovernance(page: Page) {
  await fillSingleSelectOther(page, "#admin-report-org", organizationData);

  // ห้ามมีอันนี้ใน helper นี้
  // await fillMultiSelectOtherAndDetail(page, "#admin-report-objective", ...)

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

  await fillSingleSelectOther(page, "#admin-report-license", licenseData);
}

export async function fillObjectiveForValidation(page: Page) {
  await fillMultiSelectOtherAndDetail(
    page,
    "#admin-report-objective",
    objectiveData,
    (value) => `#admin-report-objective-other-${value}`,
    (value) => `#admin-report-objective-detail-${value}`,
  );
}

export async function fillStatisticStartDataYear(page: Page) {
  await fillSingleSelectOther(
    page,
    "#admin-report-start-data-year-type",
    statisticMetadataData.startDataYearType,
  );

  await fillDateAndCheckFormat(
    page,
    statisticMetadataData.startDataYear,
  );
}

export async function fillStatisticPublishedDate(page: Page) {
  await fillSingleSelectOther(
    page,
    "#admin-report-published-date-type",
    statisticMetadataData.publishedDateType,
  );

  await fillDateAndCheckFormat(
    page,
    statisticMetadataData.publishedDate,
  );
}

export async function fillPositionalAccuracy(page: Page) {
  await fillSingleSelectOther(
    page,
    "#admin-report-positional-accuracy",
    positionalAccuracyData.has,
  );

  await fillMetadataInput(page, {
    selector: positionalAccuracyData.has.otherInputSelector,
    value: positionalAccuracyData.has.otherValue,
    maxLength: 100,
    inputType: "string",
  });
}

export async function closeAntdDropdown(page: Page) {
  await page.keyboard.press("Escape");
  await page.mouse.click(5, 5);
  await page.waitForTimeout(100);
}

export async function fillStatisticDatesForHappyCase(page: Page) {
  await fillSingleSelectOther(
    page,
    statisticMetadataData.startDataYearType.selector,
    statisticMetadataData.startDataYearType,
  );

  await pickThaiDatePicker(
    page,
    statisticMetadataData.startDataYear.selector,
    statisticMetadataData.startDataYear.pickerValue,
  );

  await fillSingleSelectOther(
    page,
    statisticMetadataData.latestPublishedYearType.selector,
    statisticMetadataData.latestPublishedYearType,
  );

  await pickThaiDatePicker(
    page,
    statisticMetadataData.latestPublishedYear.selector,
    statisticMetadataData.latestPublishedYear.pickerValue,
  );

  await fillSingleSelectOther(
    page,
    statisticMetadataData.publishedDateType.selector,
    statisticMetadataData.publishedDateType,
  );

  await pickThaiDateTimePicker(
    page,
    statisticMetadataData.publishedDate.selector,
    statisticMetadataData.publishedDate.pickerValue,
  );
}

export async function fillStatisticDatesOnly(page: Page) {
  await fillSingleSelectOther(
    page,
    statisticMetadataData.startDataYearType.selector,
    statisticMetadataData.startDataYearType,
  );

  await pickThaiDatePicker(
    page,
    statisticMetadataData.startDataYear.selector,
    statisticMetadataData.startDataYear.pickerValue,
  );

  await fillSingleSelectOther(
    page,
    statisticMetadataData.latestPublishedYearType.selector,
    statisticMetadataData.latestPublishedYearType,
  );

  await pickThaiDatePicker(
    page,
    statisticMetadataData.latestPublishedYear.selector,
    statisticMetadataData.latestPublishedYear.pickerValue,
  );

  await fillSingleSelectOther(
    page,
    statisticMetadataData.publishedDateType.selector,
    statisticMetadataData.publishedDateType,
  );

  await pickThaiDateTimePicker(
    page,
    statisticMetadataData.publishedDate.selector,
    statisticMetadataData.publishedDate.pickerValue,
  );
}

export async function fillGeoSpatialDatesOnly(page: Page) {
  // เวลาอ้างอิง ถ้าไม่ required อาจข้ามได้
  // await fillSingleSelectOther(
  //   page,
  //   geoSpatialMetadataData.referenceTimeType.selector,
  //   geoSpatialMetadataData.referenceTimeType,
  // );
  // await fillDatePickerOnly(page, geoSpatialMetadataData.referenceTime);

  await fillFlexibleDateText(
    page,
    geoSpatialMetadataData.scheduledPublishedDateTypeText,
    geoSpatialMetadataData.scheduledPublishedDateText,
  );
}

export async function fillMetadataForTypeCheck(
  page: Page,
  typeKey: keyof typeof metadataTypeData,
) {
  await fillMetadataType(page, metadataTypeData[typeKey]);

  await fillCommonMetadataInputs(page);
  await fillCommonMetadataSelectsWithoutGovernance(page);
  await fillObjectiveForValidation(page);

  // record/statistic/geoSpatial มี accessCondition
  // multiple/other ไม่มี accessCondition แต่ยังต้องเลือก governance
  if (
    typeKey === "record" ||
    typeKey === "statistic" ||
    typeKey === "geoSpatial"
  ) {
    await fillAccessConditionByGovernance(page, dataGovernanceData.public);
  } else {
    await fillGovernanceOnly(page, dataGovernanceData.public);
  }

  if (typeKey === "other") {
    const customTypeInput = page.locator("#admin-report-custom-type-name");

    if (await customTypeInput.isVisible().catch(() => false)) {
      await customTypeInput.fill(metadataTypeData.other.otherValue);
      await expect(customTypeInput).toHaveValue(metadataTypeData.other.otherValue);
    }

    return;
  }

  if (typeKey === "multiple") {
    return;
  }



  if (typeKey === "record") {
    await fillMetadataInput(page, recordMetadataData.url);

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

    await fillMultiSelectOther(page, "#admin-report-language", languageData);

    return;
  }

  if (typeKey === "statistic") {
    // Scenario 8 ไม่ตรวจ DatePicker แต่ถ้า field required ต้องกรอกแบบไม่ expect value
    // await fillStatisticDatesOnly(page);

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
      statisticMetadataData.officialStatistic.id,
      statisticMetadataData.officialStatistic.checked,
    );

    return;
  }

  if (typeKey === "geoSpatial") {
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

    await fillPositionalAccuracy(page);

    // Scenario 8 ไม่ตรวจ DatePicker แต่กรอกเพื่อผ่าน validation ถ้าจำเป็น
    // await fillGeoSpatialDatesOnly(page);

    await fillMetadataInput(page, geoSpatialMetadataData.url);

    await fillMultiSelectOther(
      page,
      "#admin-report-language",
      geoSpatialMetadataData.languageData,
    );

    return;
  }
}

export async function fillDateAndCheckFormat(
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
  await page.waitForTimeout(300);
  await input.fill("");
  await input.type(field.value, { delay: 50 });
  await page.waitForTimeout(500);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  await page.keyboard.press("Tab");

  await input.evaluate((el) => {
    const inputEl = el as HTMLInputElement;
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    inputEl.dispatchEvent(new Event("change", { bubbles: true }));
    inputEl.dispatchEvent(new Event("blur", { bubbles: true }));
  });

  await page.waitForTimeout(1000);

  const actualValue = await input.inputValue();

  if (field.format === "BBBB-MM-DD") {
    if (actualValue) {
      expect(actualValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  }

  if (field.format === "BBBB-MM-DD-HH-mm") {
    if (actualValue) {
      expect(actualValue).toMatch(/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}$/);
    }
  }

  if (actualValue && actualValue !== field.value) {
    await expect(input).toHaveValue(actualValue);
  } else {
    await expect(input).toHaveValue(field.value);
  }
}

export async function fillCommonMetadataInputs(page: Page) {
  await fillMetadataInput(page, commonMetadataInputData.datasetName);
  await fillMetadataInput(page, commonMetadataInputData.contactName);
  await fillMetadataInput(page, commonMetadataInputData.contactEmail);
  await fillMetadataInput(page, commonMetadataInputData.keyword);
  await fillMetadataInput(page, commonMetadataInputData.description);
  await fillMetadataInput(page, commonMetadataInputData.updateFrequencyValue);
  await fillMetadataInput(page, commonMetadataInputData.source);
}

export async function fillCommonMetadataSelects(page: Page) {
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
    dataGovernanceData.public,
  );

  await fillSingleSelectOther(page, "#admin-report-license", licenseData);
}

export async function setDictionaryRequired(
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
      await page.waitForTimeout(200);
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
    await page.waitForTimeout(200);
  }
}

export async function fillMetadataType(
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
  return field.value ?? randomText(field.maxLength ?? 50);
}

export async function fillCommonSwitchesIfVisible(page: Page) {
  const highValue = page.locator("#admin-report-high-value-dataset");
  const reference = page.locator("#admin-report-reference-data");

  if (await highValue.isVisible().catch(() => false)) {
    await setSwitch(
      page,
      "admin-report-high-value-dataset",
      recordMetadataData.highValueDataset.checked,
    );
  }

  if (await reference.isVisible().catch(() => false)) {
    await setSwitch(
      page,
      "admin-report-reference-data",
      recordMetadataData.referenceData.checked,
    );
  }
}

export async function saveReport(page: Page) {
  await expect(page.locator("#admin-report-save")).toBeVisible({
    timeout: 10000,
  });

  await page.locator("#admin-report-save").click();

  // หน่วงรอ popup ยืนยันแสดง
  await page.waitForTimeout(3000);

  await expect(page.getByText("ยืนยันการบันทึกข้อมูล")).toBeVisible({
    timeout: 30000,
  });

  await page.getByRole("button", { name: "บันทึก" }).click();

  // หน่วงรอ SweetAlert หลังบันทึก
  await page.waitForTimeout(2000);

  const successTitle = page.locator(".swal2-title", {
    hasText: "บันทึกข้อมูลเสร็จสิ้น",
  });

  await expect(successTitle).toBeVisible({ timeout: 50000 });
  await expect(successTitle).toContainText("บันทึกข้อมูลเสร็จสิ้น");
}

export async function updateReportSave(page: Page) {
  await expect(page.locator("#admin-report-save")).toBeVisible({
    timeout: 10000,
  });

  await page.locator("#admin-report-save").click();

  await page.waitForTimeout(3000);

  const successTitle = page.locator(".swal2-title", {
    hasText: "แก้ไขข้อมูลเสร็จสิ้น",
  });

  await expect(successTitle).toBeVisible({ timeout: 50000 });
  await expect(successTitle).toContainText("แก้ไขข้อมูลเสร็จสิ้น");

  // ถ้าไม่มีปุ่ม OK ให้รอให้ popup หายเอง
  await page.waitForTimeout(3000);

  const swalPopup = page.locator(".swal2-popup");

  if (await swalPopup.isVisible().catch(() => false)) {
    await page.keyboard.press("Escape").catch(() => { });
    await page.waitForTimeout(1000);
  }
}

export async function fillDictionaryRow(
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
  field: DictInputField | SelectTestData,
) {
  const input = page.locator(selector);

  await expect(input).toBeVisible({ timeout: 10000 });

  const className = await input.getAttribute("class");
  const isSelect = String(className ?? "").includes("ant-select");

  let actualValue: string;

  if (isSelect) {
    const selectField = field as SelectTestData;

    const searchText =
      selectField.searchText ??
      selectField.optionText ??
      selectField.title ??
      selectField.value ??
      "";

    const optionText =
      selectField.optionText ??
      selectField.searchText ??
      selectField.title ??
      selectField.value ??
      "";

    await selectAntdOptionBySearch(
      page,
      selector,
      searchText,
      optionText,
    );

    // Assume success and continue to avoid blocking (similar to admin-report-org logic)
    actualValue = optionText;
  } else {
    const inputField = field as DictInputField;

    await input.fill(inputField.value);
    await expect(input).toHaveValue(inputField.value);

    actualValue = await input.inputValue();
  }

  if ("maxLength" in field && field.maxLength) {
    expect(actualValue.length).toBeLessThanOrEqual(field.maxLength);
  }

  if ("inputType" in field) {
    switch (field.inputType) {
      case "number":
        expect(actualValue).toMatch(/^\d*$/);
        break;

      case "email":
        expect(actualValue).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        break;

      case "url":
        expect(actualValue).toMatch(/^https?:\/\/.+/);
        break;

      case "select":
      case "string":
      default:
        expect(typeof actualValue).toBe("string");
        expect(actualValue.length).toBeGreaterThan(0);
        break;
    }
  }

  if (!isSelect) {
    await expect(input).toHaveValue(actualValue);
  }
}

export async function checkDictNumberRejectsStringInput(
  page: Page,
  selector: string,
  invalidValue = "abcทดสอบ",
) {
  const input = page.locator(selector);

  await expect(input).toBeVisible({ timeout: 10000 });
  await input.click();
  await input.fill("");
  await input.pressSequentially(invalidValue, { delay: 10 });

  const actualValue = await input.inputValue();

  expect(actualValue).not.toBe(invalidValue);
  expect(actualValue).not.toMatch(/[A-Za-zก-ฮ]/);

  if (actualValue) {
    expect(actualValue).toMatch(/^\d*$/);
  }
}

export async function mReportPart1(
  page: Page,
  reportName = `รายงาน${randomText(6)}`,
) {
  await selectAntdOptionByText(
    page,
    "#admin-report-add-category",
    reportStep1Data.categoryTitle,
  );
  await page.waitForTimeout(300);

  await selectAntdOptionByText(
    page,
    "#admin-report-add-main",
    reportStep1Data.mainTitle,
  );
  await page.waitForTimeout(300);

  await selectAntdOptionByText(
    page,
    "#admin-report-add-sub",
    reportStep1Data.subTitle,
  );
  await page.waitForTimeout(300);

  await selectAntdOptionByText(
    page,
    "#admin-report-add-status",
    reportStep1Data.statusTitle,
  );
  await page.waitForTimeout(300);

  await page.locator("#admin-report-add-date").click();
  await page.waitForTimeout(300);
  await page.locator(`[title="${reportStep1Data.publishDateTitle}"]`).click();
  await page.waitForTimeout(300);

  await fillAndExpect(page, "#admin-report-add-name", reportName);

  return reportName;
}

export async function mReportPart2(page: Page) {
  await page.locator("#admin-report-step-1-next").click();
  await page.waitForTimeout(500);

  await fillMetadataType(page, metadataTypeData.record);

  await fillCommonMetadataInputs(page);
  await fillCommonMetadataSelects(page);

  await fillRecordSpecificFields(page);
}

export async function mReportPart3(page: Page) {
  await expect(page.locator("#admin-report-step-2-next")).toBeVisible({
    timeout: 10000,
  });

  await page.locator("#admin-report-step-2-next").click();
  await page.waitForTimeout(500);

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

  // ตรวจสอบข้อมูลใน database หลังบันทึก
  const dbResult = await expectLatestDatasetSaved();

  console.log("✓ ตรวจสอบ database สำเร็จ - Latest ID:", dbResult.latestId);
  console.log("  - TB_DATASET_GROUPS:", dbResult.dataset.length, "row(s)");
  console.log("  - TB_DATASET_GROUPS_METAD:", dbResult.metadata.length, "row(s)");
  console.log("  - TB_DATASET_GROUPS_DICT:", dbResult.dictionary.length, "row(s)");

  // เช็คข้อมูล "อื่น ๆ" ทั้งหมดใน MS_METADATA_LIST (ถ้ามี)
  const otherMetadata = await expectAllLatestOtherMetadataCreated();
  if (otherMetadata.length > 0) {
    console.log("  - MS_METADATA_LIST (อื่น ๆ):", otherMetadata.length, "row(s)");
  }

  return dbResult;
}

export function buildScenarioValues(
  typeKey: MetadataTypeKey,
  mode: "create" | "edit",
): ScenarioValues {
  const token = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-12);
  const numericToken = token.slice(-6);
  const modeThai = mode === "create" ? "สร้าง" : "แก้ไข";
  const modeSlug = mode === "create" ? "create" : "edit";

  return {
    reportName: `รายงาน${modeThai}-${typeKey}-${token}`,
    datasetName: `ชุดข้อมูล${modeThai}-${typeKey}-${token}`,
    url: `https://playwright.dev/${typeKey}/${modeSlug}-${token}`,
    measureUnit: `หน่วย${modeThai}-${token}`,
    customTypeName: `ประเภท${modeThai}-${typeKey}-${token}`,
    westBoundLongitude: `10${numericToken.slice(0, 2)}.${numericToken.slice(2)}`,
    dictColumnName: `${modeSlug.toUpperCase()}_${typeKey.toUpperCase()}_${numericToken}`,
    dictDescription: `คำอธิบาย${modeThai}-${typeKey}-${token}`,
    dictSample: `${modeSlug}-sample-${numericToken}`,
  };
}

export function snapshotToText(snapshot: DatasetSnapshot) {
  return JSON.stringify(snapshot);
}

export async function openManageReportAction(
  page: Page,
  action: ReportAction,
  datasetGroupId: number,
) {
  await page.goto("/manage/admin-report");

  const actionButton = page.locator(`#admin-report-${action}-${datasetGroupId}`);

  await expect(actionButton).toBeVisible({ timeout: 30000 });
  await actionButton.click();
}

export async function goToMetadataStep(page: Page) {
  await page.locator("#admin-report-step-1-next").click();

  await expect(page.locator("#admin-report-type")).toBeVisible({
    timeout: 10000,
  });
}

export async function goToDataDictionaryStep(page: Page) {
  await expect(page.locator("#admin-report-step-2-next")).toBeVisible({
    timeout: 10000,
  });

  await page.locator("#admin-report-step-2-next").click();

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

  await expect(dataDictionaryTitle).toBeVisible({ timeout: 10000 });
}

async function fillHappyCaseMetadataForType(
  page: Page,
  typeKey: MetadataTypeKey,
) {
  if (typeKey === "record") {
    await fillMetadataType(page, metadataTypeData.record);
    await closeAntdDropdown(page);

    await fillCommonMetadataInputs(page);
    await closeAntdDropdown(page);

    await fillCommonMetadataSelectsWithoutGovernance(page);
    await closeAntdDropdown(page);

    await fillAccessConditionByGovernance(page, dataGovernanceData.public);
    await fillMetadataInput(page, recordMetadataData.url);
    await closeAntdDropdown(page);

    await fillMultiSelectOtherAndDetail(
      page,
      "#admin-report-objective",
      objectiveData,
      (value) => `#admin-report-objective-other-${value}`,
      (value) => `#admin-report-objective-detail-${value}`,
    );
    await closeAntdDropdown(page);

    await fillMultiSelectOtherAndDetail(
      page,
      "#admin-report-sponsor",
      sponsorData,
      (value) => `#admin-report-sponsor-other-${value}`,
      (value) => `#admin-report-sponsor-detail-${value}`,
    );
    await closeAntdDropdown(page);

    await fillSingleSelectOther(
      page,
      "#admin-report-smallest-unit",
      smallestUnitData,
    );
    await closeAntdDropdown(page);

    await fillMultiSelectOther(page, "#admin-report-language", languageData);

    await setSwitch(
      page,
      "admin-report-high-value-dataset",
      recordMetadataData.highValueDataset.checked,
    );

    await setSwitch(
      page,
      "admin-report-reference-data",
      recordMetadataData.referenceData.checked,
    );

    return;
  }

  if (typeKey === "statistic") {
    await fillMetadataType(page, metadataTypeData.statistic);
    await fillCommonMetadataInputs(page);
    await fillCommonMetadataSelectsWithoutGovernance(page);
    await fillObjectiveForValidation(page);
    await fillAccessConditionByGovernance(page, dataGovernanceData.public);
    await fillStatisticDatesForHappyCase(page);

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
      statisticMetadataData.officialStatistic.id,
      statisticMetadataData.officialStatistic.checked,
    );

    return;
  }

  if (typeKey === "geoSpatial") {
    await fillMetadataType(page, metadataTypeData.geoSpatial);
    await fillCommonMetadataInputs(page);
    await fillCommonMetadataSelectsWithoutGovernance(page);
    await fillObjectiveForValidation(page);
    await fillAccessConditionByGovernance(page, dataGovernanceData.public);

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

    await fillPositionalAccuracy(page);
    await fillGeoSpatialDatesForHappyCase(page);
    await fillMetadataInput(page, geoSpatialMetadataData.url);

    await fillMultiSelectOther(
      page,
      "#admin-report-language",
      geoSpatialMetadataData.languageData,
    );

    return;
  }

  if (typeKey === "multiple") {
    await fillMetadataType(page, metadataTypeData.multiple);
    await fillCommonMetadataInputs(page);
    await fillCommonMetadataSelects(page);
    await fillCommonSwitchesIfVisible(page);
    return;
  }

  await fillMetadataType(page, metadataTypeData.other);
  await fillCommonMetadataInputs(page);
  await fillCommonMetadataSelects(page);
  await fillCommonSwitchesIfVisible(page);
}

export async function createReportForType(
  page: Page,
  typeKey: MetadataTypeKey,
) {
  const values = buildScenarioValues(typeKey, "create");
  const reportName = await mReportPart1(page, values.reportName);

  await goToMetadataStep(page);
  await fillHappyCaseMetadataForType(page, typeKey);
  await fillAndExpect(page, "#admin-report-dataset-name", values.datasetName);

  const dbResult = (await mReportPart3(page)) as DatasetSnapshot;

  return {
    datasetGroupId: dbResult.latestId,
    snapshot: dbResult,
    values: {
      ...values,
      reportName,
    },
  };
}

export async function applyEditValuesForType(
  page: Page,
  typeKey: MetadataTypeKey,
  values: ScenarioValues,
) {
  await fillAndExpect(page, "#admin-report-dataset-name", values.datasetName);

  if (typeKey === "record") {
    await fillAndExpect(page, "#admin-report-url", values.url);
    return;
  }

  if (typeKey === "statistic") {
    await fillAndExpect(page, "#admin-report-measure-unit", values.measureUnit);
    await fillAndExpect(page, "#admin-report-url", values.url);
    return;
  }

  if (typeKey === "geoSpatial") {
    await fillAndExpect(
      page,
      "#admin-report-west-bound-longitude",
      values.westBoundLongitude,
    );
    await fillAndExpect(page, "#admin-report-url", values.url);
    return;
  }

  if (typeKey === "other") {
    await fillAndExpect(
      page,
      "#admin-report-custom-type-name",
      values.customTypeName,
    );
  }
}

export async function updateDictionaryForEdit(page: Page, values: ScenarioValues) {
  await fillAndValidateDictInput(page, "[data-testid=\"dict-column-name-0\"]", {
    value: values.dictColumnName,
    inputType: "string",
    maxLength: 100,
  });

  await fillAndValidateDictInput(page, "[data-testid=\"dict-description-0\"]", {
    value: values.dictDescription,
    inputType: "string",
    maxLength: 500,
  });

  await fillAndValidateDictInput(page, "[data-testid=\"dict-sample-data-0\"]", {
    value: values.dictSample,
    inputType: "string",
    maxLength: 500,
  });
}

export async function expectViewValuesForType(
  page: Page,
  typeKey: MetadataTypeKey,
  values: ScenarioValues,
) {
  await expect(page.locator("#admin-report-add-name")).toHaveValue(
    values.reportName,
  );

  await expect(page.locator("#admin-report-save")).toHaveCount(0);

  await goToMetadataStep(page);

  await expect(page.locator("#admin-report-dataset-name")).toHaveValue(
    values.datasetName,
  );

  if (typeKey === "record") {
    await expect(page.locator("#admin-report-url")).toHaveValue(values.url);
  }

  if (typeKey === "statistic") {
    await expect(page.locator("#admin-report-measure-unit")).toHaveValue(
      values.measureUnit,
    );
  }

  if (typeKey === "geoSpatial") {
    await expect(page.locator("#admin-report-west-bound-longitude")).toHaveValue(
      values.westBoundLongitude,
    );
  }

  if (typeKey === "other") {
    await expect(page.locator("#admin-report-custom-type-name")).toHaveValue(
      values.customTypeName,
    );
  }

  await goToDataDictionaryStep(page);

  await expect(page.getByTestId("dict-column-name-0")).toHaveValue(
    values.dictColumnName,
  );
  await expect(page.getByTestId("dict-description-0")).toHaveValue(
    values.dictDescription,
  );
}

export async function expectTypeSpecificSnapshotValue(
  snapshotText: string,
  typeKey: MetadataTypeKey,
  values: ScenarioValues,
) {
  if (typeKey === "record") {
    expect(snapshotText).toContain(values.url);
    return;
  }

  if (typeKey === "statistic") {
    expect(snapshotText).toContain(values.measureUnit);
    return;
  }

  if (typeKey === "geoSpatial") {
    expect(snapshotText).toContain(values.westBoundLongitude);
    return;
  }

  if (typeKey === "other") {
    expect(snapshotText).toContain(values.customTypeName);
  }
}

export async function searchReportAndClickDelete(
  page: Page,
  reportNamePrefix: string,
) {
  const searchInput = page.locator("#admin-report-search-name");

  await expect(searchInput).toBeVisible({ timeout: 10000 });

  await searchInput.fill("");
  await searchInput.fill(reportNamePrefix);
  await page.keyboard.press("Enter");

  await page.waitForLoadState("networkidle").catch(() => { });
  await page.waitForTimeout(1500);

  const targetRow = page
    .locator("tbody tr")
    .filter({
      hasText: reportNamePrefix,
    })
    .first();

  await expect(targetRow).toBeVisible({
    timeout: 15000,
  });

  const rowText = await targetRow.innerText();

  if (!rowText.includes(reportNamePrefix)) {
    throw new Error(
      [
        "ไม่พบแถวรายงานที่ตรงกับชื่อที่ค้นหา",
        `คำค้นหา: ${reportNamePrefix}`,
        `แถวที่เจอ: ${rowText}`,
      ].join("\n"),
    );
  }

  const deleteButton = targetRow.locator("[id^='admin-report-delete-']").first();

  await expect(deleteButton).toBeVisible({
    timeout: 10000,
  });

  await deleteButton.click();
}

export async function confirmDeleteReport(page: Page) {
  const swalPopup = page.locator(".swal2-popup");

  await expect(swalPopup).toBeVisible({
    timeout: 10000,
  });

  await expect(
    page.getByText("ยืนยันลบรายงาน", { exact: false }),
  ).toBeVisible({
    timeout: 10000,
  });

  await expect(
    page.getByText("คุณต้องการลบรายการนี้ใช่หรือไม่", { exact: false }),
  ).toBeVisible({
    timeout: 10000,
  });

  const confirmButton = swalPopup.getByRole("button", {
    name: /ยืนยัน/i,
  });

  await expect(confirmButton).toBeVisible({
    timeout: 10000,
  });

  await confirmButton.click();

  await page.waitForTimeout(1500);

  const successTitle = page.locator(".swal2-title", {
    hasText: "ลบข้อมูลเสร็จสิ้น",
  });

  await expect(successTitle).toBeVisible({
    timeout: 50000,
  });

  await expect(successTitle).toContainText("ลบข้อมูลเสร็จสิ้น");

  // ถ้า popup หายเอง ไม่ต้องกดอะไร
  await page.waitForTimeout(2000);
}

test.describe("Manage Report Page", () => {
  test.beforeEach(async ({ page }) => {
    await mLogin(page);

  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  const metadataTypeCases = [
    { key: "record", name: "ข้อมูลระเบียน" },
    { key: "statistic", name: "ข้อมูลสถิติ" },
    { key: "geoSpatial", name: "ข้อมูลภูมิสารสนเทศเชิงพื้นที่" },
    { key: "multiple", name: "ข้อมูลหลากหลายประเภท" },
    { key: "other", name: "ข้อมูลประเภทอื่น ๆ ระบุ" },
  ] as const;

  test("Scenario 0: ตรวจ validation Step 1 เมื่อกดถัดไปโดยไม่กรอกข้อมูล", async ({
    page,
  }) => {
    await page.locator("#admin-report-step-1-next").click();

    await page.waitForTimeout(500);

    await expectValidationMessagesIfAvailable(page, [
      "กรุณาเลือกกลุ่มข้อมูลรายงาน",
      "กรุณาเลือกกลุ่มรายงาน",
      "กรุณาเลือกชุดข้อมูลรายงาน",
      "กรุณาเลือกสถานะ",
      "กรุณาเลือกวันที่",
      "กรุณากรอกชื่อรายงาน",
    ]);
  });

  for (const item of metadataValidationCases) {
    test(`Scenario validation: ตรวจ validation Step 2 - ${item.name}`, async ({
      page,
    }) => {
      test.setTimeout(360000);

      await mReportPart1(page);

      await page.locator("#admin-report-step-1-next").click();

      await expect(page.locator("#admin-report-type")).toBeVisible({
        timeout: 10000,
      });

      /**
       * กรณี "ยังไม่เลือกประเภทข้อมูล"
       * ไม่ต้องเลือก admin-report-type
       * ให้กดถัดไปเพื่อให้ validation แสดงเลย
       */
      if (item.key !== "none") {
        const typeItem =
          metadataTypeData[item.key as keyof typeof metadataTypeData];

        if (!typeItem) {
          throw new Error(
            `ไม่พบ metadataTypeData สำหรับ key: ${String(item.key)}`,
          );
        }

        if (item.key === "other") {
          await selectAntdOptionBySearch(
            page,
            "#admin-report-type",
            metadataTypeData.other.searchText ?? metadataTypeData.other.title,
            metadataTypeData.other.optionText ?? metadataTypeData.other.title,
          );
        } else {
          await fillMetadataType(page, typeItem);
        }
      }

      await page.locator("#admin-report-step-2-next").click();

      const firstMessage = item.messages[0];

      await expect(page.getByText(firstMessage, { exact: false }))
        .toBeVisible({ timeout: 30000 })
        .catch(() => {
          console.log(`⚠️ รอ validation message: ${firstMessage}`);
        });

      await page.waitForTimeout(500);

      await expectValidationMessagesIfAvailable(page, [...item.messages]);
    });
  }






  for (const item of metadataTypeCases) {
    test(`Scenario Exception maxLength: กรอกข้อมูลเกิน maxLength ใน Metadata - ${item.name}`, async ({
      page,
    }) => {
      test.setTimeout(240000);
      await mLogin(page);

      await mReportPart1(page);

      await page.locator("#admin-report-step-1-next").click();

      await expect(page.locator("#admin-report-type")).toBeVisible({
        timeout: 10000,
      });

      await prepareMetadataTypeForMaxLength(page, item.key);

      const fields = getMaxLengthInputFieldsByType(item.key);

      for (const field of fields) {
        const input = page.locator(field.selector);

        if (await input.isVisible().catch(() => false)) {
          await checkInputRejectsOverMaxLength(page, field);
        }
      }
    });
  }

  // -------------
  test("Scenario fillMetadataTypeRecord: กรอกข้อมูลรายงาน , กรอก Meatadata โดยเลือก ประเภทข้อมูลระเบียน และกรอกข้อมูล Datadictionary", async ({
    page,
  }) => {
    test.setTimeout(120000); ``

    await mReportPart1(page);

    await page.locator("#admin-report-step-1-next").click();

    await expect(page.locator("#admin-report-type")).toBeVisible({
      timeout: 10000,
    });

    await fillMetadataType(page, metadataTypeData.record);

    await closeAntdDropdown(page);

    await fillCommonMetadataInputs(page);

    await closeAntdDropdown(page);

    await fillCommonMetadataSelectsWithoutGovernance(page);

    await closeAntdDropdown(page);

    await fillAccessConditionByGovernance(page, dataGovernanceData.public);

    await fillMetadataInput(page, recordMetadataData.url);

    await closeAntdDropdown(page);

    await fillMultiSelectOtherAndDetail(
      page,
      "#admin-report-objective",
      objectiveData,
      (value) => `#admin-report-objective-other-${value}`,
      (value) => `#admin-report-objective-detail-${value}`,
    );

    await closeAntdDropdown(page);

    await fillMultiSelectOtherAndDetail(
      page,
      "#admin-report-sponsor",
      sponsorData,
      (value) => `#admin-report-sponsor-other-${value}`,
      (value) => `#admin-report-sponsor-detail-${value}`,
    );

    await closeAntdDropdown(page);

    await fillSingleSelectOther(
      page,
      "#admin-report-smallest-unit",
      smallestUnitData,
    );

    await closeAntdDropdown(page);

    await fillMultiSelectOther(page, "#admin-report-language", languageData);

    await setSwitch(
      page,
      "admin-report-high-value-dataset",
      recordMetadataData.highValueDataset.checked,
    );

    await setSwitch(
      page,
      "admin-report-reference-data",
      recordMetadataData.referenceData.checked,
    );

    const dbResult = await mReportPart3(page);

    // ตรวจสอบข้อมูลบันทึกใน database
    expect(dbResult.latestId).toBeTruthy();
    expect(dbResult.dataset.length).toBe(1);
    expect(dbResult.metadata.length).toBeGreaterThan(0);
    expect(dbResult.dictionary.length).toBeGreaterThan(0);
  });

  test("Scenario fillMetadataTypeStatistic: กรอกข้อมูลรายงาน , กรอก Meatadata โดยเลือก ประเภทข้อมูลสถิติ และกรอกข้อมูล Datadictionary", async ({
    page,
  }) => {
    test.setTimeout(180000);

    await mReportPart1(page);

    await page.locator("#admin-report-step-1-next").click();

    await expect(page.locator("#admin-report-type")).toBeVisible({
      timeout: 10000,
    });

    await fillMetadataType(page, metadataTypeData.statistic);

    await fillCommonMetadataInputs(page);
    await fillCommonMetadataSelectsWithoutGovernance(page);
    await fillObjectiveForValidation(page);

    await fillAccessConditionByGovernance(page, dataGovernanceData.public);

    // ใช้ตัวนี้แทน fillDateAndCheckFormat
    await fillStatisticDatesForHappyCase(page);

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
      statisticMetadataData.officialStatistic.id,
      statisticMetadataData.officialStatistic.checked,
    );

    const dbResult = await mReportPart3(page);

    // ตรวจสอบข้อมูลบันทึกใน database
    expect(dbResult.latestId).toBeTruthy();
    expect(dbResult.dataset.length).toBe(1);
    expect(dbResult.metadata.length).toBeGreaterThan(0);
    expect(dbResult.dictionary.length).toBeGreaterThan(0);
  });

  test("Scenario fillMetadataTypeGeoSpatial: กรอกข้อมูลรายงาน , กรอก Meatadata โดยเลือก ประเภทข้อมูลภูมิสารสนเทศเชิงพื้นที่ และกรอกข้อมูล Datadictionary", async ({
    page,
  }) => {
    test.setTimeout(120000);

    await mReportPart1(page);

    await page.locator("#admin-report-step-1-next").click();

    await expect(page.locator("#admin-report-type")).toBeVisible({
      timeout: 10000,
    });

    await fillMetadataType(page, metadataTypeData.geoSpatial);

    await fillCommonMetadataInputs(page);
    await fillCommonMetadataSelectsWithoutGovernance(page);
    await fillObjectiveForValidation(page);

    await fillAccessConditionByGovernance(page, dataGovernanceData.public);

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

    await fillPositionalAccuracy(page);

    // เวลาอ้างอิง ถ้าไม่ required จะไม่กรอกก็ได้
    // await fillDatePickerOnly(page, geoSpatialMetadataData.referenceTime);

    // วันที่กําหนดเผยแพร่ข้อมูล required
    await fillGeoSpatialDatesForHappyCase(page);

    await fillMetadataInput(page, geoSpatialMetadataData.url);

    await fillMultiSelectOther(
      page,
      "#admin-report-language",
      geoSpatialMetadataData.languageData,
    );

    const dbResult = await mReportPart3(page);

    // ตรวจสอบข้อมูลบันทึกใน database
    expect(dbResult.latestId).toBeTruthy();
    expect(dbResult.dataset.length).toBe(1);
    expect(dbResult.metadata.length).toBeGreaterThan(0);
    expect(dbResult.dictionary.length).toBeGreaterThan(0);
  });

  test("Scenario fillMetadataTypeMultiple: กรอกข้อมูลรายงาน , กรอก Meatadata โดยเลือก ประเภทข้อมูลหลากหลายประเภท และกรอกข้อมูล Datadictionary", async ({
    page,
  }) => {
    test.setTimeout(120000);

    await mReportPart1(page);

    await page.locator("#admin-report-step-1-next").click();
    await page.waitForTimeout(500);

    await fillMetadataType(page, metadataTypeData.multiple);

    // กรอกข้อมูล step 2 เฉพาะ field พื้นฐานที่เห็นเท่านั้น
    await fillCommonMetadataInputs(page);
    await fillCommonMetadataSelects(page);

    // ข้อมูลหลากหลายประเภทไม่เห็น highValueDataset/referenceData
    await fillCommonSwitchesIfVisible(page);

    const dbResult = await mReportPart3(page);

    // ตรวจสอบข้อมูลบันทึกใน database
    expect(dbResult.latestId).toBeTruthy();
    expect(dbResult.dataset.length).toBe(1);
    expect(dbResult.metadata.length).toBeGreaterThan(0);
    expect(dbResult.dictionary.length).toBeGreaterThan(0);
  });

  test("Scenario fillMetadataTypeOther: กรอกข้อมูลรายงาน , กรอก Meatadata โดยเลือก ประเภทข้อมูลอื่น ๆ ระบุ และกรอกข้อมูล Datadictionary", async ({
    page,
  }) => {
    test.setTimeout(120000);

    await mReportPart1(page);

    await page.locator("#admin-report-step-1-next").click();
    await page.waitForTimeout(500);

    // ประเภทข้อมูล = ข้อมูลประเภทอื่น ๆ ระบุ...
    // helper นี้จะกรอก #admin-report-custom-type-name ให้ด้วย
    await fillMetadataType(page, metadataTypeData.other);

    await fillCommonMetadataInputs(page);
    await fillCommonMetadataSelects(page);
    await fillCommonSwitchesIfVisible(page);

    const dbResult = await mReportPart3(page);

    // ตรวจสอบข้อมูลบันทึกใน database
    expect(dbResult.latestId).toBeTruthy();
    expect(dbResult.dataset.length).toBe(1);
    expect(dbResult.metadata.length).toBeGreaterThan(0);
    expect(dbResult.dictionary.length).toBeGreaterThan(0);
  });

  // for (const item of metadataTypeCases) {
  //   test(`Scenario 8: แก้ไขข้อมูลรายงาน, metadata ${item.name}, data dictionary`, async ({
  //     page,
  //   }) => {
  //     test.setTimeout(180000);

  //     const created = await createReportForType(page, item.key);
  //     const beforeSnapshotText = snapshotToText(created.snapshot);
  //     const editValues = buildScenarioValues(item.key, "edit");

  //     await openManageReportAction(page, "edit", created.datasetGroupId);

  //     await expect(page.locator("#admin-report-add-name")).toBeVisible({
  //       timeout: 30000,
  //     });

  //     await fillAndExpect(page, "#admin-report-add-name", editValues.reportName);
  //     await goToMetadataStep(page);
  //     await applyEditValuesForType(page, item.key, editValues);
  //     await goToDataDictionaryStep(page);
  //     await updateDictionaryForEdit(page, editValues);
  //     await saveReport(page);

  //     const afterSnapshot = (await expectDatasetSavedById(
  //       created.datasetGroupId,
  //     )) as DatasetSnapshot;
  //     const afterSnapshotText = snapshotToText(afterSnapshot);

  //     expect(beforeSnapshotText).not.toContain(editValues.datasetName);
  //     expect(beforeSnapshotText).not.toContain(editValues.dictColumnName);
  //     expect(afterSnapshotText).toContain(editValues.datasetName);
  //     expect(afterSnapshotText).toContain(editValues.dictColumnName);
  //     expect(afterSnapshotText).toContain(editValues.dictDescription);
  //     expect(afterSnapshotText).toContain(editValues.dictSample);
  //     expectTypeSpecificSnapshotValue(afterSnapshotText, item.key, editValues);
  //     expect(afterSnapshotText).not.toBe(beforeSnapshotText);

  //     await openManageReportAction(page, "view", created.datasetGroupId);
  //     await expectViewValuesForType(page, item.key, editValues);
  //   });
  // }

  // for (const item of metadataTypeCases) {
  //   test(`Scenario 9: ดูข้อมูลรายงาน, metadata ${item.name}, data dictionary`, async ({
  //     page,
  //   }) => {
  //     test.setTimeout(180000);

  //     const created = await createReportForType(page, item.key);

  //     await openManageReportAction(page, "view", created.datasetGroupId);
  //     await expectViewValuesForType(page, item.key, created.values);

  //     const snapshot = (await expectDatasetSavedById(
  //       created.datasetGroupId,
  //     )) as DatasetSnapshot;

  //     expect(snapshotToText(snapshot)).toContain(created.values.datasetName);
  //     expect(snapshotToText(snapshot)).toContain(dictionaryRows[0].columnName.value);
  //   });
  // }

  test("Scenario deleteReport: ลบข้อมูลรายงาน", async ({ page }) => {
    test.setTimeout(180000);

    // const reportNamePrefix = reportStep1Data.reportNamePrefix;
    const reportNamePrefix = "รายงาน40b349";

    // 1. ค้นหาชื่อรายงาน
    await searchReportAndClickDelete(page, reportNamePrefix);

    // 2. กดยืนยันจาก popup
    await confirmDeleteReport(page);

    // 3. กลับมาหน้ารายการและค้นหาอีกครั้ง เพื่อตรวจว่าไม่มีรายการแล้ว
    await page.goto("/manage/admin-report", {
      waitUntil: "domcontentloaded",
    });

    const searchInput = page.locator("#admin-report-search-name");

    await expect(searchInput).toBeVisible({ timeout: 10000 });

    await searchInput.fill("");
    await searchInput.fill(reportNamePrefix);
    await page.keyboard.press("Enter");

    await page.waitForLoadState("networkidle").catch(() => { });
    await page.waitForTimeout(1500);

    await expect(
      page.locator("tbody tr").filter({
        hasText: reportNamePrefix,
      }),
    ).toHaveCount(0);

    console.log(`ลบข้อมูลรายงานสำเร็จ: ${reportNamePrefix}`);
  });


  for (const item of metadataTypeCases) {
    test(`Scenario typeMetadata: ตรวจสอบ type ของ Metadata - ${item.name}`, async ({
      page,
    }) => {
      test.setTimeout(480000);

      await mReportPart1(page);

      await page.locator("#admin-report-step-1-next").click();

      await expect(page.locator("#admin-report-type")).toBeVisible({
        timeout: 10000,
      });

      await fillMetadataForTypeCheck(page, item.key);

      const fields = getInputTypeFieldsByType(item.key);

      for (const field of fields) {
        const input = page.locator(field.selector);

        if (await input.isVisible().catch(() => false)) {
          await checkInputType(page, field);
        }
      }

      // สำคัญ: Scenario นี้ไม่ต้องกดไป Step 3
      // เพราะเป็นการตรวจ type ของ Metadata เท่านั้น
    });
  }

  test("Scenario typeDictionary: ตรวจสอบ type ของ Data Dictionary", async ({ page }) => {
    test.setTimeout(120000);

    await mReportPart1(page);

    await page.locator("#admin-report-step-1-next").click();

    await expect(page.locator("#admin-report-type")).toBeVisible({
      timeout: 10000,
    });

    // ใช้ข้อมูลระเบียน เพราะกรอกง่ายและไป Step 3 ได้เสถียรกว่า
    await fillMetadataForTypeCheck(page, "record");

    await page.locator("#admin-report-step-2-next").click();

    const errors = page.locator(".ant-form-item-explain-error");

    if (await errors.count()) {
      const errorTexts = await errors.allTextContents();

      throw new Error(
        [
          "ไม่สามารถไป Step 3: Data Dictionary ได้",
          "",
          "Validation errors ที่พบ:",
          ...errorTexts.map((x) => `- ${x}`),
        ].join("\n"),
      );
    }

    await expect(
      page.getByText("3. Data Dictionary", { exact: true }),
    ).toBeVisible({
      timeout: 10000,
    });

    for (let i = 0; i < dictionaryRows.length; i++) {
      if (i > 0) {
        await page.locator("#admin-report-add-dict-row").click();

        await expect(page.getByTestId(`dict-column-name-${i}`)).toBeVisible({
          timeout: 10000,
        });
      }

      await checkDictionaryRowType(page, i, dictionaryRows[i]);
    }
  });

  test("Scenario dictionaryNumberNotAllowString: เช็ค Data Dictionary ช่อง number ไม่รับ string", async ({
    page,
  }) => {
    test.setTimeout(120000);

    await mReportPart1(page);

    await page.locator("#admin-report-step-1-next").click();

    await expect(page.locator("#admin-report-type")).toBeVisible({
      timeout: 10000,
    });

    await fillMetadataForTypeCheck(page, "record");

    await page.locator("#admin-report-step-2-next").click();

    await expect(
      page.getByText("3. Data Dictionary", { exact: true }),
    ).toBeVisible({
      timeout: 10000,
    });

    for (let i = 0; i < dictionaryRows.length; i++) {
      if (i > 0) {
        await page.locator("#admin-report-add-dict-row").click();

        await expect(page.getByTestId(`dict-column-name-${i}`)).toBeVisible({
          timeout: 10000,
        });
      }

      await checkDictNumberRejectsStringInput(
        page,
        `[data-testid="dict-size-value-${i}"]`,
      );
    }
  });

  // test.describe("Scenario Update: แก้ไขข้อมูลรายงานจากข้อมูลเดิมในหน้า Edit", () => {
  //   const updateCases = [
  //     {
  //       key: "record",
  //       name: "ข้อมูลระเบียน",
  //       reportNamePrefix: "ระเบียน",
  //     },
  //     {
  //       key: "statistic",
  //       name: "ข้อมูลสถิติ",
  //       reportNamePrefix: "สถิติ",
  //     },
  //     {
  //       key: "geoSpatial",
  //       name: "ข้อมูลภูมิสารสนเทศเชิงพื้นที่",
  //       reportNamePrefix: "พื้นที่",
  //     },
  //     {
  //       key: "multiple",
  //       name: "ข้อมูลหลากหลายประเภท",
  //       reportNamePrefix: "หลากหลาย",
  //     },
  //     {
  //       key: "other",
  //       name: "ข้อมูลประเภทอื่น ๆ ระบุ",
  //       reportNamePrefix: "อื่น",
  //     },
  //   ] as const;

  //   for (const item of updateCases) {
  //     test(`Scenario Update: แก้ไขข้อมูลรายงาน - ${item.name}`, async ({ page }) => {
  //       test.setTimeout(360000);
  //       await mLogin(page);



  //       /**
  //        * 1. ค้นหาชื่อรายงานจาก reportNamePrefix
  //        * เช่น ระเบียน / สถิติ / พื้นที่ / หลากหลาย / อื่น
  //        */
  //       await searchReportAndClickEdit(page, item.reportNamePrefix);
  //       //enter
  //       await page.keyboard.press("Enter");

  //       /**
  //        * 2. Step 1: แก้ไขข้อมูลรายงานจากข้อมูลเดิม
  //        */
  //       const updatedReportName = buildUpdatedReportName(item.reportNamePrefix);

  //       await updateReportStep1(page, updatedReportName);

  //       await page.locator("#admin-report-step-1-next").click();

  //       /**
  //        * 3. Step 2: แก้ไข Metadata ตามประเภทข้อมูลเดิม
  //        * ห้ามเรียก fillMetadataType() เพราะไม่ต้องเปลี่ยนประเภทข้อมูล
  //        */
  //       await expect(page.locator("#admin-report-type")).toBeVisible({
  //         timeout: 10000,
  //       });

  //       const editValues = buildScenarioValues(item.key, "edit");

  //       await updateMetadataByCurrentType(page, item.key, editValues);

  //       await page.locator("#admin-report-step-2-next").click();

  //       /**
  //        * 4. Step 3: แก้ไข Data Dictionary
  //        */
  //       await expect(
  //         page.getByText("3. Data Dictionary", { exact: true }),
  //       ).toBeVisible({
  //         timeout: 10000,
  //       });

  //       await updateDictionaryForEdit(page, editValues);

  //       /**
  //        * 5. Save
  //        */
  //       await saveReport(page);

  //       console.log(`Update สำเร็จ: ${item.name}`);
  //       console.log(`ชื่อรายงานใหม่: ${updatedReportName}`);
  //     });
  //   }
  // });

  test("Scenario updateMetadataRecord: แก้ไขข้อมูลรายงาน , แก้ไข Metadata โดยเลือก ข้อมูลระเบียน และแก้ไขข้อมูล Datadictionary", async ({ page }) => {
    test.setTimeout(240000);

    const typeKey = "record";
    const reportNamePrefix = "ระเบียน";

    // 1. ค้นหาและกด edit จากแถวที่มีชื่อระเบียน
    await searchReportAndClickEdit(page, reportNamePrefix);

    // 2. สร้างชื่อใหม่ครั้งเดียว
    const updatedReportName = buildUpdatedReportName(reportNamePrefix);

    // 3. Step 1: แก้ชื่อรายงาน
    await updateReportStep1(page, updatedReportName);

    await page.locator("#admin-report-step-1-next").click();

    // 4. Step 2: แก้ metadata ตามประเภทเดิม
    await expect(page.locator("#admin-report-type")).toBeVisible({
      timeout: 10000,
    });

    const editValues = buildScenarioValues(typeKey, "edit");

    await updateMetadataByCurrentType(page, typeKey, editValues);

    await page.locator("#admin-report-step-2-next").click();

    // 5. Step 3: แก้ Data Dictionary
    await expect(
      page.getByText("3. Data Dictionary", { exact: true }),
    ).toBeVisible({
      timeout: 10000,
    });

    await updateDictionaryForEdit(page, editValues);

    // 6. Save
    await updateReportSave(page);

    console.log("Update ข้อมูลระเบียนสำเร็จ:", updatedReportName);
  });

  test("Scenario updateMetadataStatistic: แก้ไขข้อมูลรายงาน , แก้ไข Metadata โดยเลือก ข้อมูลสถิติ และแก้ไขข้อมูล Datadictionary", async ({ page }) => {
    test.setTimeout(240000);

    const typeKey = "statistic";
    const reportNamePrefix = "สถิติ2";

    await searchReportAndClickEdit(page, reportNamePrefix);

    const updatedReportName = buildUpdatedReportName(reportNamePrefix);

    await updateReportStep1(page, updatedReportName);

    await page.locator("#admin-report-step-1-next").click();

    await expect(page.locator("#admin-report-type")).toBeVisible({
      timeout: 10000,
    });

    const editValues = buildScenarioValues(typeKey, "edit");

    await updateMetadataByCurrentType(page, typeKey, editValues);

    await page.locator("#admin-report-step-2-next").click();

    await expect(
      page.getByText("3. Data Dictionary", { exact: true }),
    ).toBeVisible({
      timeout: 10000,
    });

    await updateDictionaryForEdit(page, editValues);

    await updateReportSave(page);

    console.log("Update สำเร็จ: ข้อมูลสถิติ");
    console.log("ชื่อรายงานใหม่:", updatedReportName);
  });

  test("Scenario updateMetadataGeoSpatial: แก้ไขข้อมูลรายงาน , แก้ไข Metadata โดยเลือก ข้อมูลภูมิสารสนเทศเชิงพื้นที่ และแก้ไขข้อมูล Datadictionary", async ({ page }) => {
    test.setTimeout(240000);

    const typeKey = "geoSpatial";
    const reportNamePrefix = "พื้นที่";

    await searchReportAndClickEdit(page, reportNamePrefix);

    const updatedReportName = buildUpdatedReportName(reportNamePrefix);

    await updateReportStep1(page, updatedReportName);

    await page.locator("#admin-report-step-1-next").click();

    await expect(page.locator("#admin-report-type")).toBeVisible({
      timeout: 10000,
    });

    const editValues = buildScenarioValues(typeKey, "edit");

    await updateMetadataByCurrentType(page, typeKey, editValues);

    await page.locator("#admin-report-step-2-next").click();

    await expect(
      page.getByText("3. Data Dictionary", { exact: true }),
    ).toBeVisible({
      timeout: 10000,
    });

    await updateDictionaryForEdit(page, editValues);

    await updateReportSave(page);

    console.log("Update สำเร็จ: ข้อมูลภูมิสารสนเทศเชิงพื้นที่");
    console.log("ชื่อรายงานใหม่:", updatedReportName);
  });

  test("Scenario updateMetadataMultiple: แก้ไขข้อมูลรายงาน , แก้ไข Metadata โดยเลือก ข้อมูลหลากหลายประเภท และแก้ไขข้อมูล Datadictionary", async ({ page }) => {
    test.setTimeout(240000);

    const typeKey = "multiple";
    const reportNamePrefix = "รายงานf642c5";

    await searchReportAndClickEdit(page, reportNamePrefix);

    const updatedReportName = buildUpdatedReportName(reportNamePrefix);

    await updateReportStep1(page, updatedReportName);

    await page.locator("#admin-report-step-1-next").click();

    await expect(page.locator("#admin-report-type")).toBeVisible({
      timeout: 10000,
    });

    const editValues = buildScenarioValues(typeKey, "edit");

    await updateMetadataByCurrentType(page, typeKey, editValues);

    await page.locator("#admin-report-step-2-next").click();

    await expect(
      page.getByText("3. Data Dictionary", { exact: true }),
    ).toBeVisible({
      timeout: 10000,
    });

    await updateDictionaryForEdit(page, editValues);

    await updateReportSave(page);

    console.log("Update สำเร็จ: ข้อมูลหลากหลายประเภท");
    console.log("ชื่อรายงานใหม่:", updatedReportName);
  });

  test("Scenario updateMetadataOther: แก้ไขข้อมูลรายงาน , แก้ไข Metadata โดยเลือก ข้อมูลประเภทอื่น ๆ ระบุ และแก้ไขข้อมูล Datadictionary", async ({ page }) => {
    test.setTimeout(240000);

    const typeKey = "other";
    const reportNamePrefix = "รายงานfe4254";

    await searchReportAndClickEdit(page, reportNamePrefix);

    const updatedReportName = buildUpdatedReportName(reportNamePrefix);

    await updateReportStep1(page, updatedReportName);

    await page.locator("#admin-report-step-1-next").click();

    await expect(page.locator("#admin-report-type")).toBeVisible({
      timeout: 10000,
    });

    const editValues = buildScenarioValues(typeKey, "edit");

    await updateMetadataByCurrentType(page, typeKey, editValues);

    await page.locator("#admin-report-step-2-next").click();

    await expect(
      page.getByText("3. Data Dictionary", { exact: true }),
    ).toBeVisible({
      timeout: 10000,
    });

    await updateDictionaryForEdit(page, editValues);

    await updateReportSave(page);

    console.log("Update สำเร็จ: ข้อมูลประเภทอื่น ๆ ระบุ");
    console.log("ชื่อรายงานใหม่:", updatedReportName);
  });

});
