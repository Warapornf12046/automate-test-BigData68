// tests/fixtures/manage-report.data.ts

export const loginData = {
  username: "admin",
  password: "password123",
};

export const reportStep1Data = {
  categoryTitle: "ผู้ประกันตนและประกันสังคม",
  mainTitle: "ฝึกอบรมฝีมือแรงงาน",
  subTitle: "ชุดข้อมูลร่วม",
  statusTitle: "เปิดใช้งาน",
  publishDateTitle: "2569-04-30",
  reportNamePrefix: "รายงานทดสอบ",
};

export const metadataBasicData = {
  typeTitle: "ข้อมูลระเบียน",
  datasetNamePrefix: "ชื่อชุดข้อมูล",
  orgTitle: "สำนักงานปลัดสำนักนายกรัฐมนตรี",
  contactNamePrefix: "ชื่อผู้ติดต่อ",
  contactEmail: "slaborfs@nso.go.th",
  keyword: "คําสําคัญ,คําสําคัญ",
  description: "รายละเอียดทดสอบ Playwright",
};

export const objectiveData = [
  {
    title: "อื่น ๆ",
    searchText: "อื่นๆ",
    optionText: "อื่น ๆ",
    value: "41",
    code: "99",
    isOther: true,
    otherValue: "วัตถุประสงค์อื่น ๆ ทดสอบ",
    detail: "คำอธิบายวัตถุประสงค์ 1: อื่น ๆ",
  },
  {
    title: "ดัชนี/ตัวชี้วัดระดับ นานาชาติ",
    searchText: "ดัชนี",
    optionText: "ดัชนี/ตัวชี้วัดระดับ นานาชาติ",
    value: "39",
    code: "12",
    isOther: false,
    detail: "คำอธิบายวัตถุประสงค์ 2: ดัชนี/ตัวชี้วัดระดับ นานาชาติ",
  },
  {
    title: "ไม่ทราบ",
    searchText: "ไม่ทราบ",
    optionText: "ไม่ทราบ",
    value: "40",
    code: "98",
    isOther: false,
    detail: "คำอธิบายวัตถุประสงค์ 3: ไม่ทราบ",
  },
];

export const generalMetadataData = {
  freqUnitTitle: "ปี",
  freqValue: "1",

  geoScopeTitle: "อื่น ๆ",
  geoScopeOther: "ขอบเขตเชิงภูมิศาสตร์หรือเชิงพื้นที่ทดสอบ",

  source: "แหล่งข้อมูลทดสอบ Playwright",
  governanceTitle: "ข้อมูลสาธารณะ",

  licenseTitle: "Others License",
  licenseValue: "95",
  licenseOther: "รายละเอียดสัญญาอนุญาตให้ใช้ข้อมูล Others License",
};

export const formatData = [
  {
    title: "CSV",
    isOther: false,
  },
  {
    title: "อื่น ๆ",
    isOther: true,
    otherInputSelector: "#admin-report-format-other",
    otherValue: "รูปแบบการเก็บข้อมูลอื่น ๆ",
  },
];

export const recordMetadataData = {
  accessCondition: "เงื่อนไขการเข้าถึงทดสอบ Playwright",
  url: "https://playwright.dev/",
  sponsorTitle: "สถาบันการศึกษา",
  sponsorDetailSelector: "#admin-report-sponsor-detail-129",
  sponsorDetail: "รายละเอียดผู้สนับสนุนทดสอบ",
  smallestUnitTitle: "บุคคล",
  highValueDataset: true,
  referenceData: false,
};

export const languageData = [
  {
    title: "ไทย",
    isOther: false,
  },
  {
    title: "อื่น ๆ",
    isOther: true,
    otherInputSelector: "#admin-report-language-other",
    otherValue: "ภาษาที่ใช้อื่น ๆ",
  },
];

export const dictionaryRows = [
  {
    columnName: "PERSON_ID",
    dataType: "VARCHAR2",
    sizeValue: "13",
    description: "เลขประจำตัวประชาชน",
    sampleData: "1101700200000",
  },
  {
    columnName: "PERSON_NAME",
    dataType: "VARCHAR2",
    sizeValue: "255",
    description: "ชื่อ-นามสกุล",
    sampleData: "นายทดสอบ ระบบ",
  },
];