import { Request, Response } from "express";
import { MySQL } from "../config/db";
import { JwtPayload, signToken, StringValue } from "../utils/security";
import bcrypt from "bcrypt";
import { ResultSetHeader } from "mysql2";

const db = new MySQL();

export const MWC = {
  async getToken(
    username: string,
    password: string,
    remember_me: boolean,
  ): Promise<{ token: string; id: number }> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!username || !password) {
          throw new Error("Username and password is required.");
        }

        const userCredentials = await db.select<Omit<JwtPayload, "expires_at">>(
          "SELECT u.user_id, u.employee_id, a.email, a.password FROM un_accounts a JOIN un_users u ON a.user_id = u.user_id WHERE u.employee_id = ? OR a.email = ?;",
          [username, username],
        );
        if (!userCredentials.length) {
          throw new Error("Account not found.");
        }

        const [user] = userCredentials;

        if (!user) {
          throw new Error("Account not found.");
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
          throw new Error("Invalid username or password.");
        }

        let expires_at: StringValue = "1d";
        if (remember_me) {
          expires_at = "30d";
        }
        const token = signToken({ ...user, expires_at });

        await db.execute("UPDATE un_accounts SET token = ? WHERE user_id = ?", [
          token,
          user.user_id,
        ]);

        resolve({
          id: user.user_id,
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
