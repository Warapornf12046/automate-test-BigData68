const dotenv = require("dotenv");
const oracledb = require("oracledb");
dotenv.config();

async function run() {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECT_STRING,
    });
    
    // ค้นหารายการ Format ใน MS_METADATA_LIST
    // ทราบว่า CSV คือ METADATA_LIST_ID = 70 หรือมีลักษณะใกล้เคียงกัน
    const result = await connection.execute(
      `SELECT METADATA_LIST_ID, METADATA_LIST_NAME, METADATA_ID 
       FROM MS_METADATA_LIST 
       WHERE METADATA_ID IN (SELECT DISTINCT METADATA_ID FROM MS_METADATA_LIST WHERE METADATA_LIST_NAME = 'CSV')
       ORDER BY METADATA_LIST_ID`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    console.log("=== FORMAT OPTIONS IN DATABASE ===");
    console.log(JSON.stringify(result.rows, null, 2));
    console.log("==================================");
    
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}
run();
