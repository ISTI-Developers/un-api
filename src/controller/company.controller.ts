import { Request, Response } from "express";
import { MySQL } from "../config/db";
import { send } from "../utils/helper";

const db = new MySQL();

export const CompanyController = {
  async test(req: Request, res: Response) {
    res.status(200).send({ message: "Company is accessible" });
  },
  async getCompanies(req: Request, res: Response) {
    const rows = await db.query(
      "SELECT company_id, name, alias FROM un_companies WHERE status <> 0"
    );
    send(res).ok(rows);
  },
  async getDepartments(req: Request, res: Response) {
    const rows = await db.query(
      "SELECT company_id, department_id, name, alias FROM un_company_departments WHERE status <> 0"
    );
    send(res).ok(rows);
  },
  async getUnits(req: Request, res: Response) {
    const rows = await db.query(
      "SELECT company_id, department_id, unit_id, name, alias FROM un_company_units WHERE status <> 0"
    );
    send(res).ok(rows);
  },
};
