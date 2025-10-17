import jwt, { SignOptions } from "jsonwebtoken";
import { CONFIG } from "../config/config";
import bcrypt from "bcrypt";
import { ResultSetHeader } from "mysql2";

export interface JwtPayload extends ResultSetHeader {
  account_id: number;
  username: string;
  email: string;
  password: string;
  attempts: number;
}
type StringValue = `${number}${"s" | "m" | "h" | "d" | "y"}`;

const SALT_ROUNDS = 12; // 10-12 is common; increase for more security (slower)

export function signToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: CONFIG.JWT_EXPIRES_IN as StringValue,
  };
  return jwt.sign(payload, CONFIG.JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, CONFIG.JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hash = await bcrypt.hash(plain, salt);
  return hash;
}
