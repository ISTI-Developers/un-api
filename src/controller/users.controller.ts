import { Request, Response } from "express";
import { MySQL } from "../config/db";
import { send } from "../utils/helper";
import { UserSummary } from "../utils/types";

const db = new MySQL();

export const UserController = {
  async test(_: Request, res: Response) {
    res.status(200).send({ message: "User is accessible" });
  },
  async getUsers(_: Request, res: Response) {
    const rows = await db.select(
      "SELECT u.user_id, u.employee_id, u.first_name, u.last_name, u.middle_name, u.alias, a.email, a.token, u.company_id, u.department_id, u.unit_id, u.position, u.type_id, u.classification_id, u.status FROM un_users u LEFT JOIN un_accounts a ON u.user_id = a.user_id;",
    );
    send(res).ok(rows);
  },
  async getUsersSummary(req: Request, res: Response) {
    const rows = await db.select<UserSummary>(
      "SELECT user_id, CONCAT(first_name, ' ',last_name) as name, position, company_id, department_id, unit_id FROM un_users",
    );
    send(res).ok(rows);
  },
};
