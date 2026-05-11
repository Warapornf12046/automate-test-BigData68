// tests/helpers/oracle-db.ts

import oracledb from "oracledb";
import dotenv from "dotenv";
import path from "path";

// โหลด .env จาก root ของ project
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Mapping ของ METADATA_ID กับ CODE ที่ใช้สำหรับ "อื่น ๆ"
// METADATA_ID 1 = ประเภทข้อมูล (type) → customTypeName input field
// METADATA_ID 8 = ?
// METADATA_ID 9 = หน่วยความถี่ของการปรับปรุงข้อมูล → updateFrequencyUnit
// ... และอื่น ๆ
const OTHER_METADATA_CODES: Record<number, string> = {
  1: "9",    // ประเภทข้อมูล (type) - customTypeName
  8: "99",
  9: "X",    // หน่วยความถี่ของการปรับปรุงข้อมูล
  11: "99",
  13: "99",
  15: "99",
  20: "9",   // วัตถุประสงค์ (objective)
  21: "99",
  22: "99",
  28: "99",
  30: "99",
  35: "99",
};

// Helper function สำหรับดึง code จาก METADATA_ID
export function getOtherMetadataCode(metadataId: number): string | undefined {
  return OTHER_METADATA_CODES[metadataId];
}

export async function getOracleConnection() {
  // ตรวจสอบว่า environment variables ถูกโหลดหรือไม่
  if (!process.env.ORACLE_USER || !process.env.ORACLE_PASSWORD) {
    console.error("Environment variables not loaded:");
    console.error("ORACLE_USER:", process.env.ORACLE_USER);
    console.error("ORACLE_PASSWORD:", process.env.ORACLE_PASSWORD ? "***" : "undefined");
    console.error("ORACLE_CONNECT_STRING:", process.env.ORACLE_CONNECT_STRING);
    throw new Error("Missing Oracle connection environment variables");
  }

  return await oracledb.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING,
  });
}

export async function getLatestDatasetGroupId() {
  const connection = await getOracleConnection();
  try {
    const result = await connection.execute(
      `
      SELECT DATASET_GROUPS_ID
      FROM TB_DATASET_GROUPS
      ORDER BY DATASET_GROUPS_ID DESC
      FETCH FIRST 1 ROWS ONLY
      `,
      [],
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      },
    );

    const row = result.rows?.[0] as
      | { DATASET_GROUPS_ID?: number }
      | undefined;

    if (!row?.DATASET_GROUPS_ID) {
      throw new Error("ไม่พบข้อมูลล่าสุดใน TB_DATASET_GROUPS");
    }

    return row.DATASET_GROUPS_ID;
  } finally {
    await connection.close();
  }
}

export async function expectLatestDatasetSaved() {
  const latestId = await getLatestDatasetGroupId();
  return await expectDatasetSavedById(latestId);
}

export async function getDatasetSnapshotById(datasetGroupId: number) {
  const connection = await getOracleConnection();

  try {
    const datasetResult = await connection.execute(
      `
      SELECT *
      FROM TB_DATASET_GROUPS
      WHERE DATASET_GROUPS_ID = :id
      `,
      { id: datasetGroupId },
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      },
    );

    const metadataResult = await connection.execute(
      `
      SELECT *
      FROM TB_DATASET_GROUPS_METAD
      WHERE DATASET_GROUPS_ID = :id
      ORDER BY DATASET_GROUPS_METAD_ID
      `,
      { id: datasetGroupId },
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      },
    );

    const dictResult = await connection.execute(
      `
      SELECT *
      FROM TB_DATASET_GROUPS_DICT
      WHERE DATASET_GROUPS_ID = :id
      ORDER BY ORDER_NO, DICT_ID
      `,
      { id: datasetGroupId },
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      },
    );

    return {
      latestId: datasetGroupId,
      dataset: (datasetResult.rows as any[]) ?? [],
      metadata: (metadataResult.rows as any[]) ?? [],
      dictionary: (dictResult.rows as any[]) ?? [], // ใช้ชื่อ dictionary ให้ตรงกับที่ spec เรียก
    };
  } finally {
    await connection.close();
  }
}

export async function expectDatasetSavedById(datasetGroupId: number) {
  const snapshot = await getDatasetSnapshotById(datasetGroupId);

  if (snapshot.dataset.length !== 1) {
    throw new Error(
      `ไม่พบข้อมูลใน TB_DATASET_GROUPS สำหรับ DATASET_GROUPS_ID ${datasetGroupId}`,
    );
  }

  if (snapshot.metadata.length === 0) {
    throw new Error(
      `ไม่พบข้อมูลใน TB_DATASET_GROUPS_METAD สำหรับ DATASET_GROUPS_ID ${datasetGroupId}`,
    );
  }

  if (snapshot.dictionary.length === 0) {
    throw new Error(
      `ไม่พบข้อมูลใน TB_DATASET_GROUPS_DICT สำหรับ DATASET_GROUPS_ID ${datasetGroupId}`,
    );
  }

  return snapshot;
}

export async function expectMetadataFieldValue(
  datasetGroupId: number,
  metadataId: number,
  expectedValue: string | null,
  expectedOtherValue?: string | null,
) {
  const connection = await getOracleConnection();

  try {
    const result = await connection.execute(
      `
      SELECT *
      FROM TB_DATASET_GROUPS_METAD
      WHERE DATASET_GROUPS_ID = :datasetGroupId
        AND METADATA_ID = :metadataId
      `,
      { datasetGroupId, metadataId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    const rows = result.rows as any[];
    
    if (expectedValue === null) {
      if (rows && rows.length > 0) {
        throw new Error(
          `คาดหวังว่า METADATA_ID ${metadataId} จะไม่มีค่า (null) แต่พบข้อมูล ${rows.length} แถว`,
        );
      }
      return;
    }

    if (!rows || rows.length === 0) {
      throw new Error(
        `ไม่พบข้อมูลใน TB_DATASET_GROUPS_METAD สำหรับ METADATA_ID ${metadataId}`,
      );
    }

    // Check if the expected value exists among the rows
    const match = rows.find((row) => {
      const valueMatch = row.METADATA_VALUE === expectedValue;
      if (expectedOtherValue !== undefined && expectedOtherValue !== null) {
        return valueMatch && row.OTHER_VALUE === expectedOtherValue;
      }
      return valueMatch;
    });

    if (!match) {
      throw new Error(
        `ค่า METADATA_ID ${metadataId} ไม่ตรงตามคาดหวัง\nคาดหวัง: ${expectedValue} (other: ${expectedOtherValue})\nพบจริง: ${JSON.stringify(rows.map((r) => ({ value: r.METADATA_VALUE, other: r.OTHER_VALUE })))}`,
      );
    }

    return match;
  } finally {
    await connection.close();
  }
}



export async function expectDatasetDeleted(datasetGroupId: number) {
  const snapshot = await getDatasetSnapshotById(datasetGroupId);
  const datasetRow = snapshot.dataset[0] as
    | { STATUS?: string | null }
    | undefined;

  const isHardDeleted =
    snapshot.dataset.length === 0 &&
    snapshot.metadata.length === 0 &&
    snapshot.dictionary.length === 0;

  const isSoftDeleted =
    snapshot.dataset.length === 1 && datasetRow?.STATUS !== "Y";

  if (!isHardDeleted && !isSoftDeleted) {
    throw new Error(
      [
        `คาดว่าข้อมูล DATASET_GROUPS_ID ${datasetGroupId} ถูกลบหรือปิดใช้งานแล้ว`,
        `TB_DATASET_GROUPS: ${snapshot.dataset.length} row(s)`,
        `TB_DATASET_GROUPS_METAD: ${snapshot.metadata.length} row(s)`,
        `TB_DATASET_GROUPS_DICT: ${snapshot.dictionary.length} row(s)`,
        `STATUS: ${datasetRow?.STATUS ?? "(none)"}`,
      ].join("\n"),
    );
  }

  return snapshot;
}

export async function expectOtherMetadataExists(
  metadataName: string,
  code: string = "X",
) {
  const connection = await getOracleConnection();

  try {
    const result = await connection.execute(
      `
      SELECT *
      FROM MS_METADATA_LIST
      WHERE METADATA_LIST_CODE = :code
        AND LOWER(METADATA_LIST_NAME) LIKE LOWER(:name)
      `,
      {
        code,
        name: `%${metadataName}%`,
      },
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      },
    );

    if (!result.rows || result.rows.length === 0) {
      throw new Error(
        `ไม่พบข้อมูล "อื่น ๆ" (code=${code}) ใน MS_METADATA_LIST สำหรับ: ${metadataName}`,
      );
    }

    console.log(`  ✓ พบข้อมูล "อื่น ๆ" ใน MS_METADATA_LIST: ${result.rows.length} row(s)`);
    return result.rows;
  } finally {
    await connection.close();
  }
}

// ตรวจสอบว่ามีข้อมูล "อื่น ๆ" ใน MS_METADATA_LIST โดยใช้ METADATA_ID
export async function expectOtherMetadataExistsByMetadataId(
  metadataId: number,
  metadataName: string,
) {
  const code = getOtherMetadataCode(metadataId);
  
  if (!code) {
    throw new Error(
      `ไม่พบ CODE สำหรับ METADATA_ID ${metadataId} ใน OTHER_METADATA_CODES mapping`,
    );
  }

  return await expectOtherMetadataExists(metadataName, code);
}

export async function expectLatestOtherMetadataCreated(code: string = "X") {
  const connection = await getOracleConnection();

  try {
    const result = await connection.execute(
      `
      SELECT *
      FROM MS_METADATA_LIST
      WHERE METADATA_LIST_CODE = :code
        AND CREATE_BY = 'System'
      ORDER BY CREATE_DATE DESC
      FETCH FIRST 5 ROWS ONLY
      `,
      { code },
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      },
    );

    if (!result.rows || result.rows.length === 0) {
      console.log(`  ℹ️  ไม่พบข้อมูล "อื่น ๆ" (code=${code}) ที่สร้างโดย System ใน MS_METADATA_LIST`);
      return [];
    }

    console.log(`  ✓ พบข้อมูล "อื่น ๆ" ที่สร้างล่าสุด: ${result.rows.length} row(s)`);
    result.rows.forEach((row: any) => {
      console.log(`    - ${row.METADATA_LIST_NAME} (ID: ${row.METADATA_LIST_ID})`);
    });

    return result.rows;
  } finally {
    await connection.close();
  }
}

// ดึงข้อมูล "อื่น ๆ" ทั้งหมดที่สร้างล่าสุดจากทุก METADATA_ID
export async function expectAllLatestOtherMetadataCreated() {
  const connection = await getOracleConnection();

  try {
    // สร้าง list ของ codes ทั้งหมด
    const codes = Array.from(new Set(Object.values(OTHER_METADATA_CODES)));
    const codesList = codes.map(c => `'${c}'`).join(", ");

    const result = await connection.execute(
      `
      SELECT *
      FROM MS_METADATA_LIST
      WHERE METADATA_LIST_CODE IN (${codesList})
        AND CREATE_BY = 'System'
      ORDER BY CREATE_DATE DESC
      FETCH FIRST 10 ROWS ONLY
      `,
      {},
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      },
    );

    if (!result.rows || result.rows.length === 0) {
      console.log(`  ℹ️  ไม่พบข้อมูล "อื่น ๆ" ที่สร้างโดย System ใน MS_METADATA_LIST`);
      return [];
    }

    console.log(`  ✓ พบข้อมูล "อื่น ๆ" ที่สร้างล่าสุด: ${result.rows.length} row(s)`);
    result.rows.forEach((row: any) => {
      console.log(`    - [${row.METADATA_LIST_CODE}] ${row.METADATA_LIST_NAME} (ID: ${row.METADATA_LIST_ID})`);
    });

    return result.rows;
  } finally {
    await connection.close();
  }
}

/**
 * ตรวจสอบว่ามีข้อมูล "อื่น ๆ" ที่ถูกสร้างใน MS_METADATA_LIST สำหรับ METADATA_ID และชื่อที่ระบุ
 * ใช้สำหรับ validation test cases ที่กรอกข้อมูล "อื่น ๆ ระบุ..."
 * 
 * @param metadataId - METADATA_ID (เช่น 1 สำหรับประเภทข้อมูล, 9 สำหรับหน่วยความถี่)
 * @param metadataName - ชื่อที่กรอกใน input field (เช่น "ข้อมูลประเภทอื่น ๆ ทดสอบ")
 * @param latestRecords - จำนวนรายการล่าสุดที่ต้องการดึงมา (default = 5)
 * @returns Array of matching records
 * 
 * @example
 * // เช็คว่ามี "ข้อมูลประเภทอื่น ๆ ทดสอบ" ใน MS_METADATA_LIST (METADATA_ID=1, CODE="9")
 * await expectCustomMetadataCreated(1, "ข้อมูลประเภทอื่น ๆ ทดสอบ");
 * 
 * @example
 * // เช็คว่ามี "หน่วยความถี่อื่น ๆ" ใน MS_METADATA_LIST (METADATA_ID=9, CODE="X")
 * await expectCustomMetadataCreated(9, "หน่วยความถี่อื่น ๆ");
 */
export async function expectCustomMetadataCreated(
  metadataId: number,
  metadataName: string,
  latestRecords: number = 5,
) {
  const code = getOtherMetadataCode(metadataId);
  
  if (!code) {
    throw new Error(
      `ไม่พบ CODE สำหรับ METADATA_ID ${metadataId} ใน OTHER_METADATA_CODES mapping`,
    );
  }

  const connection = await getOracleConnection();

  try {
    const result = await connection.execute(
      `
      SELECT *
      FROM MS_METADATA_LIST
      WHERE METADATA_ID = :metadataId
        AND METADATA_LIST_CODE = :code
        AND LOWER(METADATA_LIST_NAME) LIKE LOWER(:name)
        AND CREATE_BY = 'System'
      ORDER BY CREATE_DATE DESC
      FETCH FIRST ${latestRecords} ROWS ONLY
      `,
      {
        metadataId,
        code,
        name: `%${metadataName}%`,
      },
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      },
    );

    if (!result.rows || result.rows.length === 0) {
      throw new Error(
        `ไม่พบข้อมูล "อื่น ๆ" ใน MS_METADATA_LIST:\n` +
        `  - METADATA_ID: ${metadataId}\n` +
        `  - CODE: ${code}\n` +
        `  - NAME: ${metadataName}`,
      );
    }

    console.log(
      `  ✓ พบข้อมูล "อื่น ๆ" [METADATA_ID=${metadataId}, CODE=${code}]: ${result.rows.length} row(s)`,
    );
    result.rows.forEach((row: any) => {
      console.log(`    - ${row.METADATA_LIST_NAME} (ID: ${row.METADATA_LIST_ID})`);
    });

    return result.rows;
  } finally {
    await connection.close();
  }
}
