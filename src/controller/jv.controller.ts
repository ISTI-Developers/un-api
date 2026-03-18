import { Request, Response } from "express";
import { MSSQL } from "../config/db";
import { send } from "../utils/helper";

const db = new MSSQL();

export const JVController = {
  async test(_: Request, res: Response) {
    res.status(200).send({ message: "JV is accessible" });
  },

  async getRevenue(req: Request, res: Response) {
    const from = req.query.from;
    const to = req.query.to;

    console.log(from, to);
    if (!from || !to) {
      throw new Error("MAGBIGAY KA NG DATE");
    }

    const query = `SELECT *
        FROM OPENQUERY(UNLIVE_LINK, '
            SELECT *
            FROM UN_LIVE.dbo.TFN_JV_REVENUE(''002-00'',''${from}'',''${to}'')
        ')`;
    try {
      const result = await db.query(query);
      send(res).ok(result);
    } catch (error) {
      send(res).error(error);
    }
  },
  async getExpenses(req: Request, res: Response) {
    const from = req.query.from;
    const to = req.query.to;

    console.log(from, to);
    if (!from || !to) {
      throw new Error("MAGBIGAY KA NG DATE");
    }

    const query = `SELECT *
        FROM OPENQUERY(UNLIVE_LINK, '
            SELECT *
            FROM UN_LIVE.dbo.TFN_JV_EXPENSE(''002-00'',''${from}'',''${to}'')
        ')`;
    try {
      const result = await db.query(query);
      send(res).ok(result);
    } catch (error) {
      send(res).error(error);
    }
  },
  async getExpensesCategory(req: Request, res: Response) {
    const query = `
    SELECT cAcctNo, cTitle
    FROM ACCOUNT
    WHERE cCompanyID = ?
      AND cCategory = 'Expenses'
      AND cType = 'Details'
      AND LEFT(cGeneral, 2) IN ('51','52','53')
    ORDER BY cTitle ASC
  `;

    try {
      const result = await db.query(query, ["002-00"]);
      send(res).ok(result);
    } catch (error) {
      send(res).error(error);
    }
  },

  async getRevenueCategory(req: Request, res: Response) {
    const query = `
    SELECT cAcctNo, cTitle
    FROM ACCOUNT
    WHERE cCompanyID = ?
      AND cCategory = 'Revenue'
      AND cType = 'Details'
      AND cGeneral IN ('4101','41','4')
    ORDER BY cTitle ASC
  `;

    try {
      const result = await db.query(query, ["002-00"]);
      send(res).ok(result);
    } catch (error) {
      send(res).error(error);
    }
  },
};
