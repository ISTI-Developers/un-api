import { Request, Response } from "express";
import { MSSQL } from "../config/db";
import { send } from "../utils/helper";
import { cache } from "../utils/cache";

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
      A.dDate AS invoiceDate,
      A.cClientName,
      A.cSalesmanName,
      A.cContractID,
      A.cJobNo,
      A.dDueDate AS dueDateFrom,
      A.dDueDateTo AS dueDateTo,
      -- A.cSiteID,
      -- A.cStuctureID,
      -- A.cStructureAddress,
      A.cAcctNo,
      A.cTitle,
      A.nAmount AS invoiceAmount,
      B.cTranNo AS orNumber,
      B.nApplied AS orAmount,
      D.dDate AS orDate,
      C.cTranNo AS cmdmTransactionNo,
      C.nAmount AS cmdmAmount,
      A.cLocation,
      E.cBrandName,
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
    LEFT OUTER JOIN UN_LIVE.dbo.CONTRACT_T E ON A.cCompanyID = E.cCompanyID and A.cContractID = E.cContractID_HDI and A.cJobNo = E.cJobNo and 
    A.cStuctureID = E.cStructureID and A.cSiteID = E.cSiteID
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
  async getParentsGroupName(req: Request, res: Response) {
    const query = `SELECT *
        FROM OPENQUERY(UNLIVE_LINK, '
            SELECT *
            FROM UN_LIVE.dbo.JointVenture')`;
    try {
      const result = await db.query(query);
      send(res).ok(result);
    } catch (error) {
      send(res).error(error);
    }
  },
  async getChildGroupName(req: Request, res: Response) {
    const query = `SELECT *
        FROM OPENQUERY(UNLIVE_LINK, '
            SELECT *
            FROM UN_LIVE.dbo.JointVenture_T')`;
    try {
      const result = await db.query(query);
      send(res).ok(result);
    } catch (error) {
      send(res).error(error);
    }
  },

  async getTotalRealizedRevenue(req: Request, res: Response) {
    const from = req.query.from;
    const to = req.query.to;

    if (!from || !to) {
      throw new Error("From and To dates are required.");
    }

    const query = `SELECT *
      FROM OPENQUERY(UNLIVE_LINK, '
          SELECT A.cGroupName,A.cTitle,SUM(A.nAmount) RealizedRevenue
          FROM UN_LIVE.dbo.TFN_JV_REVENUE(''002-00'',''${from}'',''${to}'',''Sales Invoice'') A
          GROUP BY A.cGroupName,A.cTitle
      ')`;

    try {
      const result = await db.query(query);
      send(res).ok(result);
    } catch (error) {
      send(res).error(error);
    }
  },

  async getOperatingExpense(req: Request, res: Response) {
    const from = req.query.from;
    const to = req.query.to;

    if (!from || !to) {
      throw new Error("From and To dates are required.");
    }

    const query = `SELECT *
      FROM OPENQUERY(UNLIVE_LINK, '
          SELECT A.cGroupName,A.cTitle,
            SUM(CASE WHEN ISNULL(B.nForceAmount,0) <> 0 THEN B.nForceAmount ELSE A.nAmount END) nUnitedneon
          FROM UN_LIVE.dbo.TFN_JV_EXPENSE(''002-00'',''${from}'',''${to}'') A
          LEFT OUTER JOIN UN_121825.dbo.moa_all_expense B 
            ON A.cAcctNo = B.account_no 
            AND A.cTranNo = B.transaction_no 
            AND A.cleaseContractID = B.lease_contract_id
          GROUP BY A.cGroupName,A.cTitle
      ')`;

    try {
      const result = await db.query(query);
      send(res).ok(result);
    } catch (error) {
      send(res).error(error);
    }
  },
  async getInvoice(req: Request, res: Response) {
    const search = String(req.query.search ?? "").trim();

    if (search.length < 2) {
      return send(res).ok([]);
    }

    const escapedSearch = search.replace(/'/g, "''");

    const query = `
    SELECT *
    FROM OPENQUERY(UNLIVE_LINK, '
      SELECT DISTINCT TOP 50 cInvNo
      FROM UN_LIVE.dbo.SALES
      WHERE cCompanyID = ''002-00''
        AND lCancelled = 0
        AND dDate >= ''2026-01-01''
        AND cInvNo LIKE ''%${escapedSearch}%''
      ORDER BY cInvNo
    ')
  `;
    try {
      const result = await db.query(query);
      send(res).ok(result);
    } catch (error) {
      send(res).error(error);
    }
  },
  async getRevenueByInvoice(req: Request, res: Response) {
    try {
      const cInvNo = req.query.cInvNo;
      if (typeof cInvNo !== 'string' || cInvNo.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'cInvNo is required.',
        });
      }
      const invoices = cInvNo.split(',');
      const hasInvalidInvoice = invoices.some(
        (invoice) => !/^[A-Za-z0-9-]+$/.test(invoice)
      );
      if (hasInvalidInvoice) {
        return res.status(400).json({
          success: false,
          error: 'One or more invoice numbers are invalid.',
        });
      }
      const inv = invoices.join(',');
      const escapedInv = inv.replace(/'/g, "''");
      const query = `
      SELECT *
      FROM OPENQUERY(UNLIVE_LINK, '
        SELECT *
        FROM UN_LIVE.dbo.Get_JV_Revenue_Invoice_List(
          ''${escapedInv}''
        )
      ')
    `;
      const result = await db.query(query);
      return send(res).ok(result);
    } catch (error) {
      return send(res).error(error);
    }
  },

  async getCustomerAging(req: Request, res: Response) {
    const query = `SELECT *
          FROM OPENQUERY(UNLIVE_LINK, '
            SELECT * FROM UN_LIVE.dbo.Get_Aging_Customer(''002-00'',''06/01/2026'',''06/30/2026'',NULL)
             ORDER BY cName')`;
    try {
      const result = await cache.remember(
        "CUSTOMER-AGE",
        24 * 60 * 60 * 1000,
        async () => {
          const response = await db.query(query);
          return response;
        },
      );
      send(res).ok(result);
    } catch (error) {
      send(res).error(error);
    }
  },
};
