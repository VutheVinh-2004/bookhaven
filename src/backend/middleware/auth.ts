import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
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
  role: "user" | "admin" | "super_admin";
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
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload & AuthUser;
    if (!decoded.id || !decoded.email || !decoded.role) {
      return fail(res, 403, "Token không hợp lệ.");
    }
    req.user = { id: Number(decoded.id), email: decoded.email, role: decoded.role };
    next();
  } catch {
    return fail(res, 403, "Token đã hết hạn hoặc không hợp lệ.");
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
