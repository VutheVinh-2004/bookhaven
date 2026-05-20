import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import db from "../db/index.ts";
import { AuthRequest, signToken } from "../middleware/auth.ts";
import { created, fail, ok } from "../utils/response.ts";
import { hasErrors, isEmail, isNonEmptyString, isStrongPassword, isValidFullName, normalizeEmail, trimText, ValidationErrors } from "../utils/validation.ts";

const publicUser = (user: any) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  fullName: user.full_name ?? user.fullName ?? ""
});

export const register = async (req: Request, res: Response) => {
  const email = typeof req.body.email === "string" ? normalizeEmail(req.body.email) : "";
  const password = req.body.password;
  const fullName = trimText(req.body.fullName);
  const errors: ValidationErrors = {};

  if (!isEmail(email)) errors.email = "Email không đúng định dạng.";
  if (!isStrongPassword(password)) errors.password = "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ và số.";
  if (!isValidFullName(fullName, 2, 100)) errors.fullName = "Họ tên chỉ được chứa chữ và khoảng trắng, dài từ 2 đến 100 ký tự.";
  if (hasErrors(errors)) return fail(res, 400, "Dữ liệu đăng ký không hợp lệ.", errors);

  try {
    const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existingUser) return fail(res, 409, "Email đã tồn tại.");

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = db.prepare(
      "INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)"
    ).run(email, hashedPassword, fullName, "user");

    const user = { id: Number(result.lastInsertRowid), email, role: "user" as const, full_name: fullName };
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    return created(res, { token, user: publicUser(user) }, "Đăng ký thành công.");
  } catch (error) {
    console.error("Register error:", error);
    return fail(res, 500, "Lỗi đăng ký tài khoản.");
  }
};

export const login = async (req: Request, res: Response) => {
  const email = typeof req.body.email === "string" ? normalizeEmail(req.body.email) : "";
  const password = req.body.password;
  const errors: ValidationErrors = {};

  if (!isEmail(email)) errors.email = "Email không đúng định dạng.";
  if (!isNonEmptyString(password, 1, 200)) errors.password = "Vui lòng nhập mật khẩu.";
  if (hasErrors(errors)) return fail(res, 400, "Dữ liệu đăng nhập không hợp lệ.", errors);

  try {
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user) return fail(res, 400, "Email hoặc mật khẩu không chính xác.");

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return fail(res, 400, "Email hoặc mật khẩu không chính xác.");

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    return ok(res, { token, user: publicUser(user) }, "Đăng nhập thành công.");
  } catch (error) {
    console.error("Login error:", error);
    return fail(res, 500, "Lỗi đăng nhập.");
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = db.prepare("SELECT id, email, full_name, role FROM users WHERE id = ?").get(req.user?.id) as any;
    if (!user) return fail(res, 404, "Không tìm thấy người dùng.");
    return ok(res, publicUser(user), "Lấy thông tin cá nhân thành công.");
  } catch (error) {
    console.error("Get profile error:", error);
    return fail(res, 500, "Lỗi lấy thông tin cá nhân.");
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const fullName = trimText(req.body.fullName);
  const currentPassword = req.body.currentPassword;
  const newPassword = req.body.newPassword;
  const errors: ValidationErrors = {};

  if (fullName && !isValidFullName(fullName, 2, 100)) errors.fullName = "Họ tên chỉ được chứa chữ và khoảng trắng, dài từ 2 đến 100 ký tự.";
  if (newPassword && !isStrongPassword(newPassword)) errors.newPassword = "Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ và số.";
  if (newPassword && !currentPassword) errors.currentPassword = "Cần nhập mật khẩu hiện tại để đổi mật khẩu.";
  if (hasErrors(errors)) return fail(res, 400, "Dữ liệu cập nhật không hợp lệ.", errors);

  try {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
    if (!user) return fail(res, 404, "Không tìm thấy người dùng.");

    let hashedPassword = user.password;
    if (newPassword) {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) return fail(res, 400, "Mật khẩu hiện tại không chính xác.");
      hashedPassword = await bcrypt.hash(newPassword, 12);
    }

    const updatedFullName = fullName || user.full_name;
    db.prepare("UPDATE users SET full_name = ?, password = ? WHERE id = ?").run(updatedFullName, hashedPassword, userId);
    return ok(res, publicUser({ ...user, full_name: updatedFullName }), "Cập nhật thông tin thành công.");
  } catch (error) {
    console.error("Update profile error:", error);
    return fail(res, 500, "Lỗi cập nhật thông tin.");
  }
};
