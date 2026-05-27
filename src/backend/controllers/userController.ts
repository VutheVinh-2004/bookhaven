import { Response } from "express";
import db from "../db/index.ts";
import { AuthRequest } from "../middleware/auth.ts";
import { fail, ok } from "../utils/response.ts";
import { isPositiveInt, trimText } from "../utils/validation.ts";

export const getAllUsers = (_req: AuthRequest, res: Response) => {
  const users = db.prepare("SELECT id, email, full_name as fullName, role, created_at FROM users ORDER BY created_at DESC").all();
  return ok(res, users);
};

export const updateUserRole = (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const role = trimText(req.body.role);
  const allowedRoles = ["user", "admin", "super_admin"];

  if (!isPositiveInt(id)) return fail(res, 400, "ID người dùng không hợp lệ.");
  if (!allowedRoles.includes(role)) return fail(res, 400, "Vai trò không hợp lệ.");
  if (id === req.user?.id && role !== "super_admin") return fail(res, 400, "Không thể tự hạ quyền tài khoản của chính mình.");

  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(id);
  if (!user) return fail(res, 404, "Không tìm thấy người dùng.");

  db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);
  return ok(res, null, "Cập nhật quyền người dùng thành công.");
};

export const deleteUser = (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!isPositiveInt(id)) return fail(res, 400, "ID người dùng không hợp lệ.");
  if (id === req.user?.id) return fail(res, 400, "Không thể xóa tài khoản của chính mình.");

  const user = db.prepare("SELECT role FROM users WHERE id = ?").get(id) as any;
  if (!user) return fail(res, 404, "Không tìm thấy người dùng.");
  if (user.role === "super_admin") return fail(res, 400, "Không thể xóa tài khoản super admin khác.");

  const deleteUserWithData = db.transaction((userId: number) => {
    db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(userId);
    db.prepare(`
      DELETE FROM order_items
      WHERE order_id IN (
        SELECT id FROM orders WHERE user_id = ?
      )
    `).run(userId);
    db.prepare("DELETE FROM orders WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM users WHERE id = ?").run(userId);
  });

  deleteUserWithData(id);
  return ok(res, null, "Xóa người dùng và toàn bộ dữ liệu liên quan thành công.");
};
