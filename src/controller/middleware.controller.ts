import { Request, Response } from "express";
import { MySQL } from "../config/db";
import { JwtPayload, signToken } from "../utils/security";
import bcrypt from "bcrypt";
import { ResultSetHeader } from "mysql2";

const db = new MySQL();

export const MWC = {
  async getToken(
    username: string,
    email_address: string,
    password: string
  ): Promise<{ token: string; id: number }> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!username || !email_address || !password) {
          throw new Error("Username and password is required.");
        }

        const userCredentials = await db.query<JwtPayload>(
          "SELECT account_id, username, email, password, attempts FROM un_accounts WHERE username = ? OR email = ?",
          [username, username]
        );
        if (!userCredentials.length) {
          throw new Error("Account not found.");
        }

        const [user] = userCredentials;

        if (!user) {
          throw new Error("Account not found.");
        }

        if (user.attempts === 5) {
          throw new Error(
            "You have reached 5 attempts. Please contact the IT Support."
          );
        }
        const passwordMatch = bcrypt.compare(password, user.password);

        if (!passwordMatch) {
          const response = await db.query(
            "UPDATE un_accounts SET attempts = ? WHERE account_id = ?",
            [user.attempts + 1, user.account_id]
          );
          if (response) {
            throw new Error("Invalid username or password.");
          }
        }

        const token = signToken(user);

        const [response] = await db.query<ResultSetHeader>(
          "UPDATE un_accounts SET token = ?, attempts = 0 WHERE account_id = ?",
          [token, user.attempts, user.account_id]
        );

        if (!response?.affectedRows) {
          throw new Error("An error occured.");
        }
        resolve({
          id: user.account_id,
          token: token,
        });
      } catch (e: unknown) {
        if (e instanceof Error) {
          reject(e.message);
        }
      }
    });
  },
};
