import { Request, Response } from "express";
import { MySQL } from "../config/db";
import { send } from "../utils/helper";

const db = new MySQL();

export const UserController = {
  async test(req: Request, res: Response) {
    res.status(200).send({ message: "User is accessible" });
  },
  async getUsers(req: Request, res: Response) {
    const rows = await db.query("SELECT * FROM un_users");
    send(res).ok(rows);
  },
  async getUsersSummary(req: Request, res: Response) {
    const rows = await db.query(
      "SELECT user_id, CONCAT(first_name, ' ',last_name) as name, position, company_id, department_id, unit_id FROM un_users"
    );
    send(res).ok(rows);
  },
};
