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

    if (!from || !to) {
      throw new Error("From and To dates are required.");
    }
    const query = `
    SELECT *
        FROM OPENQUERY(UNLIVE_LINK, '
    SELECT
      A.cInvNo,
      A.dDate,
      A.cClientName,
      A.cSalesmanName,
      A.cContractID,
      A.cJobNo,
      A.dDueDate,
      A.dDueDateTo,
      A.cSiteID,
      A.cStuctureID,
      A.cStructureAddress,
      A.cAcctNo,
      A.cTitle,
      A.nAmount,
      B.cTranNo,
      B.nApplied,
      D.dDate,
      C.cTranNo,
      C.nAmount,
      A.cLocation,
      A.cGroupName,
      A.cReportGroup
    FROM UN_LIVE.dbo.TFN_JV_REVENUE(''002-00'', ''${from}'',''${to}'', ''Sales Invoice'') A
    LEFT OUTER JOIN UN_LIVE.dbo.PR_T B
      ON A.cCompanyID = B.cCompanyID
      AND A.cInvNo = B.cInvNo
      AND A.cContractID = B.cContractID
      AND A.cJobNo = B.cJobNo
      AND A.dDueDate = B.dDueDateFrom
    LEFT OUTER JOIN UN_LIVE.dbo.PR D
      ON B.cCompanyID = D.cCompanyID
      AND B.cTranNo = D.cTranNo
    LEFT OUTER JOIN UN_LIVE.dbo.TFN_JV_REVENUE(''002-00'', ''${from}'',''${to}'', ''Credit Memo'') C
      ON A.cInvNo = C.cInvNo
      AND A.cJobNo = C.cJobNo
      AND A.dDueDate = C.dDueDate
      AND A.cStuctureID = C.cStuctureID
    WHERE ISNULL(C.cTranNo, '''') = ''''
     ')`;

    try {
      const result = await db.query(query, { from, to });
      send(res).ok(result);
    } catch (error) {
      send(res).error(error);
    }
  },
  async getExpenses(req: Request, res: Response) {
    const from = req.query.from;
    const to = req.query.to;

    // console.log(from, to);
    if (!from || !to) {
      throw new Error("From and To dates are required.");
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
    const query = `SELECT *
        FROM OPENQUERY(UNLIVE_LINK, '
            SELECT cAcctNo, cTitle
            FROM UN_LIVE.dbo.ACCOUNT
            WHERE cCompanyID = ''002-00''
              AND cCategory = ''Expenses''
              AND cType = ''Details''
              AND LEFT(cGeneral, 2) IN (''51'',''52'',''53'')
            ORDER BY cTitle ASC')`;
    try {
      const result = await db.query(query);
      send(res).ok(result);
    } catch (error) {
      send(res).error(error);
    }
  },

  async getRevenueCategory(req: Request, res: Response) {
    const query = `SELECT *
        FROM OPENQUERY(UNLIVE_LINK, '
            SELECT cAcctNo, cTitle
            FROM UN_LIVE.dbo.ACCOUNT
            WHERE cCompanyID = ''002-00''
              AND cCategory = ''Revenue''
              AND cType = ''Details''
              AND cGeneral IN (''4101'',''41'',''4'')
            ORDER BY cTitle ASC')`;
    try {
      const result = await db.query(query);
      send(res).ok(result);
    } catch (error) {
      send(res).error(error);
    }
  },
};
