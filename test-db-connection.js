// test-db-connection.js - ทดสอบการเชื่อมต่อ Oracle Database

const dotenv = require("dotenv");
const oracledb = require("oracledb");
const path = require("path");

// โหลด .env
dotenv.config();

console.log("=".repeat(60));
console.log("ทดสอบการเชื่อมต่อ Oracle Database");
console.log("=".repeat(60));

console.log("\n1. Environment Variables:");
console.log("   ORACLE_USER:", process.env.ORACLE_USER || "(ไม่พบ)");
console.log("   ORACLE_PASSWORD:", process.env.ORACLE_PASSWORD ? "***" + process.env.ORACLE_PASSWORD.slice(-2) : "(ไม่พบ)");
console.log("   ORACLE_CONNECT_STRING:", process.env.ORACLE_CONNECT_STRING || "(ไม่พบ)");

async function testConnection() {
  let connection;
  
  try {
    console.log("\n2. กำลังเชื่อมต่อ...");
    
    connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECT_STRING,
    });
    
    console.log("   ✅ เชื่อมต่อสำเร็จ!");
    
    console.log("\n3. ทดสอบ Query...");
    const result = await connection.execute(
      `SELECT DATASET_GROUPS_ID FROM TB_DATASET_GROUPS ORDER BY DATASET_GROUPS_ID DESC FETCH FIRST 1 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (result.rows && result.rows.length > 0) {
      console.log("   ✅ Query สำเร็จ!");
      console.log("   Latest DATASET_GROUPS_ID:", result.rows[0].DATASET_GROUPS_ID);
    } else {
      console.log("   ⚠️  ไม่พบข้อมูลใน TB_DATASET_GROUPS");
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("สรุป: การเชื่อมต่อ Database ทำงานปกติ ✅");
    console.log("=".repeat(60));
    
  } catch (error) {
    console.error("\n❌ เกิดข้อผิดพลาด:");
    console.error("   Error Code:", error.errorNum || "N/A");
    console.error("   Message:", error.message);
    
    if (error.errorNum === 1017) {
      console.error("\n💡 แนะนำ:");
      console.error("   - ตรวจสอบ username/password ใน .env");
      console.error("   - ลอง login ผ่าน SQL*Plus หรือ SQL Developer");
      console.error("   - ตรวจสอบว่า user ถูก lock หรือไม่");
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

testConnection();
