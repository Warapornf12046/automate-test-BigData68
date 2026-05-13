
import oracledb from "oracledb";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function checkColumns() {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECT_STRING,
    });

    const result = await connection.execute(
      "SELECT * FROM TB_DATASET_GROUPS_METAD",
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT, maxRows: 1 }
    );

    if (result.rows && result.rows.length > 0) {
      console.log("Columns in TB_DATASET_GROUPS_METAD:", Object.keys(result.rows[0]));
    } else {
      console.log("No rows found in TB_DATASET_GROUPS_METAD");
    }
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

checkColumns();
