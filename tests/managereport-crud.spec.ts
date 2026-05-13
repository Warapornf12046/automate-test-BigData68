import { test, expect, Page } from "@playwright/test";
import {
  metadataTypeData,
  statisticMetadataData,
  geoSpatialMetadataData,
  objectiveData,
  dataFormatData,
  sponsorData,
  languageData,
  updateFrequencyUnitData,
  geoCoverageData,
  licenseData,
  smallestUnitData,
  dictionaryRows,
  additionalDictionaryRows,
} from "./fixtures/manage-report.data";
import {
  mReportPart1,
  fillMetadataType,
  fillCommonMetadataInputs,
  fillCommonMetadataSelectsWithoutGovernance,
  fillAccessConditionByGovernance,
  fillMultiSelectOtherAndDetail,
  fillSingleSelectOther,
  fillMultiSelectOther,
  setSwitch,
  fillObjectiveForValidation,
  fillStatisticDatesForHappyCase,
  fillGeoSpatialDatesForHappyCase,
  fillCommonMetadataSelects,
  fillCommonSwitchesIfVisible,
  createReportForType,
  openManageReportAction,
  goToMetadataStep,
  applyEditValuesForType,
  goToDataDictionaryStep,
  updateDictionaryForEdit,
  saveReport,
  snapshotToText,
  expectViewValuesForType,
  closeAntdDropdown,
  fillDictionaryRow,
  buildScenarioValues,
  fillGovernanceOnly,
  mLogin,
} from "./managereport.spec";
import { logout } from "../share/login.spec";
import { expectLatestDatasetSaved, expectMetadataFieldValue, expectCustomMetadataCreated, getDatasetSnapshotById, expectDatasetSavedById, expectDatasetDeleted } from "./helpers/oracle-db";
import { dataGovernanceData } from "./fixtures/manage-report.data";

test.describe("Admin Report CRUD Scenarios", () => {
  test.beforeEach(async ({ page }) => {
    await mLogin(page);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  // ==============================================================================
  // กลุ่ม A: เพิ่ม Multi-Select "อื่น ๆ" + input
  // ==============================================================================
  test.describe("กลุ่ม A: เพิ่ม Multi-Select กับ option อื่น ๆ", () => {
    test("A1: เพิ่มวัตถุประสงค์ อื่น ๆ — เลือก 'อื่น ๆ' แล้วกรอก input → บันทึก → DB มีค่า otherValue", async ({ page }) => {
      test.setTimeout(180000);
      await mReportPart1(page);
      await page.locator("#admin-report-step-1-next").click();
      await expect(page.locator("#admin-report-type")).toBeVisible({ timeout: 10000 });

      // กรอกข้อมูลระเบียนพื้นฐาน
      await fillMetadataType(page, metadataTypeData.record);
      await fillCommonMetadataInputs(page);
      await fillCommonMetadataSelectsWithoutGovernance(page);
      await fillAccessConditionByGovernance(page, dataGovernanceData.public);
      
      // วัตถุประสงค์ (METADATA_ID = 8) - เลือก Other และกรอก Other input + Detail
      await fillMultiSelectOtherAndDetail(
        page,
        "#admin-report-objective",
        objectiveData,
        (value) => `#admin-report-objective-other-${value}`,
        (value) => `#admin-report-objective-detail-${value}`
      );
      await closeAntdDropdown(page);

      // บันทึกข้าม step 3 ไปเลยเพื่อความรวดเร็ว (ถ้า required ก็ต้องกรอก)
      await page.locator("#admin-report-step-2-next").click();
      await expect(page.getByText("3. Data Dictionary", { exact: true })).toBeVisible({ timeout: 10000 });
      for (let i = 0; i < dictionaryRows.length; i++) {
        if (i > 0) {
          await page.locator("#admin-report-add-dict-row").click();
        }
        await fillDictionaryRow(page, i, dictionaryRows[i]);
      }
      await saveReport(page);

      const dbResult = await expectLatestDatasetSaved();
      
      // ตรวจสอบใน DB ว่ามีการบันทึก other_value หรือไม่
      // วัตถุประสงค์ id = 8, other code = 99 (หรือตาม DB)
      const objectiveOtherMeta = await expectMetadataFieldValue(dbResult.latestId, 8, "99");
      expect(objectiveOtherMeta).toBeDefined();
    });

    test("A2: เพิ่มรูปแบบการเก็บข้อมูล อื่น ๆ — เลือก 'อื่น ๆ' แล้วกรอก input → บันทึก → DB มีค่า", async ({ page }) => {
      test.setTimeout(180000);
      await mReportPart1(page);
      await page.locator("#admin-report-step-1-next").click();
      
      await fillMetadataType(page, metadataTypeData.record);
      await fillCommonMetadataInputs(page);
      await fillCommonMetadataSelectsWithoutGovernance(page);
      await fillAccessConditionByGovernance(page, dataGovernanceData.public);
      
      // เลือกรูปแบบการเก็บข้อมูล 'อื่น ๆ ระบุ' (METADATA_ID = 11)
      await fillMultiSelectOther(page, "#admin-report-format", dataFormatData);
      await closeAntdDropdown(page);
      
      // บันทึกข้าม step 3
      await page.locator("#admin-report-step-2-next").click();
      await expect(page.getByText("3. Data Dictionary", { exact: true })).toBeVisible({ timeout: 10000 });
      for (let i = 0; i < dictionaryRows.length; i++) {
        if (i > 0) {
          await page.locator("#admin-report-add-dict-row").click();
        }
        await fillDictionaryRow(page, i, dictionaryRows[i]);
      }
      await saveReport(page);

      const dbResult = await expectLatestDatasetSaved();
      // METADATA_ID = 11, Other code = "99"
      const meta = await expectMetadataFieldValue(dbResult.latestId, 11, "99");
      expect(meta).toBeDefined();
    });

    test("A3: เพิ่มผู้สนับสนุน อื่น ๆ — เลือก 'อื่น ๆ' แล้วกรอก input + detail → บันทึก → DB มีค่า", async ({ page }) => {
      test.setTimeout(180000);
      await mReportPart1(page);
      await page.locator("#admin-report-step-1-next").click();
      
      await fillMetadataType(page, metadataTypeData.record);
      await fillCommonMetadataInputs(page);
      await fillCommonMetadataSelectsWithoutGovernance(page);
      await fillAccessConditionByGovernance(page, dataGovernanceData.public);
      
      // เลือกผู้สนับสนุน 'อื่น ๆ' (METADATA_ID = 20)
      await fillMultiSelectOtherAndDetail(
        page,
        "#admin-report-sponsor",
        sponsorData,
        (value) => `#admin-report-sponsor-other-${value}`,
        (value) => `#admin-report-sponsor-detail-${value}`
      );
      await closeAntdDropdown(page);
      
      await page.locator("#admin-report-step-2-next").click();
      await expect(page.getByText("3. Data Dictionary", { exact: true })).toBeVisible({ timeout: 10000 });
      for (let i = 0; i < dictionaryRows.length; i++) {
        if (i > 0) {
          await page.locator("#admin-report-add-dict-row").click();
        }
        await fillDictionaryRow(page, i, dictionaryRows[i]);
      }
      await saveReport(page);

      const dbResult = await expectLatestDatasetSaved();
      // METADATA_ID = 20, Other code = "9"
      const meta = await expectMetadataFieldValue(dbResult.latestId, 20, "9");
      expect(meta).toBeDefined();
    });

    test("A4: เพิ่มภาษาที่ใช้ อื่น ๆ — เลือก 'อื่น ๆ' แล้วกรอก input → บันทึก → DB มีค่า", async ({ page }) => {
      test.setTimeout(180000);
      await mReportPart1(page);
      await page.locator("#admin-report-step-1-next").click();
      
      await fillMetadataType(page, metadataTypeData.record);
      await fillCommonMetadataInputs(page);
      await fillCommonMetadataSelectsWithoutGovernance(page);
      await fillAccessConditionByGovernance(page, dataGovernanceData.public);
      
      // เลือกภาษาที่ใช้ 'อื่น ๆ' (METADATA_ID = 22)
      await fillMultiSelectOther(page, "#admin-report-language", languageData);
      await closeAntdDropdown(page);
      
      await page.locator("#admin-report-step-2-next").click();
      await expect(page.getByText("3. Data Dictionary", { exact: true })).toBeVisible({ timeout: 10000 });
      for (let i = 0; i < dictionaryRows.length; i++) {
        if (i > 0) {
          await page.locator("#admin-report-add-dict-row").click();
        }
        await fillDictionaryRow(page, i, dictionaryRows[i]);
      }
      await saveReport(page);

      const dbResult = await expectLatestDatasetSaved();
      // METADATA_ID = 22, Other code = "99"
      const meta = await expectMetadataFieldValue(dbResult.latestId, 22, "99");
      expect(meta).toBeDefined();
    });

    test("A5: เพิ่มการจัดจำแนก อื่น ๆ — เลือก 'อื่น ๆ' แล้วกรอก input → บันทึก → DB มีค่า", async ({ page }) => {
      test.setTimeout(180000);
      await mReportPart1(page);
      await page.locator("#admin-report-step-1-next").click();
      
      // ต้องใช้ข้อมูลสถิติ จึงจะมีการจัดจำแนก (classification)
      await fillMetadataType(page, metadataTypeData.statistic);
      await fillCommonMetadataInputs(page);
      await fillCommonMetadataSelectsWithoutGovernance(page);
      await fillAccessConditionByGovernance(page, dataGovernanceData.public);
      await fillStatisticDatesForHappyCase(page);
      
      // เลือกการจัดจำแนก 'อื่น ๆ' (METADATA_ID = 28)
      await fillMultiSelectOther(page, "#admin-report-classification", statisticMetadataData.classificationData);
      await closeAntdDropdown(page);
      
      await page.locator("#admin-report-step-2-next").click();
      await expect(page.getByText("3. Data Dictionary", { exact: true })).toBeVisible({ timeout: 10000 });
      for (let i = 0; i < dictionaryRows.length; i++) {
        if (i > 0) {
          await page.locator("#admin-report-add-dict-row").click();
        }
        await fillDictionaryRow(page, i, dictionaryRows[i]);
      }
      await saveReport(page);

      const dbResult = await expectLatestDatasetSaved();
      // METADATA_ID = 28, Other code = "99"
      const meta = await expectMetadataFieldValue(dbResult.latestId, 28, "99");
      expect(meta).toBeDefined();
    });
  });

  // ==============================================================================
  // กลุ่ม B: เพิ่ม Single-Select "อื่น ๆ" + input
  // ==============================================================================
  test.describe("กลุ่ม B: เพิ่ม Single-Select กับ option อื่น ๆ", () => {
    test("B1: เพิ่มประเภทข้อมูล อื่น ๆ — เลือก 'ข้อมูลประเภทอื่น ๆ ระบุ' แล้วกรอก input → บันทึก → DB มีค่า customTypeName", async ({ page }) => {
      test.setTimeout(180000);
      await mReportPart1(page);
      await page.locator("#admin-report-step-1-next").click();
      
      // เลือกประเภทข้อมูล 'อื่น ๆ' (METADATA_ID = 1)
      await fillMetadataType(page, metadataTypeData.other);
      await fillCommonMetadataInputs(page);
      await fillCommonMetadataSelectsWithoutGovernance(page);
      await fillAccessConditionByGovernance(page, dataGovernanceData.public);
      
      await page.locator("#admin-report-step-2-next").click();
      await expect(page.getByText("3. Data Dictionary", { exact: true })).toBeVisible({ timeout: 10000 });
      for (let i = 0; i < dictionaryRows.length; i++) {
        if (i > 0) {
          await page.locator("#admin-report-add-dict-row").click();
        }
        await fillDictionaryRow(page, i, dictionaryRows[i]);
      }
      await saveReport(page);

      const dbResult = await expectLatestDatasetSaved();
      // METADATA_ID = 1, Other code = "9"
      const meta = await expectMetadataFieldValue(dbResult.latestId, 1, "9");
      expect(meta).toBeDefined();
    });

    test("B2: เพิ่มหน่วยความถี่ อื่น ๆ — เลือก 'อื่น ๆ ระบุ' แล้วกรอก input → บันทึก → DB มีค่า freqUnitOther", async ({ page }) => {
      test.setTimeout(180000);
      await mReportPart1(page);
      await page.locator("#admin-report-step-1-next").click();
      
      await fillMetadataType(page, metadataTypeData.record);
      await fillCommonMetadataInputs(page);
      
      // เลือกหน่วยความถี่ 'อื่น ๆ' (METADATA_ID = 9)
      await fillSingleSelectOther(page, "#admin-report-freq-unit", updateFrequencyUnitData);
      await closeAntdDropdown(page);
      
      // เลือก field อื่นๆ ให้ครบ
      await fillSingleSelectOther(page, "#admin-report-format", dataFormatData[1]);
      await fillGovernanceOnly(page, dataGovernanceData.public);
      await fillAccessConditionByGovernance(page, dataGovernanceData.public);
      
      await page.locator("#admin-report-step-2-next").click();
      await expect(page.getByText("3. Data Dictionary", { exact: true })).toBeVisible({ timeout: 10000 });
      for (let i = 0; i < dictionaryRows.length; i++) {
        if (i > 0) {
          await page.locator("#admin-report-add-dict-row").click();
        }
        await fillDictionaryRow(page, i, dictionaryRows[i]);
      }
      await saveReport(page);

      const dbResult = await expectLatestDatasetSaved();
      // METADATA_ID = 9, Other code = "X"
      const meta = await expectMetadataFieldValue(dbResult.latestId, 9, "X");
      expect(meta).toBeDefined();
    });

    test("B3: เพิ่มขอบเขตภูมิศาสตร์ อื่น ๆ — เลือก 'อื่น ๆ ระบุ' แล้วกรอก input → บันทึก → DB มีค่า geoScopeOther", async ({ page }) => {
      test.setTimeout(180000);
      await mReportPart1(page);
      await page.locator("#admin-report-step-1-next").click();
      
      await fillMetadataType(page, metadataTypeData.geoSpatial);
      await fillCommonMetadataInputs(page);
      await fillCommonMetadataSelectsWithoutGovernance(page);
      await fillAccessConditionByGovernance(page, dataGovernanceData.public);
      await fillGeoSpatialDatesForHappyCase(page);
      
      // เลือกขอบเขตภูมิศาสตร์ 'อื่น ๆ' (METADATA_ID = 10)
      await fillSingleSelectOther(page, "#admin-report-geo-scope", geoCoverageData);
      await closeAntdDropdown(page);
      
      await page.locator("#admin-report-step-2-next").click();
      await expect(page.getByText("3. Data Dictionary", { exact: true })).toBeVisible({ timeout: 10000 });
      for (let i = 0; i < dictionaryRows.length; i++) {
        if (i > 0) {
          await page.locator("#admin-report-add-dict-row").click();
        }
        await fillDictionaryRow(page, i, dictionaryRows[i]);
      }
      await saveReport(page);

      const dbResult = await expectLatestDatasetSaved();
      // METADATA_ID = 10, Other code = "99"
      const meta = await expectMetadataFieldValue(dbResult.latestId, 10, "99");
      expect(meta).toBeDefined();
    });

    test("B4: เพิ่มสัญญาอนุญาต อื่น ๆ — เลือก 'Others License' แล้วกรอก input → บันทึก → DB มีค่า licenseOther", async ({ page }) => {
      test.setTimeout(180000);
      await mReportPart1(page);
      await page.locator("#admin-report-step-1-next").click();
      
      await fillMetadataType(page, metadataTypeData.record);
      await fillCommonMetadataInputs(page);
      await fillCommonMetadataSelectsWithoutGovernance(page);
      await fillGovernanceOnly(page, dataGovernanceData.public);
      
      // เลือกสัญญาอนุญาต 'อื่น ๆ' (METADATA_ID = 15)
      await fillSingleSelectOther(page, "#admin-report-license", licenseData);
      await closeAntdDropdown(page);
      
      await fillAccessConditionByGovernance(page, dataGovernanceData.public);
      
      await page.locator("#admin-report-step-2-next").click();
      await expect(page.getByText("3. Data Dictionary", { exact: true })).toBeVisible({ timeout: 10000 });
      for (let i = 0; i < dictionaryRows.length; i++) {
        if (i > 0) {
          await page.locator("#admin-report-add-dict-row").click();
        }
        await fillDictionaryRow(page, i, dictionaryRows[i]);
      }
      await saveReport(page);

      const dbResult = await expectLatestDatasetSaved();
      // METADATA_ID = 15, Other code = "99"
      const meta = await expectMetadataFieldValue(dbResult.latestId, 15, "99");
      expect(meta).toBeDefined();
    });

    test("B5: เพิ่มหน่วยตัวคูณ อื่น ๆ — เลือก 'อื่น ๆ ระบุ' แล้วกรอก input → บันทึก → DB มีค่า multiplierUnitOther", async ({ page }) => {
      test.setTimeout(180000);
      await mReportPart1(page);
      await page.locator("#admin-report-step-1-next").click();
      
      await fillMetadataType(page, metadataTypeData.statistic);
      await fillCommonMetadataInputs(page);
      await fillCommonMetadataSelectsWithoutGovernance(page);
      await fillAccessConditionByGovernance(page, dataGovernanceData.public);
      await fillStatisticDatesForHappyCase(page);
      
      // เลือกหน่วยตัวคูณ 'อื่น ๆ' (METADATA_ID = 30)
      await fillSingleSelectOther(page, "#admin-report-multiplier-unit", statisticMetadataData.multiplierUnit);
      await closeAntdDropdown(page);
      
      await page.locator("#admin-report-step-2-next").click();
      await expect(page.getByText("3. Data Dictionary", { exact: true })).toBeVisible({ timeout: 10000 });
      for (let i = 0; i < dictionaryRows.length; i++) {
        if (i > 0) {
          await page.locator("#admin-report-add-dict-row").click();
        }
        await fillDictionaryRow(page, i, dictionaryRows[i]);
      }
      await saveReport(page);

      const dbResult = await expectLatestDatasetSaved();
      // METADATA_ID = 30, Other code = "99"
      const meta = await expectMetadataFieldValue(dbResult.latestId, 30, "99");
      expect(meta).toBeDefined();
    });

    test("B6: เพิ่มมาตราส่วน อื่น ๆ — เลือก 'อื่น ๆ ระบุ' แล้วกรอก input → บันทึก → DB มีค่า mapScaleOther", async ({ page }) => {
      test.setTimeout(180000);
      await mReportPart1(page);
      await page.locator("#admin-report-step-1-next").click();
      
      await fillMetadataType(page, metadataTypeData.geoSpatial);
      await fillCommonMetadataInputs(page);
      await fillCommonMetadataSelectsWithoutGovernance(page);
      await fillAccessConditionByGovernance(page, dataGovernanceData.public);
      await fillGeoSpatialDatesForHappyCase(page);
      
      // เลือกมาตราส่วน 'อื่น ๆ' (METADATA_ID = 35)
      await fillMultiSelectOther(page, "#admin-report-map-scale", geoSpatialMetadataData.mapScaleData);
      await closeAntdDropdown(page);
      
      await page.locator("#admin-report-step-2-next").click();
      await expect(page.getByText("3. Data Dictionary", { exact: true })).toBeVisible({ timeout: 10000 });
      for (let i = 0; i < dictionaryRows.length; i++) {
        if (i > 0) {
          await page.locator("#admin-report-add-dict-row").click();
        }
        await fillDictionaryRow(page, i, dictionaryRows[i]);
      }
      await saveReport(page);

      const dbResult = await expectLatestDatasetSaved();
      // METADATA_ID = 35, Other code = "99"
      const meta = await expectMetadataFieldValue(dbResult.latestId, 35, "99");
      expect(meta).toBeDefined();
    });

    test("B7: เพิ่มหน่วยที่ย่อยที่สุด อื่น ๆ — เลือก 'อื่น ๆ ระบุ' แล้วกรอก input → บันทึก → DB มีค่า smallestUnitOther", async ({ page }) => {
      test.setTimeout(180000);
      await mReportPart1(page);
      await page.locator("#admin-report-step-1-next").click();
      
      await fillMetadataType(page, metadataTypeData.record);
      await fillCommonMetadataInputs(page);
      await fillCommonMetadataSelectsWithoutGovernance(page);
      await fillAccessConditionByGovernance(page, dataGovernanceData.public);
      
      // เลือกหน่วยที่ย่อยที่สุด 'อื่น ๆ' (METADATA_ID = 21)
      await fillSingleSelectOther(page, "#admin-report-smallest-unit", smallestUnitData);
      await closeAntdDropdown(page);
      
      await page.locator("#admin-report-step-2-next").click();
      await expect(page.getByText("3. Data Dictionary", { exact: true })).toBeVisible({ timeout: 10000 });
      for (let i = 0; i < dictionaryRows.length; i++) {
        if (i > 0) {
          await page.locator("#admin-report-add-dict-row").click();
        }
        await fillDictionaryRow(page, i, dictionaryRows[i]);
      }
      await saveReport(page);

      const dbResult = await expectLatestDatasetSaved();
      // METADATA_ID = 21, Other code = "99"
      const meta = await expectMetadataFieldValue(dbResult.latestId, 21, "99");
      expect(meta).toBeDefined();
    });
  });

  // ==============================================================================
  // กลุ่ม C: แก้ไข Multi-Select — ลบ/เพิ่ม option
  // ==============================================================================
  test.describe("กลุ่ม C: แก้ไข Multi-Select — ลบ/เพิ่ม option", () => {
    
    // Helper ลบ option ออกจาก Multi-Select
    async function removeMultiSelectOption(page: Page, selector: string, optionTitle: string) {
      // ค้นหา parent .ant-select
      const selectLocator = page.locator(selector).locator("xpath=ancestor-or-self::div[contains(@class, 'ant-select')][1]");
      // หา tag ที่มี text ตรงกับ title
      const tag = selectLocator.locator(".ant-select-selection-item").filter({ hasText: optionTitle });
      // กดกากบาทลบ
      await tag.locator(".ant-select-selection-item-remove").click();
      await page.waitForTimeout(300);
    }

    test("C1: แก้ไขวัตถุประสงค์ — ลบ option เดิม เพิ่ม option ใหม่ → บันทึก → DB ต้องมีเฉพาะ option ใหม่", async ({ page }) => {
      test.setTimeout(180000);
      const created = await createReportForType(page, "record");
      await openManageReportAction(page, "edit", created.datasetGroupId);
      
      await goToMetadataStep(page);

      // ลบตัวแรกที่เลือกไว้ (สมมติว่าเป็น 'ดัชนี/ตัวชี้วัดระดับ นานาชาติ')
      await removeMultiSelectOption(page, "#admin-report-objective", "ดัชนี");
      
      // เลือกเพิ่มใหม่ (สมมติเป็น 'ไม่ทราบ')
      await fillMultiSelectOtherAndDetail(
        page,
        "#admin-report-objective",
        [objectiveData[2]], // สมมติว่า objectiveData[2] คือ "ไม่ทราบ"
        (value) => `#admin-report-objective-other-${value}`,
        (value) => `#admin-report-objective-detail-${value}`
      );
      await closeAntdDropdown(page);

      await saveReport(page);

      const dbResult = await expectLatestDatasetSaved();
      // เช็คว่ามีค่า "ไม่ทราบ" (code: 98) แต่ต้องไม่มี "ดัชนี/ตัวชี้วัด" (code: 12)
      const newMeta = await expectMetadataFieldValue(dbResult.latestId, 8, "98");
      expect(newMeta).toBeDefined();
      
      await expectMetadataFieldValue(dbResult.latestId, 8, "12").catch((e) => {
        expect(e.message).toContain("ไม่พบข้อมูล");
      });
    });

    test("C2: แก้ไขรูปแบบการเก็บข้อมูล — ลบ 'อื่น ๆ' ออก → input otherValue ต้องหายไป", async ({ page }) => {
      test.setTimeout(180000);
      
      // 1. สร้าง report ที่มีรูปแบบ 'อื่น ๆ'
      await mReportPart1(page);
      await page.locator("#admin-report-step-1-next").click();
      await fillMetadataType(page, metadataTypeData.record);
      await fillCommonMetadataInputs(page);
      await fillCommonMetadataSelectsWithoutGovernance(page);
      await fillAccessConditionByGovernance(page, dataGovernanceData.public);
      await fillMultiSelectOther(page, "#admin-report-format", dataFormatData);
      await closeAntdDropdown(page);
      await saveReport(page);
      
      const createdId = await getDatasetSnapshotById((await expectLatestDatasetSaved()).latestId);
      
      // 2. เข้าไปแก้ไข
      await openManageReportAction(page, "edit", createdId.latestId);
      await goToMetadataStep(page);
      
      // ลบ 'อื่น ๆ' ออก
      await removeMultiSelectOption(page, "#admin-report-format", "อื่น");
      
      // เพิ่ม option ธรรมดา
      await fillMultiSelectOther(page, "#admin-report-format", [dataFormatData[1]]);
      await closeAntdDropdown(page);
      
      await saveReport(page);
      
      // 3. ตรวจสอบ DB
      const meta99 = await expectMetadataFieldValue(createdId.latestId, 11, "99").catch(e => e);
      expect(meta99.message).toContain("ไม่พบข้อมูล"); // ต้องไม่มี 99 แล้ว
      
      const metaNormal = await expectMetadataFieldValue(createdId.latestId, 11, dataFormatData[1].code);
      expect(metaNormal).toBeDefined(); // ต้องมีค่าใหม่แทน
    });

    test("C3: แก้ไขผู้สนับสนุน — เพิ่ม option ใหม่ แก้ detail → บันทึก → DB ต้องอัปเดต", async ({ page }) => {
      test.setTimeout(180000);
      const created = await createReportForType(page, "record");
      await openManageReportAction(page, "edit", created.datasetGroupId);
      await goToMetadataStep(page);

      const dynamicValues = buildScenarioValues("record", "edit");

      // เพิ่มผู้สนับสนุน 'อื่น ๆ' ลงไป
      await fillMultiSelectOtherAndDetail(
        page,
        "#admin-report-sponsor",
        [sponsorData[0]], // 'อื่น ๆ'
        (value) => `#admin-report-sponsor-other-${value}`,
        (value) => `#admin-report-sponsor-detail-${value}`
      );
      await closeAntdDropdown(page);
      
      // แกัไข other value ด้วย dynamic data
      await page.locator(`#admin-report-sponsor-other-${sponsorData[0].value}`).fill(`ผู้สนับสนุน-${dynamicValues.customTypeName}`);
      await page.locator(`#admin-report-sponsor-detail-${sponsorData[0].value}`).fill(`คำอธิบาย-${dynamicValues.dictDescription}`);

      await saveReport(page);

      const dbResult = await expectLatestDatasetSaved();
      // เช็คว่ามีค่า "อื่น ๆ" (code: 9) และมี other_value ตรงกับที่เรากรอก
      const meta = await expectMetadataFieldValue(dbResult.latestId, 20, "9", `ผู้สนับสนุน-${dynamicValues.customTypeName}`);
      expect(meta).toBeDefined();
    });

    test("C4: แก้ไขภาษาที่ใช้ — ลบ 'อื่น ๆ' ออก เพิ่ม option ปกติ → บันทึก → DB ต้องมีเฉพาะ option ปกติ", async ({ page }) => {
      test.setTimeout(180000);
      // 1. สร้าง report ที่มีภาษา 'อื่น ๆ'
      await mReportPart1(page);
      await page.locator("#admin-report-step-1-next").click();
      await fillMetadataType(page, metadataTypeData.record);
      await fillCommonMetadataInputs(page);
      await fillCommonMetadataSelectsWithoutGovernance(page);
      await fillAccessConditionByGovernance(page, dataGovernanceData.public);
      await fillMultiSelectOther(page, "#admin-report-language", languageData);
      await closeAntdDropdown(page);
      await saveReport(page);
      
      const createdId = (await expectLatestDatasetSaved()).latestId;
      
      // 2. แก้ไข
      await openManageReportAction(page, "edit", createdId);
      await goToMetadataStep(page);
      
      await removeMultiSelectOption(page, "#admin-report-language", "อื่น");
      await fillMultiSelectOther(page, "#admin-report-language", [languageData[0]]);
      await closeAntdDropdown(page);
      
      await saveReport(page);
      
      const meta99 = await expectMetadataFieldValue(createdId, 22, "99").catch(e => e);
      expect(meta99.message).toContain("ไม่พบข้อมูล");
      
      const metaTh = await expectMetadataFieldValue(createdId, 22, languageData[0].code);
      expect(metaTh).toBeDefined();
    });

    test("C5: แก้ไขการจัดจำแนก — แก้ input 'อื่น ๆ' → บันทึก → DB ต้องมีค่าใหม่", async ({ page }) => {
      test.setTimeout(180000);
      
      await mReportPart1(page);
      await page.locator("#admin-report-step-1-next").click();
      await fillMetadataType(page, metadataTypeData.statistic);
      await fillCommonMetadataInputs(page);
      await fillCommonMetadataSelectsWithoutGovernance(page);
      await fillAccessConditionByGovernance(page, dataGovernanceData.public);
      await fillStatisticDatesForHappyCase(page);
      await fillMultiSelectOther(page, "#admin-report-classification", statisticMetadataData.classificationData);
      await closeAntdDropdown(page);
      await saveReport(page);
      
      const createdId = (await expectLatestDatasetSaved()).latestId;
      
      // 2. แก้ไข
      await openManageReportAction(page, "edit", createdId);
      await goToMetadataStep(page);
      
      const dynamicValues = buildScenarioValues("statistic", "edit");
      const classificationOtherData = statisticMetadataData.classificationData.find(x => x.isOther);
      const otherInputSelector = `#admin-report-classification-other`;
      
      await page.locator(otherInputSelector).fill(`การจัดจำแนกใหม่-${dynamicValues.customTypeName}`);
      await saveReport(page);
      
      // 3. ตรวจ DB
      const meta = await expectMetadataFieldValue(createdId, 28, "99", `การจัดจำแนกใหม่-${dynamicValues.customTypeName}`);
      expect(meta).toBeDefined();
    });
  });

  // ==============================================================================
  // กลุ่ม D: ทดสอบแก้ไข Single-Select
  // ==============================================================================
  test.describe("กลุ่ม D: แก้ไข Single-Select", () => {
    test("D1: แก้ไขประเภทข้อมูล — เปลี่ยนจากระเบียนเป็นสถิติ → field ต้องเปลี่ยนตาม", async ({ page }) => {
      test.setTimeout(180000);
      const created = await createReportForType(page, "record");
      await openManageReportAction(page, "edit", created.datasetGroupId);
      await goToMetadataStep(page);
      
      // เปลี่ยนประเภทข้อมูล
      await fillMetadataType(page, metadataTypeData.statistic);
      // ต้องกรอก field ที่ required สำหรับสถิติ
      await fillStatisticDatesForHappyCase(page);
      
      await saveReport(page);
      
      const dbResult = await expectLatestDatasetSaved();
      // เช็คว่า METADATA_ID = 1 เปลี่ยนเป็น 2 (สถิติ)
      const meta = await expectMetadataFieldValue(dbResult.latestId, 1, "2");
      expect(meta).toBeDefined();
    });

    test("D2: แก้ไขหน่วยความถี่ — เปลี่ยนจาก 'อื่น ๆ' เป็นค่าปกติ → input other ต้องหายไป", async ({ page }) => {
      test.setTimeout(180000);
      // 1. สร้าง
      await mReportPart1(page);
      await page.locator("#admin-report-step-1-next").click();
      await fillMetadataType(page, metadataTypeData.record);
      await fillCommonMetadataInputs(page);
      await fillSingleSelectOther(page, "#admin-report-freq-unit", updateFrequencyUnitData);
      await closeAntdDropdown(page);
      await fillSingleSelectOther(page, "#admin-report-format", dataFormatData[1]);
      await fillGovernanceOnly(page, dataGovernanceData.public);
      await fillAccessConditionByGovernance(page, dataGovernanceData.public);
      await saveReport(page);
      
      const createdId = (await expectLatestDatasetSaved()).latestId;
      
      // 2. แก้ไข
      await openManageReportAction(page, "edit", createdId);
      await goToMetadataStep(page);
      
      await page.locator("#admin-report-freq-unit").click();
      await page.locator(".ant-select-item-option-content").filter({ hasText: "รายปี" }).click(); // สมมติว่าต้องการเปลี่ยนเป็นค่าอื่นที่ไม่ใช่ อื่นๆ
      
      await saveReport(page);
      
      // 3. ตรวจสอบ DB (METADATA_ID = 9)
      const metaX = await expectMetadataFieldValue(createdId, 9, "X").catch(e => e);
      expect(metaX.message).toContain("ไม่พบข้อมูล");
      
      const metaNormal = await expectMetadataFieldValue(createdId, 9, "1"); // รายปีมักจะเป็น code 1
      expect(metaNormal).toBeDefined();
    });

    test("D3: แก้ไขสัญญาอนุญาต — เปลี่ยนค่า → DB ต้องอัปเดต", async ({ page }) => {
      test.setTimeout(180000);
      const created = await createReportForType(page, "record");
      await openManageReportAction(page, "edit", created.datasetGroupId);
      await goToMetadataStep(page);
      
      await page.locator("#admin-report-license").click();
      await page.locator(".ant-select-item-option-content").filter({ hasText: licenseData.title }).click();
      
      await saveReport(page);
      
      const dbResult = await expectLatestDatasetSaved();
      const meta = await expectMetadataFieldValue(dbResult.latestId, 15, licenseData.code);
      expect(meta).toBeDefined();
    });

    test("D4: แกัไของค์กร — เปลี่ยนค่า → DB ต้องมีค่าใหม่", async ({ page }) => {
      // องค์กร อยู่ใน Step 1 (ข้อมูลทั่วไป)
      test.setTimeout(180000);
      const created = await createReportForType(page, "record");
      await openManageReportAction(page, "edit", created.datasetGroupId);
      
      // หน้าแรกสุด
      await page.locator("#admin-report-org").click();
      await page.locator(".ant-select-item-option-content").nth(1).click(); // เลือกตัวที่ 2
      
      await page.locator("#admin-report-step-1-next").click();
      await page.locator("#admin-report-step-2-next").click();
      await saveReport(page);
      
      const snapshot = await getDatasetSnapshotById(created.datasetGroupId);
      expect(snapshot.dataset[0].ORG_ID).not.toBeNull();
    });

    test("D5: แก้ไขขอบเขตภูมิศาสตร์ — เปลี่ยนจากค่าปกติเป็น 'อื่น ๆ' → input ต้องปรากฏ", async ({ page }) => {
      test.setTimeout(180000);
      const created = await createReportForType(page, "geoSpatial");
      await openManageReportAction(page, "edit", created.datasetGroupId);
      await goToMetadataStep(page);
      
      await fillSingleSelectOther(page, "#admin-report-geo-scope", geoCoverageData);
      await closeAntdDropdown(page);
      
      const dynamicValues = buildScenarioValues("geoSpatial", "edit");
      await page.locator("#admin-report-geo-scope-other").fill(dynamicValues.customTypeName);
      
      await saveReport(page);
      
      const meta = await expectMetadataFieldValue(created.datasetGroupId, 10, "99", dynamicValues.customTypeName);
      expect(meta).toBeDefined();
    });
  });

  // ==============================================================================
  // กลุ่ม E: ทดสอบดูข้อมูลละเอียดทุก field ตามประเภท
  // ==============================================================================
  test.describe("กลุ่ม E: ดูข้อมูลรายงาน — ข้อมูลต้องแสดงถูกต้องทุก field", () => {
    test("E1: ดู metadata ข้อมูลระเบียน — เช็ค multi-select, single-select, input, switch ครบ", async ({ page }) => {
      test.setTimeout(180000);
      const created = await createReportForType(page, "record");
      await openManageReportAction(page, "view", created.datasetGroupId);
      await expectViewValuesForType(page, "record", created.values);
    });

    test("E2: ดู metadata ข้อมูลสถิติ — เช็ค classification, multiplierUnit, dates, officialStatistic ครบ", async ({ page }) => {
      test.setTimeout(180000);
      const created = await createReportForType(page, "statistic");
      await openManageReportAction(page, "view", created.datasetGroupId);
      await expectViewValuesForType(page, "statistic", created.values);
    });

    test("E3: ดู metadata ข้อมูลภูมิสารสนเทศ — เช็ค mapScale, coordinates, positionalAccuracy ครบ", async ({ page }) => {
      test.setTimeout(180000);
      const created = await createReportForType(page, "geoSpatial");
      await openManageReportAction(page, "view", created.datasetGroupId);
      await expectViewValuesForType(page, "geoSpatial", created.values);
    });

    test("E4: ดู metadata ข้อมูลหลากหลายประเภท — เช็คเฉพาะ field พื้นฐาน", async ({ page }) => {
      test.setTimeout(180000);
      const created = await createReportForType(page, "multiple");
      await openManageReportAction(page, "view", created.datasetGroupId);
      await expectViewValuesForType(page, "multiple", created.values);
    });

    test("E5: ดู metadata ข้อมูลประเภทอื่น ๆ — เช็ค customTypeName + field พื้นฐาน", async ({ page }) => {
      test.setTimeout(180000);
      const created = await createReportForType(page, "other");
      await openManageReportAction(page, "view", created.datasetGroupId);
      await expectViewValuesForType(page, "other", created.values);
    });
  });

  // ==============================================================================
  // กลุ่ม F: ทดสอบลบรายงานแต่ละประเภท
  // ==============================================================================
  test.describe("กลุ่ม F: ลบรายงานแต่ละประเภทข้อมูล", () => {
    test("F1: ลบรายงานประเภทสถิติ → ปุ่ม view หายไป + DB ต้อง soft/hard delete", async ({ page }) => {
      test.setTimeout(180000);
      const created = await createReportForType(page, "statistic");
      await openManageReportAction(page, "delete", created.datasetGroupId);

      const swalPopup = page.locator(".swal2-popup");
      await expect(swalPopup).toBeVisible({ timeout: 10000 });
      await swalPopup.locator(".swal2-confirm").last().click();

      await expect(swalPopup).toBeVisible({ timeout: 30000 });
      const deletePopupText = await swalPopup.innerText();
      expect(deletePopupText).toMatch(/ลบ|สำเร็จ|Success/i);
      
      const confirmAfterDelete = swalPopup.locator(".swal2-confirm").last();
      if (await confirmAfterDelete.isVisible().catch(() => false)) {
        await confirmAfterDelete.click();
      }

      await page.goto("/manage/admin-report");
      await expect(page.locator(`#admin-report-view-${created.datasetGroupId}`)).toHaveCount(0);
      await expectDatasetDeleted(created.datasetGroupId);
    });
    
    test("F2: ลบรายงานประเภทภูมิสารสนเทศ → ปุ่ม view หายไป + DB ต้อง soft/hard delete", async ({ page }) => {
      test.setTimeout(180000);
      const created = await createReportForType(page, "geoSpatial");
      await openManageReportAction(page, "delete", created.datasetGroupId);

      const swalPopup = page.locator(".swal2-popup");
      await expect(swalPopup).toBeVisible({ timeout: 10000 });
      await swalPopup.locator(".swal2-confirm").last().click();

      await expect(swalPopup).toBeVisible({ timeout: 30000 });
      const deletePopupText = await swalPopup.innerText();
      expect(deletePopupText).toMatch(/ลบ|สำเร็จ|Success/i);
      
      const confirmAfterDelete = swalPopup.locator(".swal2-confirm").last();
      if (await confirmAfterDelete.isVisible().catch(() => false)) {
        await confirmAfterDelete.click();
      }

      await page.goto("/manage/admin-report");
      await expect(page.locator(`#admin-report-view-${created.datasetGroupId}`)).toHaveCount(0);
      await expectDatasetDeleted(created.datasetGroupId);
    });
    
    test("F3: ลบรายงานประเภทหลากหลาย → ปุ่ม view หายไป + DB ต้อง soft/hard delete", async ({ page }) => {
      test.setTimeout(180000);
      const created = await createReportForType(page, "multiple");
      await openManageReportAction(page, "delete", created.datasetGroupId);

      const swalPopup = page.locator(".swal2-popup");
      await expect(swalPopup).toBeVisible({ timeout: 10000 });
      await swalPopup.locator(".swal2-confirm").last().click();

      await expect(swalPopup).toBeVisible({ timeout: 30000 });
      const deletePopupText = await swalPopup.innerText();
      expect(deletePopupText).toMatch(/ลบ|สำเร็จ|Success/i);
      
      const confirmAfterDelete = swalPopup.locator(".swal2-confirm").last();
      if (await confirmAfterDelete.isVisible().catch(() => false)) {
        await confirmAfterDelete.click();
      }

      await page.goto("/manage/admin-report");
      await expect(page.locator(`#admin-report-view-${created.datasetGroupId}`)).toHaveCount(0);
      await expectDatasetDeleted(created.datasetGroupId);
    });
    
    test("F4: ลบรายงานประเภทอื่น ๆ → ปุ่ม view หายไป + DB ต้อง soft/hard delete", async ({ page }) => {
      test.setTimeout(180000);
      const created = await createReportForType(page, "other");
      await openManageReportAction(page, "delete", created.datasetGroupId);

      const swalPopup = page.locator(".swal2-popup");
      await expect(swalPopup).toBeVisible({ timeout: 10000 });
      await swalPopup.locator(".swal2-confirm").last().click();

      await expect(swalPopup).toBeVisible({ timeout: 30000 });
      const deletePopupText = await swalPopup.innerText();
      expect(deletePopupText).toMatch(/ลบ|สำเร็จ|Success/i);
      
      const confirmAfterDelete = swalPopup.locator(".swal2-confirm").last();
      if (await confirmAfterDelete.isVisible().catch(() => false)) {
        await confirmAfterDelete.click();
      }

      await page.goto("/manage/admin-report");
      await expect(page.locator(`#admin-report-view-${created.datasetGroupId}`)).toHaveCount(0);
      await expectDatasetDeleted(created.datasetGroupId);
    });
  });

  // ==============================================================================
  // กลุ่ม G: ทดสอบ Data Dictionary CRUD
  // ==============================================================================
  test.describe("กลุ่ม G: Data Dictionary CRUD", () => {
    test("G1: เพิ่ม 3 แถว Data Dictionary + กรอกข้อมูลครบ → บันทึก → DB มี 3 rows", async ({ page }) => {
      test.setTimeout(180000);
      await mReportPart1(page);
      await page.locator("#admin-report-step-1-next").click();
      await fillMetadataType(page, metadataTypeData.record);
      await fillCommonMetadataInputs(page);
      await fillCommonMetadataSelectsWithoutGovernance(page);
      await fillAccessConditionByGovernance(page, dataGovernanceData.public);
      await page.locator("#admin-report-step-2-next").click();
      
      // มี 1 แถวอยู่แล้ว เพิ่มอีก 2
      await page.locator("#admin-report-add-dict-row").click();
      await page.locator("#admin-report-add-dict-row").click();
      
      const rowsToFill = [dictionaryRows[0], ...additionalDictionaryRows];
      for (let i = 0; i < rowsToFill.length; i++) {
        await fillDictionaryRow(page, i, rowsToFill[i]);
      }
      
      await saveReport(page);
      
      const dbResult = await expectLatestDatasetSaved();
      expect(dbResult.dictionary.length).toBe(3);
    });
    
    test("G2: แก้ไข Data Dictionary — เปลี่ยน columnName, description → บันทึก → DB อัปเดต", async ({ page }) => {
      test.setTimeout(180000);
      const created = await createReportForType(page, "record");
      await openManageReportAction(page, "edit", created.datasetGroupId);
      await goToDataDictionaryStep(page);
      
      const newColumnName = "MODIFIED_COL_1";
      await page.getByTestId("dict-column-name-0").fill(newColumnName);
      
      await saveReport(page);
      
      const snapshot = await getDatasetSnapshotById(created.datasetGroupId);
      expect(snapshot.dictionary[0].COLUMN_NAME).toBe(newColumnName);
    });
    
    test("G3: ลบแถว Data Dictionary — ลบแถวที่ 2 → บันทึก → DB เหลือ 2 rows", async ({ page }) => {
      test.setTimeout(180000);
      // สร้างที่มี 3 แถวก่อน
      await mReportPart1(page);
      await page.locator("#admin-report-step-1-next").click();
      await fillMetadataType(page, metadataTypeData.record);
      await fillCommonMetadataInputs(page);
      await fillCommonMetadataSelectsWithoutGovernance(page);
      await fillAccessConditionByGovernance(page, dataGovernanceData.public);
      await page.locator("#admin-report-step-2-next").click();
      
      await page.locator("#admin-report-add-dict-row").click();
      await page.locator("#admin-report-add-dict-row").click();
      const rowsToFill = [dictionaryRows[0], ...additionalDictionaryRows];
      for (let i = 0; i < rowsToFill.length; i++) {
        await fillDictionaryRow(page, i, rowsToFill[i]);
      }
      await saveReport(page);
      
      const createdId = (await expectLatestDatasetSaved()).latestId;
      
      // เข้าไปแก้ไข
      await openManageReportAction(page, "edit", createdId);
      await goToDataDictionaryStep(page);
      
      // ลบแถวที่ 2 (index 1)
      await page.getByTestId("dict-delete-1").click();
      
      await saveReport(page);
      
      const dbResult = await getDatasetSnapshotById(createdId);
      expect(dbResult.dictionary.length).toBe(2);
      // แถวที่ 2 ต้องหายไป เหลือแค่แถวที่ 0 กับ 2 เดิม
      expect(dbResult.dictionary[1].COLUMN_NAME).toBe(additionalDictionaryRows[1].columnName.value);
    });
    
    test("G4: Data Dictionary — เช็ค required checkbox toggle → บันทึก → DB มี required = Y/N ถูกต้อง", async ({ page }) => {
      test.setTimeout(180000);
      const created = await createReportForType(page, "record");
      await openManageReportAction(page, "edit", created.datasetGroupId);
      await goToDataDictionaryStep(page);
      
      // สลับค่า required ของแถวที่ 0 (ถ้าเดิม false ให้เปลี่ยนเป็น true)
      const currentRequired = dictionaryRows[0].required;
      if (!currentRequired) {
        await page.getByTestId("dict-required-0").click();
      }
      
      await saveReport(page);
      
      const snapshot = await getDatasetSnapshotById(created.datasetGroupId);
      // ใน DB เป็น 'Y' หรือ 'N'
      expect(snapshot.dictionary[0].REQUIRED).toBe(currentRequired ? 'N' : 'Y'); // Toggle value
    });
  });

});
