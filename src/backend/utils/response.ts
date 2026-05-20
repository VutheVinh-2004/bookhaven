import { Response } from "express";

export const ok = (res: Response, data: unknown = null, message = "Success") => {
  return res.json({ success: true, message, data });
};

export const created = (res: Response, data: unknown = null, message = "Created successfully") => {
  return res.status(201).json({ success: true, message, data });
};

export const fail = (res: Response, status: number, message: string, errors?: Record<string, string>) => {
  return res.status(status).json({ success: false, message, ...(errors ? { errors } : {}) });
};
