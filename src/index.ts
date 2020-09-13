import express from "express";
import * as sql from "mssql";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

const ROWS_TO_FETCH = 20;

const config: sql.config = {
  user: "xelcode",
  password: "xelcode",
  server: "10.100.200.62",
  database: "xelcode",
};

const getLogs = async ({
  startDate,
  endDate,
  user,
  status,
  page,
}: {
  startDate: string;
  endDate: string;
  user: string;
  status: string;
  page: number;
}): Promise<any> => {
  try {
    user = `%${user}%`;
    status = `%${status}%`;
    const startingRow = (page - 1) * ROWS_TO_FETCH;

    const pool = new sql.ConnectionPool(config);

    await pool.connect();
    const request = new sql.Request(pool);

    request.input("startDate", sql.Date, startDate);
    request.input("endDate", sql.Date, endDate);
    request.input("user", sql.NChar, user);
    request.input("status", sql.NChar, status);
    request.input("startingRow", sql.Int, startingRow);

    let statement = `
    select * from LogHeader where 
      (AuditDate between @startDate and @endDate) and 
      (MobileUserId like @user) and 
      (Status like @status) 
      order by AuditDate 
      offset @startingRow rows 
      fetch next ${ROWS_TO_FETCH} rows only
    `;
    const data = (await request.query(statement)).recordset;

    statement = `
    select count(*) from LogHeader where 
      (AuditDate between @startDate and @endDate) and 
      (MobileUserId like @user) and 
      (Status like @status)
    `;
    const pages = Math.ceil((await request.query(statement)).recordset[0][""] / ROWS_TO_FETCH);

    return { data, pages };
  } catch (err) {
    throw err.message ?? err.originalError.message;
  }
};

app.post("/", async (req, res) => {
  const { data } = req.body;
  try {
    const logs = await getLogs(data);
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).send(err);
    console.error(err);
  }
});

const server = app.listen(5000, () => console.log("Server is running"));
