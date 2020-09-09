import express from "express";
import * as sql from "mssql";

const app = express();

const config: sql.config = {
  user: "xelcode",
  password: "xelcode",
  server: "10.100.200.62",
  database: "xelcode",
};

const connectToServer = async (): Promise<any> => {
  try {
    const pool = new sql.ConnectionPool(config);

    await pool.connect();
    const request = new sql.Request(pool);
    const result = await request.query(`select top 100 * from LogHeader`);
    return result;
  } catch (err) {
    console.error(err)
    return err;
  }
};

app.get("/", async (req, res) => {
  res.json(await connectToServer());
});

const server = app.listen(5000, () => console.log("Server is running"));
