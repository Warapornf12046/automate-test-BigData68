// tests/managereport.spec.ts

import { test, expect, Page } from "@playwright/test";
import {
  loginData,
  reportStep1Data,
  metadataBasicData,
  objectiveData,
  generalMetadataData,
  formatData,
  recordMetadataData,
  languageData,
  dictionaryRows,
} from "./fixtures/manage-report.data";
import { randomText } from "./fixtures/test-utils";

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
}

async function selectAntdMultipleOptionBySearch(
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
}

async function fillAndExpect(page: Page, selector: string, value: string) {
  const input = page.locator(selector);

  await expect(input).toBeVisible({ timeout: 10000 });
  await input.fill(value);
  await expect(input).toHaveValue(value);
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

async function fillObjectiveItem(page: Page, item: ObjectiveItem) {
  await selectAntdMultipleOptionBySearch(
    page,
    "#admin-report-objective",
    item.searchText ?? item.title,
    item.optionText ?? item.title,
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
  row: {
    columnName: string;
    dataType: string;
    sizeValue: string;
    description: string;
    sampleData: string;
  },
) {
  await page.getByTestId(`dict-column-name-${index}`).fill(row.columnName);
  await page.getByTestId(`dict-data-type-${index}`).fill(row.dataType);
  await page.getByTestId(`dict-size-value-${index}`).fill(row.sizeValue);
  await page.getByTestId(`dict-description-${index}`).fill(row.description);
  await page.getByTestId(`dict-sample-data-${index}`).fill(row.sampleData);

  await expect(page.getByTestId(`dict-column-name-${index}`)).toHaveValue(
    row.columnName,
  );
  await expect(page.getByTestId(`dict-data-type-${index}`)).toHaveValue(
    row.dataType,
  );
  await expect(page.getByTestId(`dict-size-value-${index}`)).toHaveValue(
    row.sizeValue,
  );
  await expect(page.getByTestId(`dict-description-${index}`)).toHaveValue(
    row.description,
  );
  await expect(page.getByTestId(`dict-sample-data-${index}`)).toHaveValue(
    row.sampleData,
  );
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

async function mReportPart2(page: Page) {
  await page.locator("#admin-report-step-1-next").click();

  await selectAntdOptionByText(
    page,
    "#admin-report-type",
    metadataBasicData.typeTitle,
  );

  await fillAndExpect(
    page,
    "#admin-report-dataset-name",
    randomText(metadataBasicData.datasetNamePrefix),
  );

  await selectAntdOptionByText(
    page,
    "#admin-report-org",
    metadataBasicData.orgTitle,
  );

  await fillAndExpect(
    page,
    "#admin-report-contact-name",
    randomText(metadataBasicData.contactNamePrefix),
  );

  await fillAndExpect(
    page,
    "#admin-report-contact-email",
    metadataBasicData.contactEmail,
  );

  await fillAndExpect(page, "#admin-report-keyword", metadataBasicData.keyword);

  await fillAndExpect(page, "#admin-report-desc", metadataBasicData.description);

  for (const item of objectiveData) {
    await fillObjectiveItem(page, item);
  }

  await selectAntdOptionByText(
    page,
    "#admin-report-freq-unit",
    generalMetadataData.freqUnitTitle,
  );

  await fillAndExpect(
    page,
    "#admin-report-freq-value",
    generalMetadataData.freqValue,
  );

  await selectAntdOptionByText(
    page,
    "#admin-report-geo-scope",
    generalMetadataData.geoScopeTitle,
  );

  await fillAndExpect(
    page,
    "#admin-report-geo-scope-other",
    generalMetadataData.geoScopeOther,
  );

  await fillAndExpect(page, "#admin-report-source", generalMetadataData.source);

  for (const item of formatData) {
    await selectAntdMultipleOptionBySearch(
      page,
      "#admin-report-format",
      item.title,
    );

    await fillIfOther(page, item);
  }

  await selectAntdOptionByText(
    page,
    "#admin-report-governance",
    generalMetadataData.governanceTitle,
  );

  await selectAntdOptionByText(
    page,
    "#admin-report-license",
    generalMetadataData.licenseTitle,
  );

  await fillAndExpect(
    page,
    "#admin-report-license-other",
    generalMetadataData.licenseOther,
  );

  await fillAndExpect(
    page,
    "#admin-report-access-condition",
    recordMetadataData.accessCondition,
  );

  await fillAndExpect(page, "#admin-report-url", recordMetadataData.url);

  await selectAntdOptionByText(
    page,
    "#admin-report-sponsor",
    recordMetadataData.sponsorTitle,
  );

  await fillAndExpect(
    page,
    recordMetadataData.sponsorDetailSelector,
    recordMetadataData.sponsorDetail,
  );

  await selectAntdOptionByText(
    page,
    "#admin-report-smallest-unit",
    recordMetadataData.smallestUnitTitle,
  );

  for (const item of languageData) {
    await selectAntdMultipleOptionBySearch(
      page,
      "#admin-report-language",
      item.title,
    );

    await fillIfOther(page, item);
  }

  await setSwitch(
    page,
    "admin-report-high-value-dataset",
    recordMetadataData.highValueDataset,
  );

  await setSwitch(
    page,
    "admin-report-reference-data",
    recordMetadataData.referenceData,
  );
}

async function mReportPart3(page: Page) {
  await page.locator("#admin-report-step-2-next").click();

  await expect(page.getByText("3. Data Dictionary", { exact: true })).toBeVisible({
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

test.describe("Manage Report Page", () => {
  test.beforeEach(async ({ page }) => {
    await mLogin(page);

    await expect(page).toHaveURL(/.*manage\/admin-report/);
  });

  test("Scenario 1: เข้าหน้าจัดการรายงานได้สำเร็จ", async ({ page }) => {
    await expect(page).toHaveURL(/.*manage\/admin-report/);

    await expect(page.locator("#admin-report-add-category")).toBeVisible({
      timeout: 10000,
    });

    await expect(page.locator("#admin-report-add-main")).toBeVisible();
    await expect(page.locator("#admin-report-add-sub")).toBeVisible();
    await expect(page.locator("#admin-report-add-status")).toBeVisible();
    await expect(page.locator("#admin-report-add-date")).toBeVisible();
    await expect(page.locator("#admin-report-add-name")).toBeVisible();
  });

  test("Scenario 2: ตรวจสอบ validation เมื่อกดถัดไปโดยไม่กรอกข้อมูล", async ({
    page,
  }) => {
    await page.locator("#admin-report-step-1-next").click();

    await expect(page.getByText("กรุณาเลือกกลุ่มข้อมูล")).toBeVisible();
    await expect(page.getByText("กรุณาเลือกรายงานหลัก")).toBeVisible();
    await expect(page.getByText("กรุณาเลือกรายงานย่อย")).toBeVisible();
    await expect(page.getByText("กรุณาเลือกสถานะ")).toBeVisible();
    await expect(page.getByText("กรุณาเลือกวันที่")).toBeVisible();
    await expect(page.getByText("กรุณากรอกชื่อรายงาน")).toBeVisible();
  });

  test("Scenario 3: กรอกข้อมูลรายงาน Step 1 และไปหน้า Metadata ได้", async ({
    page,
  }) => {
    await mReportPart1(page);

    await page.locator("#admin-report-step-1-next").click();

    await expect(page.locator("#admin-report-type")).toBeVisible({
      timeout: 10000,
    });

    await expect(page.locator("#admin-report-dataset-name")).toBeVisible();
    await expect(page.locator("#admin-report-org")).toBeVisible();
    await expect(page.locator("#admin-report-contact-name")).toBeVisible();
    await expect(page.locator("#admin-report-contact-email")).toBeVisible();
  });

  test("Scenario 4: เลือกวัตถุประสงค์อื่น ๆ แล้วกรอก input และ textarea ได้", async ({
    page,
  }) => {
    await mReportPart1(page);

    await page.locator("#admin-report-step-1-next").click();

    await selectAntdOptionByText(
      page,
      "#admin-report-type",
      metadataBasicData.typeTitle,
    );

    const objective = objectiveData.find((item) => item.isOther);

    if (!objective) {
      throw new Error("ไม่พบข้อมูล objective ที่เป็น อื่น ๆ");
    }

    await fillObjectiveItem(page, objective);

    await expect(
      page.locator(`#admin-report-objective-other-${objective.value}`),
    ).toHaveValue(objective.otherValue ?? "");

    await expect(
      page.locator(`#admin-report-objective-detail-${objective.value}`),
    ).toHaveValue(`${objective.detail} (${objective.otherValue})`);
  });

  test("Scenario 5: กรอกครบทุก Step และบันทึกข้อมูลสำเร็จ", async ({
    page,
  }) => {
    await mReportPart1(page);
    await mReportPart2(page);
    await mReportPart3(page);

    await expect(page.getByText("บันทึกข้อมูลเสร็จสิ้น")).toBeVisible({
      timeout: 10000,
    });
  });
});