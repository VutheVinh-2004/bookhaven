import { Response } from "express";
import db from "../db/index.ts";
import { AuthRequest } from "../middleware/auth.ts";
import { fail, ok } from "../utils/response.ts";
import { isPositiveInt, trimText } from "../utils/validation.ts";

export const getAllUsers = (req: AuthRequest, res: Response) => {
  const status = trimText(req.query.status as string).toLowerCase();
  let query = "SELECT id, email, full_name, role, is_active, created_at FROM users";

  if (status === "active") query += " WHERE is_active = 1";
  if (status === "inactive") query += " WHERE is_active = 0";

  const users = db.prepare(`${query} ORDER BY created_at DESC`).all();
  return ok(res, users);
};

export const updateUserRole = (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const role = trimText(req.body.role);
  const allowedRoles = ["user", "admin", "super_admin"];

  if (!isPositiveInt(id)) return fail(res, 400, "ID người dùng không hợp lệ.");
  if (!allowedRoles.includes(role)) return fail(res, 400, "Vai trò không hợp lệ.");
  if (id === req.user?.id && role !== "super_admin") return fail(res, 400, "Không thể tự hạ quyền tài khoản của chính mình.");

  const user = db.prepare("SELECT id FROM users WHERE id = ? AND is_active = 1").get(id);
  if (!user) return fail(res, 404, "Không tìm thấy người dùng.");

  db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);
  return ok(res, null, "Cập nhật quyền người dùng thành công.");
};

export const deleteUser = (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!isPositiveInt(id)) return fail(res, 400, "ID người dùng không hợp lệ.");
  if (id === req.user?.id) return fail(res, 400, "Không thể xóa tài khoản của chính mình.");

  const user = db.prepare("SELECT role, is_active FROM users WHERE id = ?").get(id) as any;
  if (!user) return fail(res, 404, "Không tìm thấy người dùng.");
  if (!user.is_active) return fail(res, 400, "Tài khoản đã bị vô hiệu hóa.");
  if (user.role === "super_admin") return fail(res, 400, "Không thể xóa tài khoản super admin khác.");

  const deactivateUser = db.transaction((userId: number) => {
    db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(userId);
    db.prepare(`
      UPDATE users
      SET is_active = 0,
          email_verification_token = NULL,
          email_verification_expires_at = NULL
      WHERE id = ?
    `).run(userId);
  });

  deactivateUser(id);
  return ok(res, null, "Đã vô hiệu hóa tài khoản. Lịch sử đơn hàng được giữ lại.");
};

export const reactivateUser = (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!isPositiveInt(id)) return fail(res, 400, "ID người dùng không hợp lệ.");

  const user = db.prepare("SELECT is_active FROM users WHERE id = ?").get(id) as { is_active: number } | undefined;
  if (!user) return fail(res, 404, "Không tìm thấy người dùng.");
  if (user.is_active) return fail(res, 400, "Tài khoản đang hoạt động.");

  db.prepare("UPDATE users SET is_active = 1 WHERE id = ?").run(id);
  return ok(res, null, "Đã khôi phục tài khoản.");
};
