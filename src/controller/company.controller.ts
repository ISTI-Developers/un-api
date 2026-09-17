import { Request, Response } from "express";
import { MySQL } from "../config/db";
import { send } from "../utils/helper";

const db = new MySQL();

export const CompanyController = {
  async test(req: Request, res: Response) {
    res.status(200).send({ message: "Company is accessible" });
  },
  async getCompanies(req: Request, res: Response) {
    const rows = await db.select(
      "SELECT company_id, name, alias, date_created, status FROM un_companies",
    );
    send(res).ok(rows);
  },
  async getDepartments(req: Request, res: Response) {
    const rows = await db.select(
      "SELECT company_id, department_id, name, alias,date_created, status FROM un_company_departments",
    );
    send(res).ok(rows);
  },
  async getUnits(req: Request, res: Response) {
    const rows = await db.select(
      "SELECT company_id, department_id, unit_id, name, alias, date_created, status FROM un_company_units",
    );
    send(res).ok(rows);
  },
};
