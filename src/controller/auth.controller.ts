import { ResultSetHeader } from "mysql2";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { MySQL } from "../config/db";
import {
  LoginCredentials,
  RegisterCredentials,
  UserSummary,
} from "../utils/types";
import { MWC } from "./middleware.controller";
import { send } from "../utils/helper";
import { hashPassword } from "../utils/security";
import crypto from "crypto";

const db = new MySQL();

export const AuthController = {
  async login(req: Request, res: Response) {
    const data: LoginCredentials = req.body;

    if (!data) send(res).error("Login credentials not found");

    const response = await MWC.getToken(
      data.username,
      data.password,
      data.rememberMe,
    );

    if (!response.token) send(res).error("An error occured.");

    const [user] = await db.select<UserSummary>(
      "SELECT user_id, CONCAT(first_name, ' ',last_name) as name, position, company_id, department_id, unit_id FROM un_users WHERE user_id = ?",
      [response.id],
    );
    send(res).ok({
      user: user,
      token: response.token,
    });
  },
  async register(req: Request, res: Response) {
    const data: RegisterCredentials = req.body;

    const password = await hashPassword(String(data.employee_id));

    const userRes = await db.execute(
      "INSERT INTO un_users (employee_id, first_name, last_name, middle_name, company_id, department_id, unit_id, position, type_id, classification_id, status) VALUES (?,?,?,?,?,?,?,?,?,?,1)",
      [
        data.employee_id,
        data.first_name,
        data.last_name,
        data.middle_name,
        data.company_id,
        data.department_id ?? null,
        data.unit_id ?? null,
        data.position,
        data.type_id,
        data.classification_id,
      ],
    );
    if (userRes?.insertId) {
      const newId = userRes.insertId;
      
      const accountRes = await db.execute("INSERT INTO un_accounts (user_id, email, password) VALUES (?,?,?)",
        [newId, data.email, password],
      );
      if (accountRes?.affectedRows) {
        send(res).ok("User has been created successfully.");
      }
    } else {
      send(res).error("An error has occured during user creation");
    }
  },
  async generateKey(_: Request, res: Response) {
    const rawKey = crypto.randomBytes(32).toString("hex");

    send(res).ok({ key: rawKey });
  },
  async saveKey(req: Request, res: Response) {
    const data = req.body;

    const hash = await bcrypt.hash(data.key, 10);

    const sql = `INSERT INTO keys (key, label, date_generated,expiration) VALUES (?,?,?,?)`;

    const response = await db.execute(sql, [
      hash,
      data.label,
      data.date_generated,
      data.expiration,
    ]);

    if (!response) send(res).error("An error occured");

    send(res).ok({ key: data.key });
  },
};
