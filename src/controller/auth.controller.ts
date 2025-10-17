import { Request, Response } from "express";
import { MySQL } from "../config/db";
import { LoginCredentials, RegisterCredentials } from "../utils/types";
import { MWC } from "./middleware.controller";
import { send } from "../utils/helper";
import { hashPassword } from "../utils/security";
import { ResultSetHeader } from "mysql2";

const db = new MySQL();

export const AuthController = {
  async login(req: Request, res: Response) {
    const data: LoginCredentials = req.body.data;

    if (!data) send(res).error("Login credentials not found");

    const response = await MWC.getToken(
      data.username,
      data.email_address,
      data.password
    );

    if (!response.token) send(res).error("An error occured.");

    const [user] = await db.query(
      "SELECT * FROM un_account WHERE account_id = ?",
      [response.id]
    );

    send(res).ok(user);
  },
  async register(req: Request, res: Response) {
    const data: RegisterCredentials = req.body.data;

    const password = hashPassword(data.employee_no);

    const [userRes] = await db.query<ResultSetHeader>(
      "INSERT INTO un_users (employee_no, first_name, last_name, middle_name,alias,company_id, department_id, unit_id, position, type_id, classification_id, status) VALUES (?,?,?,?,?,?,?,?,?,1,?,1)",
      [
        data.employee_no,
        data.first_name,
        data.last_name,
        data.middle_name,
        data.alias ?? null,
        data.company_id,
        data.department_id ?? null,
        data.unit_id ?? null,
        data.position,
        data.classification_id,
      ]
    );
    if (userRes?.insertId) {
      const newId = userRes.insertId;

      const [accountRes] = await db.query<ResultSetHeader>(
        "INSERT INTO un_accounts (user_id, username, email, password, role_id) VALUES (?,?,?,?,?)",
        [newId, data.username, data.email_address, password, data.role_id]
      );

      
    } else {
      send(res).error("An error has occured during user creation");
    }
  },
};
