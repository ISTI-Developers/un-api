import { Request, Response } from "express";
import { MySQL } from "../config/db";

const db = new MySQL();

export const UserController = {
  async test(req: Request, res: Response) {
    res.status(200).send({ message: "User is accessible" });
  },
  async getUsers(req: Request, res: Response) {
    const rows = await db.query("SELECT * FROM un_users");
    res.status(200).send(rows);
  },
};
