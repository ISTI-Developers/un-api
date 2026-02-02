import { Request, Response } from "express";
import { MSSQL } from "../config/db";
import { send } from "../utils/helper";
import { UTASIContract } from "../interfaces/utasi.interface";

const db = new MSSQL();

export const UTASIController = {
  async test(_: Request, res: Response) {
    res.status(200).send({ message: "UTASI is accessible" });
  },

  async getContracts(_: Request, res: Response) {
    const sqlQuery = `WITH CTE AS (
        SELECT 
            A.SalesOrderCode, A.ReferenceNo, A.SalesOrderDate, A.DebtorName,
            A.TotalAmount, A.TaxTotalAmount, A.NetTotalAmount,
            A.IsCancelled, A.IsClosed,
            A.ProjectId, C.ProjectCode, C.[Description] AS ProjectDesc,
            B.StockId, B.[Description] AS cDesc, 
            CASE 
                WHEN D.StockName IN ('LRT', 'LRT-ZR') THEN 'LRT'
                WHEN D.StockName IN ('PITX', 'PITX - ZR') THEN 'PITX'
                WHEN D.StockName IN ('MCIA', 'MCIA - ZR') THEN 'MCIA'
                ELSE D.StockName
            END AS StockName,
            D.[Description] AS StockDesc,
            B.Qty, B.unitprice, B.Amount, B.TaxAmount, B.NetAmount,
            MIN(B.DateRef1) OVER(PARTITION BY B.salesorderID) AS DateRef1,
            MAX(B.DateRef2) OVER(PARTITION BY B.salesorderID) AS DateRef2,
            CASE 
                WHEN GETDATE() BETWEEN 
                    MIN(B.DateRef1) OVER(PARTITION BY B.salesorderID) AND 
                    MAX(B.DateRef2) OVER(PARTITION BY B.salesorderID) 
                THEN 1 ELSE 0 
            END AS isActive,
            ROW_NUMBER() OVER (PARTITION BY B.salesorderID ORDER BY B.salesorderID) AS RowNum
        FROM SalesOrders A
            INNER JOIN SalesOrderDetails B ON A.id = B.SalesOrderId
            LEFT OUTER JOIN Projects C ON A.ProjectId = C.Id
            INNER JOIN Stocks D ON B.StockId = D.Id
        WHERE A.IsClosed = 0 
          AND D.StockName IN ('LRT', 'LRT-ZR')
      )
      SELECT 
          SalesOrderCode, ReferenceNo, SalesOrderDate, DebtorName,
          TotalAmount, TaxTotalAmount, NetTotalAmount,
          IsCancelled, IsClosed,
          ProjectId, ProjectCode, ProjectDesc,
          StockId, cDesc, StockName, StockDesc,
          Qty, unitprice, Amount, TaxAmount, NetAmount,
          DateRef1, DateRef2, isActive
      FROM CTE
      WHERE RowNum = 1 AND isActive = 1
      ORDER BY SalesOrderCode ASC;
  
      -- Count query
      WITH CountCTE AS (
        SELECT 
            ROW_NUMBER() OVER (PARTITION BY B.salesorderID ORDER BY B.salesorderID) AS RowNum,
            CASE 
                WHEN GETDATE() BETWEEN 
                    MIN(B.DateRef1) OVER(PARTITION BY B.salesorderID) AND 
                    MAX(B.DateRef2) OVER(PARTITION BY B.salesorderID) 
                THEN 1 ELSE 0 
            END AS isActive
        FROM SalesOrders A
            INNER JOIN SalesOrderDetails B ON A.id = B.SalesOrderId
            INNER JOIN Stocks D ON B.StockId = D.Id
            LEFT OUTER JOIN Projects C ON A.ProjectId = C.Id
        WHERE A.IsClosed = 0 
          AND D.StockName IN ('LRT', 'LRT-ZR')
      )
      SELECT COUNT(*) AS TotalCount
      FROM CountCTE
      WHERE RowNum = 1 AND isActive = 1;
    `;
    try {
      const result = await db.query<UTASIContract>(sqlQuery);
      send(res).ok(result);
    } catch (error) {
      send(res).error(error);
    }
  },
};
