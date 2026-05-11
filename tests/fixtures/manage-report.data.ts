// tests/fixtures/manage-report.data.ts

import { Page } from "@playwright/test";
import { randomText } from "../../share/randomText";
import { randomNumber } from "../../share/randomNumber";

export const loginData = {
  username: "admin",
  password: "password123",
};

export const reportStep1Data = {
  categoryTitle: "ผู้ประกันตนและประกันสังคม",
  mainTitle: "ฝึกอบรมฝีมือแรงงาน",
  subTitle: "ชุดข้อมูลร่วม",
  statusTitle: "เปิดใช้งาน",
  publishDateTitle: "2569-04-28",
  // reportNamePrefix: `รายงานทดสอบ ${randomText(5)}`,

  // edit
  reportNamePrefix: "ระเบียน",
};

// input พื้นฐาน มีทุกเหมือนกันทุกประเภทข้อมูล
// ชื่อชุดข้อมูล, ชื่อผู้ติดต่อ, อีเมลผู้ติดต่อ, คําสําคัญ, รายละเอียด, ค่าความถี่ของการปรับปรุงข้อมูล, แหล่งที่มา, เงื่อนไขในการเข้าถึงข้อมูล, ชุดข้อมูลที่มีคุณค่าสูง, ข้อมูลอ้างอิง

// select มีทุกประเภทข้อมูลเหมือนกันทุกประเภทข้อมูล
// ประเภทข้อมูล, องค์กร, วัตถุประสงค์, หน่วยความถี่ของการปรับปรุงข้อมูล, ขอบเขตเชิงภูมิศาสตร์หรือเชิงพื้นที่, รูปแบบการเก็บข้อมูล,  หมวดหมู่ข้อมูลตามธรรมาภิบาลข้อมูลภาครัฐ, สัญญาอนุญาตให้ใช้ข้อมูล 

// select เพิ่มเติมของ ประเภทข้อมูล ข้อมูลระเบียน
// เงื่อนไขในการเข้าถึงข้อมูล, URL, ผู้สนับสนุนหรือผู้ร่วมดำเนินการ, หน่วยที่ย่อยที่สุดของการจัดเก็บข้อมูล, ภาษาที่ใช้, ชุดข้อมูลที่มีคุณค่าสูง, ข้อมูลอ้างอิง

//select input เพิ่มเติมของ ประเภทข้อมูล ข้อมูลสถิติ
// เงื่อนไขในการเข้าถึงข้อมูล(input), ปีข้อมูลที่เริ่มต้นจัดทํา (Datepicker YYYY-MM-DD) ,ปีข้อมูลล่าสุดที่เผยแพร่ (Datepicker YYYY-MM-DD)  ,วันที่กําหนดเผยแพร่ข้อมูล(Datepicker YYYY-MM-DD-hh-mm)  , การจัดจำแนก(select >1 input other) ,หน่วยวัด(input) ,หน่วยตัวคูณ(Select input other) ,วิธีการคำนวณ(input) ,มาตรฐานการจัดทำข้อมูล (input),URL (input),ภาษาที่ใช้,สถิติทางการ(input)

//select input เพิ่มเติมของ ประเภทข้อมูล ข้อมูลภูมิสารสนเทศเชิงพื้นที่
// เงื่อนไขในการเข้าถึงข้อมูล(input)
// ชุดข้อมูลภูมิศาสตร์ (Select =1)
// มาตราส่วน  (Select >1 + input other)
// ค่าพิกัดกรอบพื้นที่ด้านทิศตะวันตก(input)
// ค่าพิกัดกรอบพื้นที่ด้านทิศตะวันออก(input)
// ค่าพิกัดกรอบพื้นที่ด้านทิศเหนือ(input)
// ค่าพิกัดกรอบพื้นที่ด้านทิศใต้(input)
// ความถูกต้องของตำแหน่ง(input)
// เวลาอ้างอิง(Datepicker YYYY-MM-DD-hh-mm)
// วันที่กำหนดเผยแพร่ข้อมูล(Datepicker YYYY-MM-DD-hh-mm)
// วันที่เผยแพร่ข้อมูล(Datepicker YYYY-MM-DD)
// URL
// ภาษาที่ใช้ข้อมูล


// select input ของ ข้อมูลหลากหลายประเภท , ข้อมูลประเภทอื่นๆ เห็นแค่  select input พื้นฐาน แต่ ข้อมูลประเภทอื่นๆจะมีช่อง input เพิ่มเติมให้กรอกข้อมูลประเภทอื่นๆ

export type InputType = "string" | "number" | "email" | "url" | "select";

export type InputFieldTestData = {
  selector: string;
  value?: string;
  valuePrefix?: string;
  maxLength?: number;
  inputType: InputType;
};

export type SelectTestData = {
  selector?: string;
  title: string;
  searchText?: string;
  optionText?: string;
  value: string;
  code: string;
  isOther?: boolean;
  otherInputSelector?: string;
  otherInputTestId?: string;
  otherValue?: string;
  inputType?: "select";
};

export type MultiSelectWithDetailData = SelectTestData & {
  detail?: string;
  detailSelector?: string;
  detailTestId?: string;
  extraOtherInputSelector?: string;
  extraOtherInputTestId?: string;
};

export type DateFieldTestData = {
  selector: string;
  value: string;
  format: "BBBB-MM-DD" | "BBBB-MM-DD-HH-mm";
};

export type DictInputField = {
  value: string;
  inputType: InputType;
  maxLength: number;
};

export type DictionaryRowTestData = {
  columnName: DictInputField;
  dataType: DictInputField | SelectTestData;
  sizeValue: DictInputField;
  required: boolean;
  description: DictInputField;
  sampleData: DictInputField;
};

//input ปกติ
export const metadataTypeData = {
  record: {
    selector: "#admin-report-type",
    title: "ข้อมูลระเบียน",
    searchText: "ข้อมูลระเบียน",
    optionText: "ข้อมูลระเบียน",
    value: "1",
    code: "1",
    isOther: false,
  },

  statistic: {
    selector: "#admin-report-type",
    title: "ข้อมูลสถิติ",
    searchText: "ข้อมูลสถิติ",
    optionText: "ข้อมูลสถิติ",
    value: "2",
    code: "2",
    isOther: false,
  },

  geoSpatial: {
    selector: "#admin-report-type",
    title: "ข้อมูลภูมิสารสนเทศเชิงพื้นที่",
    searchText: "ภูมิสารสนเทศ",
    optionText: "ข้อมูลภูมิสารสนเทศเชิงพื้นที่",
    value: "3",
    code: "3",
    isOther: false,
  },

  multiple: {
    selector: "#admin-report-type",
    title: "ข้อมูลหลากหลายประเภท",
    searchText: "ข้อมูลหลากหลายประเภท",
    optionText: "ข้อมูลหลากหลายประเภท",
    value: "4",
    code: "4",
    isOther: false,
  },

  other: {
    selector: "#admin-report-type",
    title: "ข้อมูลประเภทอื่น ๆ ระบุ...",
    searchText: "ข้อมูลประเภทอื่น",
    optionText: "ข้อมูลประเภทอื่น ๆ ระบุ",
    value: "5",
    code: "9",
    isOther: true,
    otherInputSelector: "#admin-report-custom-type-name",
    otherValue: `ข้อมูลประเภทอื่น ๆ ทดสอบ ${randomText(4)}`,
  },
} as const;

export const commonMetadataInputData = {
  // title: Text 150 Characters
  datasetName: {
    selector: "#admin-report-dataset-name",
    valuePrefix: "จำนวนกำลังแรงงานรวม",
    maxLength: 150,
    inputType: "string",
  },

  // maintainer: Text 150 Characters
  contactName: {
    selector: "#admin-report-contact-name",
    valuePrefix: "กองสถิติสังคม",
    maxLength: 150,
    inputType: "string",
  },

  // maintainer_email: Text 50 Characters
  contactEmail: {
    selector: "#admin-report-contact-email",
    value: `slaborfs${randomText(5)}@nso.go.th`,
    maxLength: 50,
    inputType: "email",
  },

  // tag_string: Text 200 Characters, comma separated
  keyword: {
    selector: "#admin-report-keyword",
    value: "แรงงาน,กำลังแรงงาน,#กำลังแรงงานรวม",
    maxLength: 200,
    inputType: "string",
  },

  // notes: Text 1,000 Characters
  description: {
    selector: "#admin-report-desc",
    value:
      "กำลังแรงงานรวม หมายถึง บุคคลทุกคนที่มีอายุ 15 ปีขึ้นไปในสัปดาห์แห่งการสำรวจ",
    maxLength: 1000,
    inputType: "string",
  },

  // update_frequency_interval: Number หรือเว้นว่าง
  updateFrequencyValue: {
    selector: "#admin-report-freq-value",
    value: "1",
    maxLength: 10,
    inputType: "number",
  },

  // data_source: Text 200 Characters
  source: {
    selector: "#admin-report-source",
    value: "สำรวจภาวะการทำงานของประชากร (สำนักงานสถิติแห่งชาติ)",
    maxLength: 200,
    inputType: "string",
  },


} as const;

export const accessConditionData = {
  public: {
    selector: "#admin-report-access-condition",
    value: "ไม่มี",
    // maxLength: 1000,
    inputType: "string",
  },

  nonPublic: {
    selector: "#admin-report-access-condition",
    value: "มี เฉพาะเจ้าหน้าที่ที่ได้รับอนุญาตเท่านั้น",
    // maxLength: 1000,
    inputType: "string",
  },
} as const;

export const sponsorData = [
  {
    title: "อื่น ๆ",
    searchText: "อื่น",
    optionText: "อื่น ๆ",
    value: "130",
    code: "9",
    isOther: true,

    // ใช้ input กลาง
    otherInputSelector: "#admin-report-sponsor-other-new",
    otherValue: `ผู้สนับสนุนหรือผู้ร่วมดำเนินการอื่น ๆ ทดสอบ ${randomText(4)}`,

  },
  {
    title: "สถาบันการศึกษา",
    searchText: "สถาบันการศึกษา",
    optionText: "สถาบันการศึกษา",
    value: "129",
    code: "5",
    isOther: false,
  },
  {
    title: "ผู้สนับสนุนหรือผู้ร่วมดำเนินการ19",
    searchText: "ผู้สนับสนุนหรือผู้ร่วมดำเนินการ19",
    optionText: "ผู้สนับสนุนหรือผู้ร่วมดำเนินการ19",
    value: "279",
    code: "9",
    isOther: false,
  }
] as const;

export const smallestUnitData = {
  selector: "#admin-report-smallest-unit",
  title: "อื่น ๆ ระบุ .........",
  searchText: "อื่น",
  optionText: "อื่น ๆ ระบุ",
  value: "143",
  code: "99",
  isOther: true,
  otherInputSelector: "#admin-report-smallest-unit-other",
  otherValue: `หน่วยที่ย่อยที่สุดของการจัดเก็บข้อมูลทดสอบ ${randomText(4)}`,
} as const;

export const languageData = [
  {
    title: "ไทย",
    searchText: "ไทย",
    optionText: "ไทย",
    value: "144",
    code: "01",
    isOther: false,
  },
  {
    title: "อื่น ๆ ระบุ .........",
    searchText: "อื่น",
    optionText: "อื่น ๆ ระบุ",
    value: "157",
    code: "99",
    isOther: true,
    otherInputSelector: "#admin-report-language-other-new",
    otherValue: `ภาษาที่ใช้อื่น ๆ ทดสอบ ${randomText(4)}`,
  },
  {
    title: "ภาษาที่ใช้18",
    searchText: "ภาษาที่ใช้18",
    optionText: "ภาษาที่ใช้18",
    value: "273",
    code: "99",
    isOther: false,
  }
] as const;

export const organizationData = {
  selector: "#admin-report-org",
  title: "สำนักงานปลัดสำนักนายกรัฐมนตรี",
  searchText: "สำนักงานปลัดสำนักนายกรัฐมนตรี",
  optionText: "สำนักงานปลัดสำนักนายกรัฐมนตรี",
  value: "7",
  code: "0101",
  isOther: false,
} as const;

export const objectiveData = [
  {
    title: "อื่น ๆ",
    searchText: "อื่น ๆ",
    optionText: "อื่น ๆ",
    value: "41",
    code: "99",
    isOther: true,

    otherInputSelector: "#admin-report-objective-other-new",
    otherInputTestId: "admin-report-objective-other-new",
    otherValue: `วัตถุประสงค์อื่น ๆ ทดสอบ ${randomText(4)}`,
  },
  {
    title: "ดัชนี/ตัวชี้วัดระดับ นานาชาติ",
    searchText: "ดัชนี",
    optionText: "ดัชนี/ตัวชี้วัดระดับ นานาชาติ",
    value: "39",
    code: "12",
    isOther: false,

  },
  {
    title: "วัตถุประสงค์อื่นๆ14",
    searchText: "วัตถุประสงค์อื่นๆ14",
    optionText: "วัตถุประสงค์อื่นๆ14",
    value: "256",
    code: "99",
    isOther: false,

  }
] as const;

export const updateFrequencyUnitData = {
  selector: "#admin-report-freq-unit",
  title: "อื่น ๆ ระบุ...",
  searchText: "อื่น",
  optionText: "อื่น ๆ ระบุ",
  value: "53",
  code: "X",
  isOther: true,
  otherInputSelector: "#admin-report-freq-unit-other",
  otherValue: `หน่วยความถี่ของการปรับปรุงข้อมูล ทดสอบ ${randomText(4)}`,
} as const;

export const geoCoverageData = {
  selector: "#admin-report-geo-scope",
  title: "อื่น ๆ ระบุ...",
  searchText: "อื่น",
  optionText: "อื่น ๆ ระบุ",
  value: "67",
  code: "99",
  isOther: true,
  otherInputSelector: "#admin-report-geo-scope-other",
  otherValue: `ขอบเขตเชิงภูมิศาสตร์หรือเชิงพื้นที่ทดสอบ ${randomText(4)}`,
} as const;


export const dataFormatData = [
  {
    title: "CSV",
    searchText: "CSV",
    optionText: "CSV",
    value: "70",
    code: "2",
    isOther: false,
  },
  {
    title: "อื่น ๆ ระบุ .....",
    searchText: "อื่น",
    optionText: "อื่น ๆ ระบุ",
    value: "84",
    code: "99",
    isOther: true,
    otherInputSelector: "#admin-report-format-other-new",
    otherValue: `รูปแบบการเก็บข้อมูลอื่น ๆ ทดสอบ ${randomText(4)}`,
  },
] as const;

export const dataGovernanceData = {
  public: {
    selector: "#admin-report-governance",
    title: "ข้อมูลสาธารณะ",
    searchText: "ข้อมูลสาธารณะ",
    optionText: "ข้อมูลสาธารณะ",
    value: "85",
    code: "1",
    isOther: false,
  },

  personal: {
    selector: "#admin-report-governance",
    title: "ข้อมูลส่วนบุคคล",
    searchText: "ข้อมูลส่วนบุคคล",
    optionText: "ข้อมูลส่วนบุคคล",
    value: "86",
    code: "2",
    isOther: false,
  },

  security: {
    selector: "#admin-report-governance",
    title: "ข้อมูลความมั่นคง",
    searchText: "ข้อมูลความมั่นคง",
    optionText: "ข้อมูลความมั่นคง",
    value: "87",
    code: "3",
    isOther: false,
  },

  secret: {
    selector: "#admin-report-governance",
    title: "ข้อมูลความลับทางราชการ",
    searchText: "ข้อมูลความลับทางราชการ",
    optionText: "ข้อมูลความลับทางราชการ",
    value: "88",
    code: "4",
    isOther: false,
  },
} as const;

export const licenseData = {
  selector: "#admin-report-license",
  title: "Others License",
  searchText: "Others License",
  optionText: "Others License",
  value: "95",
  code: "99",
  isOther: true,
  otherInputSelector: "#admin-report-license-other",
  otherValue: `รายละเอียดสัญญาอนุญาตให้ใช้ข้อมูล Others License ${randomText(4)}`,
} as const;

// ------------------------------
//ระเบียน
export const recordMetadataData = {
  // เงื่อนไขในการเข้าถึงข้อมูล
  accessCondition: {
    selector: "#admin-report-access-condition",
    value: "ไม่มี",
    maxLength: 1000,
    inputType: "string",
  },

  // URL
  url: {
    selector: "#admin-report-url",
    value: `https://www.nso.go.th/ ${randomText(5)}`,
    // maxLength: 500,
    inputType: "url",
  },

  // ผู้สนับสนุนหรือผู้ร่วมดำเนินการ
  sponsor: {
    selector: "#admin-report-sponsor",
    value: `ผู้สนับสนุนหรือผู้ร่วมดำเนินการ ${randomText(5)}`,
    maxLength: 200,
    inputType: "string",
  },

  // หน่วยที่ย่อยที่สุดของการจัดเก็บข้อมูล
  smallestUnit: {
    selector: "#admin-report-smallest-unit",

  },

  // ภาษาที่ใช้
  language: {
    selector: "#admin-report-language",
  },

  // ชุดข้อมูลที่มีคุณค่าสูง
  highValueDataset: {
    id: "admin-report-high-value-dataset",
    checked: false,
  },

  // ข้อมูลอ้างอิง
  referenceData: {
    id: "admin-report-reference-data",
    checked: false,
  },
} as const;

// -----------------------------
// สถิติ
export const statisticMetadataData = {
  startDataYearType: {
    selector: "#admin-report-start-data-year-type",
    title: "ระบุปี เดือน และวัน",
    searchText: "ระบุปี เดือน และวัน",
    optionText: "ระบุปี เดือน และวัน",
    value: "DATE",
    code: "DATE",
    isOther: false,
  },

  startDataYear: {
    selector: "#admin-report-start-data-year",
    value: "2569-04-01",
    pickerValue: "2026-04-01",
    format: "BBBB-MM-DD",
  },

  latestPublishedYearType: {
    selector: "#admin-report-latest-published-year-type",
    title: "ระบุปี เดือน และวัน",
    searchText: "ระบุปี เดือน และวัน",
    optionText: "ระบุปี เดือน และวัน",
    value: "DATE",
    code: "DATE",
    isOther: false,
  },

  latestPublishedYear: {
    selector: "#admin-report-latest-published-year",
    value: "2569-04-28",
    pickerValue: "2026-04-28",
    format: "BBBB-MM-DD",
  },

  publishedDateType: {
    selector: "#admin-report-published-date-type",
    title: "ระบุวันเวลาแบบชัดเจน",
    searchText: "ระบุวันเวลาแบบชัดเจน",
    optionText: "ระบุวันเวลาแบบชัดเจน",
    value: "DATETIME",
    code: "DATETIME",
    isOther: false,
  },

  publishedDate: {
    selector: "#admin-report-published-date",
    value: "2569-04-28-09-30",
    pickerValue: "2026-04-28",
    format: "BBBB-MM-DD-HH-mm",
  },

  publishedDateText: {
    selector: "#admin-report-published-date-text",
    value: "ทุกวันที่ 3 ของเดือน เวลา 09.00 น.",
    maxLength: 1000,
    inputType: "string",
  },

  classificationData: [
    {
      title: "อื่น ๆ ระบุ .........",
      searchText: "อื่น ๆ ระบุ",
      optionText: "อื่น ๆ ระบุ",
      value: "313",
      code: "99",
      isOther: true,
      otherInputSelector: "#admin-report-classification-other-new",
      otherValue: `การจัดจำแนกอื่น ๆ ทดสอบ ${randomText(4)}`,
    },
    {
      title: "เพศ",
      searchText: "เพศ",
      optionText: "เพศ",
      value: "301",
      code: "01",
      isOther: false,
    },
  ],

  measureUnit: {
    selector: "#admin-report-measure-unit",
    value: "คน",
    maxLength: 100,
    inputType: "string",
  },

  multiplierUnit: {
    selector: "#admin-report-multiplier-unit",
    title: "อื่น ๆ ระบุ .........",
    searchText: "อื่น ๆ ระบุ",
    optionText: "อื่น ๆ ระบุ",
    value: "328",
    code: "99",
    isOther: true,
    otherInputSelector: "#admin-report-multiplier-unit-other",
    otherValue: `หน่วยตัวคูณอื่น ๆ ทดสอบ ${randomText(4)}`,
  },

  calculationMethod: {
    selector: "#admin-report-calculation-method",
    value: "วิธีการคำนวณทดสอบ",
    maxLength: 500,
    inputType: "string",
  },

  dataStandard: {
    selector: "#admin-report-data-standard",
    value: "มาตรฐานการจัดทำข้อมูลทดสอบ",
    maxLength: 200,
    inputType: "string",
  },

  url: {
    selector: "#admin-report-url",
    value: "https://playwright.dev/statistic",
    // maxLength: 100,
    inputType: "url",
  },

  languageData,

  officialStatistic: {
    id: "admin-report-official-statistic",
    checked: true,
  },
} as const;


// ---------------------------------
// ภูมิสารสนเทศเชิงพื้นที่
export const geoSpatialMetadataData = {
  geographicDataset: {
    selector: "#admin-report-geographic-dataset",
    title: "ชั้นข้อมูลแปลงที่ดิน",
    searchText: "แปลงที่ดิน",
    optionText: "ชั้นข้อมูลแปลงที่ดิน",
    value: "329",
    code: "01",
    isOther: false,
  },

  referenceTimeType: {
    selector: "#admin-report-reference-time-type",
    title: "ระบุวันเวลาแบบชัดเจน",
    searchText: "ระบุวันเวลาแบบชัดเจน",
    optionText: "ระบุวันเวลาแบบชัดเจน",
    value: "DATETIME",
    code: "DATETIME",
    isOther: false,
  },

  referenceTime: {
    selector: "#admin-report-reference-time",
    value: "2569-04-28-09-30",
    format: "BBBB-MM-DD-HH-mm",
  },

  // วันที่กำหนดเผยแพร่ข้อมูล ของ GIS แบบ DATETIME
  scheduledPublishedDateTimeType: {
    selector: "#admin-report-published-date-type-spatial",
    title: "ระบุวันเวลาแบบชัดเจน",
    searchText: "ระบุวันเวลาแบบชัดเจน",
    optionText: "ระบุวันเวลาแบบชัดเจน",
    value: "DATETIME",
    code: "DATETIME",
    isOther: false,
  },

  scheduledPublishedDateTime: {
    selector: "#admin-report-published-date-spatial",
    value: "2569-04-28-10-30",
    format: "BBBB-MM-DD-HH-mm",
  },

  // วันที่กำหนดเผยแพร่ข้อมูล ของ GIS แบบ TEXT
  scheduledPublishedDateTypeText: {
    selector: "#admin-report-published-date-type-spatial",
    title: "ระบุเป็นข้อความ",
    searchText: "ระบุเป็นข้อความ",
    optionText: "ระบุเป็นข้อความ",
    value: "TEXT",
    code: "TEXT",
    isOther: false,
  },

  scheduledPublishedDateText: {
    selector: "#admin-report-published-date-text-spatial",
    value: "ทุกวันที่ 3 ของเดือน เวลา 09.00 น.",
    maxLength: 1000,
    inputType: "string",
  },

  // วันที่เผยแพร่ข้อมูล
  dataPublishedDateType: {
    selector: "#admin-report-data-published-date-type",
    title: "ระบุวันเวลาแบบชัดเจน",
    searchText: "ระบุวันเวลาแบบชัดเจน",
    optionText: "ระบุวันเวลาแบบชัดเจน",
    value: "DATETIME",
    code: "DATETIME",
    isOther: false,
  },

  publishedDate: {
    selector: "#admin-report-data-published-date",
    value: "2569-04-28-11-30",
    format: "BBBB-MM-DD-HH-mm",
  },

  mapScaleData: [
    {
      title: "อื่น ๆ ระบุ............",
      searchText: "อื่น",
      optionText: "อื่น ๆ ระบุ",
      value: "347",
      code: "99",
      isOther: true,
      otherInputSelector: "#admin-report-map-scale-other",
      otherValue: `มาตราส่วนอื่น ๆ ทดสอบ ${randomText(4)}`,
    },
    {
      title: "1:50,000",
      searchText: "1:50",
      optionText: "1:50,000",
      value: "345",
      code: "04",
      isOther: false,
    },
  ],

  westBoundLongitude: {
    selector: "#admin-report-west-bound-longitude",
    value: "100.123456",
    maxLength: 50,
    inputType: "number",
  },

  eastBoundLongitude: {
    selector: "#admin-report-east-bound-longitude",
    value: "101.123456",
    maxLength: 50,
    inputType: "number",
  },

  northBoundLatitude: {
    selector: "#admin-report-north-bound-latitude",
    value: "14.123456",
    maxLength: 50,
    inputType: "number",
  },

  southBoundLatitude: {
    selector: "#admin-report-south-bound-latitude",
    value: "13.123456",
    maxLength: 50,
    inputType: "number",
  },

  url: {
    selector: "#admin-report-url",
    value: "https://playwright.dev/geospatial",
    maxLength: 100,
    inputType: "url",
  },

  languageData,
} as const;

export const positionalAccuracyData = {
  has: {
    selector: "#admin-report-positional-accuracy",
    title: "มี",
    searchText: "มี",
    optionText: "มี",
    value: "มี",
    code: "Y",
    isOther: true,
    otherInputSelector: "#admin-report-positional-accuracy-detail",
    otherValue: `มี ควบคุมความถูกต้องด้วย RMSEH ตามมาตรฐาน FGDS ${randomText(4)}`,
  },

  none: {
    selector: "#admin-report-positional-accuracy",
    title: "ไม่มี",
    searchText: "ไม่มี",
    optionText: "ไม่มี",
    value: "ไม่มี",
    code: "N",
    isOther: false,
  },
} as const;


export const dictionaryRows: DictionaryRowTestData[] = [
  {
    columnName: {
      value: `PERSON_ID ${randomText(4)}`,
      inputType: "string",
      maxLength: 100,
    },
    dataType: {
      value: "VARCHAR2",
      title: "DATA TYPE",
      searchText: "VARCHAR2",
      optionText: "VARCHAR2",
      code: "",
    },
    sizeValue: {
      value: `${randomNumber(3)}`,
      inputType: "number",
      maxLength: 10,
    },
    required: true,
    description: {
      value: "เลขประจำตัวประชาชน",
      inputType: "string",
      maxLength: 500,
    },
    sampleData: {
      value: "1101700200000",
      inputType: "string",
      maxLength: 500,
    },
  },
  {
    columnName: {
      value: "PERSON_NAME",
      inputType: "string",
      maxLength: 100,
    },
    dataType: {
      value: "VARCHAR2",
      title: "DATA TYPE",
      searchText: "VARCHAR2",
      optionText: "VARCHAR2",
      code: "",
    },
    sizeValue: {
      value: `${randomNumber(3)}`,

      inputType: "number",
      maxLength: 10,
    },
    required: true,
    description: {
      value: "ชื่อ-นามสกุล",
      inputType: "string",
      maxLength: 500,
    },
    sampleData: {
      value: "นายทดสอบ ระบบ",
      inputType: "string",
      maxLength: 500,
    },
  },
];

export const metadataValidationCases = [

  {
    key: "record",
    name: "ข้อมูลระเบียน",
    messages: [
      "กรุณากรอกชื่อชุดข้อมูล",
      "กรุณาเลือกองค์กร",
      "กรุณากรอกชื่อผู้ติดต่อ",
      "กรุณากรอกอีเมลผู้ติดต่อ",
      "กรุณากรอกรายละเอียด",
      "กรุณาเลือกวัตถุประสงค์",
      "กรุณาเลือกหน่วยความถี่ของการปรับปรุงข้อมูล",
      "กรุณาเลือกรูปแบบการเก็บข้อมูล",
      "กรุณาเลือกหมวดหมู่ข้อมูลตามธรรมาภิบาลข้อมูลภาครัฐ",
      "กรุณาเลือกสัญญาอนุญาตให้ใช้ข้อมูล",
      "กรุณาเลือกภาษาที่ใช้",
    ],
  },
  {
    key: "statistic",
    name: "ข้อมูลสถิติ",
    messages: [
      "กรุณากรอกชื่อชุดข้อมูล",
      "กรุณาเลือกองค์กร",
      "กรุณากรอกชื่อผู้ติดต่อ",
      "กรุณากรอกอีเมลผู้ติดต่อ",
      "กรุณากรอกรายละเอียด",
      "กรุณาเลือกวัตถุประสงค์",
      "กรุณาเลือกหน่วยความถี่ของการปรับปรุงข้อมูล",
      // "กรุณากรอกหน่วยความถี่ของการปรับปรุงข้อมูลอื่นๆ",
      "กรุณาเลือกรูปแบบการเก็บข้อมูล",
      "กรุณาเลือกหมวดหมู่ข้อมูลตามธรรมาภิบาลข้อมูลภาครัฐ",
      "กรุณาเลือกสัญญาอนุญาตให้ใช้ข้อมูล",
      "กรุณากรอกเงื่อนไขในการเข้าถึงข้อมูล",
      "กรุณาเลือกวันที่กําหนดเผยแพร่ข้อมูล",
      "กรุณาเลือกหน่วยตัวคูณ",
      "กรุณาเลือกภาษาที่ใช้",
      "กรุณาเลือกสถิติทางการ",
    ],
  },
  {
    key: "geoSpatial",
    name: "ข้อมูลภูมิสารสนเทศเชิงพื้นที่",
    messages: [
      "กรุณากรอกชื่อชุดข้อมูล",
      "กรุณาเลือกองค์กร",
      "กรุณากรอกชื่อผู้ติดต่อ",
      "กรุณากรอกอีเมลผู้ติดต่อ",
      "กรุณากรอกรายละเอียด",
      "กรุณาเลือกวัตถุประสงค์",
      "กรุณาเลือกหน่วยความถี่ของการปรับปรุงข้อมูล",
      // "กรุณากรอกหน่วยความถี่ของการปรับปรุงข้อมูลอื่นๆ",

      "กรุณาเลือกรูปแบบการเก็บข้อมูล",
      "กรุณาเลือกหมวดหมู่ข้อมูลตามธรรมาภิบาลข้อมูลภาครัฐ",
      "กรุณาเลือกสัญญาอนุญาตให้ใช้ข้อมูล",
      "กรุณากรอกเงื่อนไขในการเข้าถึงข้อมูล",
      "กรุณาเลือกชุดข้อมูลภูมิศาสตร์",
      "กรุณาเลือกมาตราส่วนของชุดข้อมูล",
      "กรุณาเลือกวันที่กําหนดเผยแพร่ข้อมูล",
      "กรุณาเลือกภาษาที่ใช้",
    ],
  },
  {
    key: "multiple",
    name: "ข้อมูลหลากหลายประเภท",
    messages: [
      "กรุณากรอกชื่อชุดข้อมูล",
      "กรุณาเลือกองค์กร",
      "กรุณากรอกชื่อผู้ติดต่อ",
      "กรุณากรอกอีเมลผู้ติดต่อ",
      "กรุณากรอกรายละเอียด",
      "กรุณาเลือกวัตถุประสงค์",
      "กรุณาเลือกหน่วยความถี่ของการปรับปรุงข้อมูล",
      // "กรุณากรอกหน่วยความถี่ของการปรับปรุงข้อมูลอื่นๆ",

      "กรุณาเลือกรูปแบบการเก็บข้อมูล",
      "กรุณาเลือกหมวดหมู่ข้อมูลตามธรรมาภิบาลข้อมูลภาครัฐ",
      "กรุณาเลือกสัญญาอนุญาตให้ใช้ข้อมูล",
    ],
  },
  {
    key: "other",
    name: "ข้อมูลประเภทอื่น ๆ ระบุ",
    messages: [
      "กรุณากรอกชื่อประเภทข้อมูล",
      "กรุณากรอกชื่อชุดข้อมูล",
      "กรุณาเลือกองค์กร",
      "กรุณากรอกชื่อผู้ติดต่อ",
      "กรุณากรอกอีเมลผู้ติดต่อ",
      "กรุณากรอกรายละเอียด",
      "กรุณาเลือกวัตถุประสงค์",
      "กรุณาเลือกหน่วยความถี่ของการปรับปรุงข้อมูล",
      "กรุณาเลือกรูปแบบการเก็บข้อมูล",
      "กรุณาเลือกหมวดหมู่ข้อมูลตามธรรมาภิบาลข้อมูลภาครัฐ",
      "กรุณาเลือกสัญญาอนุญาตให้ใช้ข้อมูล",
    ],
  },

  {
    key: "none",
    name: "ยังไม่เลือกประเภทข้อมูล",
    messages: [
      "กรุณาเลือกประเภทข้อมูล",
      "กรุณากรอกชื่อชุดข้อมูล",
      "กรุณาเลือกองค์กร",
      "กรุณากรอกชื่อผู้ติดต่อ",
      "กรุณากรอกอีเมลผู้ติดต่อ",
      "กรุณากรอกรายละเอียด",
      "กรุณาเลือกวัตถุประสงค์",
      "กรุณาเลือกหน่วยความถี่ของการปรับปรุงข้อมูล",
      "กรุณาเลือกรูปแบบการเก็บข้อมูล",
      "กรุณาเลือกหมวดหมู่ข้อมูลตามธรรมาภิบาลข้อมูลภาครัฐ",
      "กรุณาเลือกสัญญาอนุญาตให้ใช้ข้อมูล",
    ],
  },
] as const;

export const metadataOtherValidationCases = [
  {
    key: "freqUnitOther",
    name: "หน่วยความถี่ของการปรับปรุงข้อมูลอื่น ๆ",
    typeKeys: ["record", "statistic", "geoSpatial", "multiple", "other"],
    selectSelector: "#admin-report-freq-unit",
    optionText: "อื่น ๆ ระบุ",
    searchText: "อื่น",
    expectedMessage: "กรุณากรอกหน่วยความถี่ของการปรับปรุงข้อมูลอื่นๆ",
  },
  {
    key: "formatOther",
    name: "รูปแบบการเก็บข้อมูลอื่น ๆ",
    typeKeys: ["record", "statistic", "geoSpatial", "multiple", "other"],
    selectSelector: "#admin-report-format",
    optionText: "อื่น ๆ ระบุ",
    searchText: "อื่น",
    expectedMessage: "กรุณากรอกข้อมูลรูปแบบการเก็บข้อมูลอื่นๆ",
  },
  {
    key: "licenseOther",
    name: "สัญญาอนุญาตให้ใช้ข้อมูลอื่น ๆ",
    typeKeys: ["record", "statistic", "geoSpatial", "multiple", "other"],
    selectSelector: "#admin-report-license",
    optionText: "Others License",
    searchText: "Others",
    expectedMessage: "กรุณากรอกสัญญาอนุญาตให้ใช้ข้อมูลอื่นๆ",
  },
  {
    key: "geoScopeOther",
    name: "ขอบเขตเชิงภูมิศาสตร์หรือเชิงพื้นที่อื่น ๆ",
    typeKeys: ["geoSpatial"],
    selectSelector: "#admin-report-geo-scope",
    optionText: "อื่น ๆ ระบุ",
    searchText: "อื่น",
    expectedMessage: "กรุณากรอกขอบเขตเชิงภูมิศาสตร์หรือเชิงพื้นที่อื่นๆ",
  },
] as const;


//จำนวน text
export const inputLengthTestData = {
  datasetName: {
    selector: "#admin-report-dataset-name",
    value: "ทดสอบชื่อชุดข้อมูลความยาวห้าสิบตัวอักษร1234567890",
    maxLength: 150,
    counterText: "150 Characters",
  },

  contactName: {
    selector: "#admin-report-contact-name",
    value: "ทดสอบชื่อผู้ติดต่อความยาวห้าสิบตัวอักษร1234567890",
    maxLength: 150,
    counterText: "150 Characters",
  },

  contactEmail: {
    selector: "#admin-report-contact-email",
    value: "sssssssssssssssssssssssslaborfs@nso.go.th",
    maxLength: 50,
    counterText: "50 Characters",
  },


};

export const deleteReportData = {
  searchText: "test met1.1",
} as const;

export const additionalDictionaryRows: DictionaryRowTestData[] = [
  {
    columnName: { value: "NEW_COL_1", inputType: "string", maxLength: 100 },
    dataType: {
      value: "3",
      inputType: "select",
      title: "DATA TYPE",
      searchText: "NUMBER",
      optionText: "NUMBER",
      code: "3",
    },

    sizeValue: { value: "10", inputType: "number", maxLength: 10 },
    required: false,
    description: { value: "คอลัมน์ใหม่ 1", inputType: "string", maxLength: 500 },
    sampleData: { value: "999", inputType: "string", maxLength: 500 },
  },
  {
    columnName: { value: "NEW_COL_2", inputType: "string", maxLength: 100 },
    dataType: {
      value: "4",
      inputType: "select",
      title: "DATA TYPE",
      searchText: "DATE",
      optionText: "DATE",
      code: "4",
    },
    sizeValue: { value: "", inputType: "number", maxLength: 10 },
    required: true,
    description: { value: "คอลัมน์ใหม่ 2", inputType: "string", maxLength: 500 },
    sampleData: { value: "2024-01-01", inputType: "string", maxLength: 500 },
  },
];

export async function clearBrowserState(page: Page) {
  await page.context().clearCookies();

  await page.goto("/login", { waitUntil: "domcontentloaded" });

  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}


