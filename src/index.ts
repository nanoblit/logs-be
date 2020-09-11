import express from "express";
import * as sql from "mssql";

const app = express();

app.use(express.json());

const ROWS_TO_FETCH = 100;

const config: sql.config = {
  user: "xelcode",
  password: "xelcode",
  server: "10.100.200.62",
  database: "xelcode",
};

// TODO: Sanitize query
// TODO: Make connect functions that takes all possible inputs and returns a result based on them
// TODO: Make the endpoint take all the possible values and if some are missing, make them default to something that will return everything

const getLogs = async ({
  startDate,
  endDate,
  user,
  status,
  startingRow,
}: {
  startDate: string;
  endDate: string;
  user: string;
  status: string;
  startingRow: number;
}): Promise<any> => {
  try {
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
    console.log(data);

    statement = `
    select count(*) from LogHeader where 
      (AuditDate between @startDate and @endDate) and 
      (MobileUserId like @user) and 
      (Status like @status)
    `;
    const recordsNumber = (await request.query(statement)).recordset[0][""];

    return { data, recordsNumber };
  } catch (err) {
    throw err.message ?? err.originalError.message;
  }
};

app.get("/", async (req, res) => {
  const data = req.body;
  try {
    const logs = await getLogs(data);
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json(err);
  }
});

const server = app.listen(5000, () => console.log("Server is running"));
