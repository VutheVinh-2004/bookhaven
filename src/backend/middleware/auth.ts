import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import db from "../db/index.ts";
import { fail } from "../utils/response.ts";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error("JWT_SECRET is missing or too short. Please set a strong secret in .env (at least 32 characters).");
  }
  return secret;
};

export interface AuthUser {
  id: number;
  email: string;
  role: "user" | "admin";
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const signToken = (user: AuthUser) => {
  return jwt.sign(user, getJwtSecret(), { expiresIn: "24h" });
};

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const [scheme, token] = authHeader?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    return fail(res, 401, "Bạn cần đăng nhập để sử dụng chức năng này.");
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload & Pick<AuthUser, "id" | "email">;
    if (!decoded.id || !decoded.email) {
      return fail(res, 401, "Phiên đăng nhập không hợp lệ.");
    }

    const user = db.prepare(
      "SELECT id, email, role FROM users WHERE id = ? AND email = ? AND email_verified = 1 AND is_active = 1"
    ).get(Number(decoded.id), decoded.email) as AuthUser | undefined;

    if (!user) {
      return fail(res, 401, "Phiên đăng nhập không hợp lệ hoặc tài khoản không còn hoạt động.");
    }

    req.user = { id: Number(user.id), email: user.email, role: user.role };
    next();
  } catch {
    return fail(res, 401, "Phiên đăng nhập đã hết hạn hoặc không hợp lệ.");
  }
};

export const authorizeRoles = (...roles: AuthUser["role"][]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return fail(res, 403, "Bạn không có quyền thực hiện thao tác này.");
    }
    next();
  };
};
