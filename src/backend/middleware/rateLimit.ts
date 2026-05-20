import { Request, Response, NextFunction } from "express";
import { fail } from "../utils/response.ts";

const attempts = new Map<string, { count: number; resetAt: number }>();

export const loginRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const windowMs = 15 * 60 * 1000;
  const max = 5;
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || record.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (record.count >= max) {
    return fail(res, 429, "Bạn đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.");
  }

  record.count += 1;
  attempts.set(key, record);
  return next();
};
