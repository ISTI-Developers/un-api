import { Request, Response } from "express";
import { MSSQL, MySQL } from "../config/db";
import { send } from "../utils/helper";
import { cache } from "../utils/cache";
import { format } from "date-fns";

const db = new MSSQL();

export const JVController = {
  async test(_: Request, res: Response) {
    res.status(200).send({ message: "JV is accessible" });
  },

  async getRevenue(req: Request, res: Response) {
    const from = String(req.query.from ?? "");
    const to = String(req.query.to ?? "");

    if (!from || !to) {
      throw new Error("From and To dates are required.");
    }

    const query = `
    SELECT *
    FROM OPENQUERY(
      UNLIVE_LINK,
      'SELECT *
       FROM UN_LIVE.dbo.TFN_JV_REVENUE(
         ''002-00'',
         ''${from}'',
         ''${to}'',
         ''Sales Invoice''
       )'
    )
  `;

    try {
      const result = await db.query(query);
      send(res).ok(result);
    } catch (error) {
      send(res).error(error);
    }
  },
  async refreshCollectionMemo(req: Request, res: Response) {
    const ref_id = String(req.query.ref_id ?? "").trim();

    if (!ref_id) {
      throw new Error("Reference ID is required.");
    }

    const safeRefId = ref_id.replace(/'/g, "''");

    const query = `
    EXEC [UNLIVE_LINK].[UN_LIVE].[dbo].[SP_RefereshCollectionMemo]
      'AR',
      '${safeRefId}';

    EXEC [UNLIVE_LINK].[UN_LIVE].[dbo].[SP_RefereshCollectionMemo]
      'OR',
      '${safeRefId}';
  `;

    try {
      const result = await db.query(query);

      send(res).ok({
        ref_id,
        result,
      });
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
  async getLocations(_: Request, res: Response) {
    const unisdb = new MySQL({
      host: "192.168.10.10",
      user: "oamsun",
      password: "Oams@UN",
      database: "oams-un",
      port: 3306,
    });

    const jvQuery = `SELECT *
        FROM OPENQUERY(UNLIVE_LINK, '
            SELECT DISTINCT cAddress FROM UN_LIVE.dbo.JointVenture_T')`;
    const unisQuery = `SELECT A.structure_id, A.structure_code, A.address AS cLocation
        FROM hd_structure A
        WHERE A.category_id = 4 AND inactive = 0
          AND A.deleted = 0
          AND EXISTS (
            SELECT 1
            FROM hd_structure_owned B
            INNER JOIN hd_structure_owner C ON B.owner_id = C.owner_id
            WHERE B.structure_id = A.structure_id
              AND B.deleted = 0
              AND C.deleted = 0
          )
        ORDER BY A.structure_id ASC`;

    const cleanLocation = (location: unknown) =>
      typeof location === "string" ? location.trim().replace(/\s+/g, " ") : "";

    try {
      const unisLocations = await unisdb.query(unisQuery);
      const jvLocations = await db.query(jvQuery);
      const locations = new Map<
        string,
        {
          structure_id: number | null;
          structure_code: string | null;
          cLocation: string;
        }
      >();

      for (const location of unisLocations) {
        const cLocation = cleanLocation(location.cLocation);

        if (cLocation) {
          locations.set(cLocation.toLowerCase(), {
            structure_id: location.structure_id,
            structure_code: location.structure_code,
            cLocation,
          });
        }
      }

      for (const location of jvLocations) {
        const cLocation = cleanLocation(location.cAddress);
        const key = cLocation.toLowerCase();

        if (cLocation && !locations.has(key)) {
          locations.set(key, {
            structure_id: null,
            structure_code: null,
            cLocation,
          });
        }
      }

      send(res).ok(Array.from(locations.values()));
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
  async getVoucher(req: Request, res: Response) {
    const search = String(req.query.search ?? "").trim();

    if (search.length < 2) {
      return send(res).ok([]);
    }

    const escapedSearch = search.replace(/'/g, "''");

    const query = `
    SELECT *
    FROM OPENQUERY(UNLIVE_LINK, '
      SELECT DISTINCT TOP 50 cTranNo
      FROM UN_LIVE.dbo.VOUCHER
      WHERE cCompanyID = ''002-00''
        AND lCancelled = 0
        AND dDate >= ''2026-01-01''
        AND cTranNo LIKE ''%${escapedSearch}%''
      ORDER BY cTranNo

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
      if (typeof cInvNo !== "string" || cInvNo.length === 0) {
        return res.status(400).json({
          success: false,
          error: "cInvNo is required.",
        });
      }
      const invoices = cInvNo.split(",");
      const hasInvalidInvoice = invoices.some(
        (invoice) => !/^[A-Za-z0-9-]+$/.test(invoice),
      );
      if (hasInvalidInvoice) {
        return res.status(400).json({
          success: false,
          error: "One or more invoice numbers are invalid.",
        });
      }
      const inv = invoices.join(",");
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
  async getExpenseByVoucher(req: Request, res: Response) {
    try {
      const cTranNo = req.query.cTranNo;

      if (typeof cTranNo !== "string" || cTranNo.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "cTranNo is required.",
        });
      }

      const transactions = cTranNo
        .split(",")
        .map((transaction) => transaction.trim())
        .filter(Boolean);

      const hasInvalidTransaction = transactions.some(
        (transaction) => !/^[A-Za-z0-9-]+$/.test(transaction),
      );

      if (hasInvalidTransaction) {
        return res.status(400).json({
          success: false,
          error: "One or more transaction numbers are invalid.",
        });
      }

      const tranNo = transactions.join(",");
      const escapedTranNo = tranNo.replace(/'/g, "''");

      const query = `
      SELECT *
      FROM OPENQUERY(UNLIVE_LINK, '
        SELECT *
        FROM UN_LIVE.dbo.Get_JV_Expense_Transaction_List(
          ''${escapedTranNo}''
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
    const from = req.query.from ?? format(new Date(), "MM/dd/yyyy");
    const to = req.query.to ?? format(new Date(), "MM/dd/yyyy");

    const unisdb = new MySQL({
      host: "192.168.10.10",
      user: "oamsun",
      password: "Oams@UN",
      database: "oams-un",
      port: 3306,
    });

    const unis_customers_query = `SELECT DISTINCT customer_name as cName FROM hd_customer WHERE deleted = 0;`;
    const query = `SELECT *
          FROM OPENQUERY(UNLIVE_LINK, '
            SELECT * FROM UN_LIVE.dbo.Get_Aging_Customer(''002-00'',''${from}'',''${to}'',NULL)
             ORDER BY cName')`;
    const qnequery = `SELECT CompanyCode,CompanyName,MAX(AgeDays) LastAgeDay
FROM QFN_GetCustomerAging('${from}',0,1,'Month','12','-2','-2',0,'',null,null,null,null,null,null,null,null,null,null)
GROUP BY CompanyCode,CompanyName`;
    try {
      const result = await cache.remember(
        `CUSTOMER [${from}-${to}]`,
        24 * 60 * 60 * 1000,
        async () => {
          const response = await db.query(query);
          const qneResponse = await db.query(qnequery);
          const customers = await unisdb.query(unis_customers_query);

          const communion = new Map(response.map((a) => [a.cName, a.nDayAge]));
          const qne = new Map(
            qneResponse.map((a) => [a.CompanyName, a.LastAgeDay]),
          );

          const result = customers.map((client) => ({
            ...client,
            nDayAge: communion.get(client.cName) ?? qne.get(client.name) ?? 0,
          }));
          return result;
        },
      );
      send(res).ok(result);
    } catch (error) {
      send(res).error(error);
    }
  },
};
