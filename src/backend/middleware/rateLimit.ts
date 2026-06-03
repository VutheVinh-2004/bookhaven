import { Request, Response, NextFunction } from "express";
import { fail } from "../utils/response.ts";

const attempts = new Map<string, { count: number; resetAt: number }>();
const passwordResetRequests = new Map<string, { count: number; resetAt: number }>();

export const loginRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const windowMs = 15 * 60 * 1000;
  const max = 5;
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "unknown";
  const key = `${req.ip || req.socket.remoteAddress || "unknown"}:${email}`;
  const now = Date.now();
  const record = attempts.get(key);

  if (record && record.resetAt > now && record.count >= max) {
    return fail(res, 429, "Bạn đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.");
  }

  res.on("finish", () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      attempts.delete(key);
      return;
    }

    const current = attempts.get(key);
    if (!current || current.resetAt <= Date.now()) {
      attempts.set(key, { count: 1, resetAt: Date.now() + windowMs });
      return;
    }

    current.count += 1;
    attempts.set(key, current);
  });

  return next();
};

export const passwordResetRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const windowMs = 15 * 60 * 1000;
  const max = 3;
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "unknown";
  const key = `${req.ip || req.socket.remoteAddress || "unknown"}:${email}`;
  const now = Date.now();
  const record = passwordResetRequests.get(key);

  if (record && record.resetAt > now && record.count >= max) {
    return fail(res, 429, "Bạn đã yêu cầu mã OTP quá nhiều lần. Vui lòng thử lại sau 15 phút.");
  }

  if (!record || record.resetAt <= now) {
    passwordResetRequests.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    record.count += 1;
    passwordResetRequests.set(key, record);
  }

  return next();
};
