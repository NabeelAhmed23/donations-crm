import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcryptjs.compare(password, hashedPassword);
}

export function generateToken(payload: {
  userId: string;
  email: string;
  role: string;
}) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not set in environment variables");
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}
