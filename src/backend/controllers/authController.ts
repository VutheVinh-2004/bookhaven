import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import db from "../db/index.ts";
import { AuthRequest, signToken } from "../middleware/auth.ts";
import { created, fail, ok } from "../utils/response.ts";
import { hasErrors, isEmail, isNonEmptyString, isStrongPassword, isValidFullName, normalizeEmail, trimText, ValidationErrors } from "../utils/validation.ts";
import {
  buildVerificationUrl,
  createEmailVerificationToken,
  getEmailVerificationExpiry,
  isEmailConfigured,
  sendVerificationEmail
} from "../services/emailService.ts";

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
    const existingUser = db.prepare("SELECT id, is_active FROM users WHERE email = ?").get(email) as { id: number; is_active: number } | undefined;
    if (existingUser) {
      return fail(res, 409, existingUser.is_active
        ? "Email đã tồn tại."
        : "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = createEmailVerificationToken();
    const verificationExpiresAt = getEmailVerificationExpiry();
    db.prepare(
      `INSERT INTO users (email, password, full_name, role, email_verified, email_verification_token, email_verification_expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(email, hashedPassword, fullName, "user", 0, verificationToken, verificationExpiresAt);

    const verificationUrl = buildVerificationUrl(verificationToken);
    void sendVerificationEmail({ to: email, fullName, token: verificationToken })
      .catch((emailError) => {
        console.error("Send verification email error:", emailError);
      });

    return created(
      res,
      { requiresEmailVerification: true, ...(process.env.NODE_ENV !== "production" ? { verificationUrl } : {}) },
      "Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản."
    );
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
    if (!user) return fail(res, 404, "Tài khoản không tồn tại.");
    if (!user.is_active) return fail(res, 403, "Tài khoản đã bị vô hiệu hóa.");

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return fail(res, 400, "Email hoặc mật khẩu không chính xác.");
    if (!user.email_verified) return fail(res, 403, "Vui lòng xác nhận email trước khi đăng nhập.");

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    return ok(res, { token, user: publicUser(user) }, "Đăng nhập thành công.");
  } catch (error) {
    console.error("Login error:", error);
    return fail(res, 500, "Lỗi đăng nhập.");
  }
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
  const email = typeof req.body.email === "string" ? normalizeEmail(req.body.email) : "";
  if (!isEmail(email)) return fail(res, 400, "Email khong dung dinh dang.");

  try {
    const user = db.prepare(
      "SELECT id, email, full_name, email_verified FROM users WHERE email = ?"
    ).get(email) as any;

    if (!user) {
      return ok(res, null, "Neu email ton tai va chua xac nhan, BookHaven se gui lai lien ket xac nhan.");
    }
    if (user.email_verified) {
      return ok(res, null, "Tai khoan da duoc xac nhan email.");
    }

    const verificationToken = createEmailVerificationToken();
    const verificationExpiresAt = getEmailVerificationExpiry();
    db.prepare(
      `UPDATE users
       SET email_verification_token = ?,
           email_verification_expires_at = ?
       WHERE id = ?`
    ).run(verificationToken, verificationExpiresAt, user.id);

    const verificationUrl = buildVerificationUrl(verificationToken);
    if (!isEmailConfigured() && process.env.NODE_ENV !== "production") {
      return ok(
        res,
        { verificationUrl },
        "SMTP chua cau hinh. Da tao lai lien ket xac nhan cho moi truong phat trien."
      );
    }

    await sendVerificationEmail({
      to: user.email,
      fullName: user.full_name || user.email,
      token: verificationToken
    });

    return ok(
      res,
      process.env.NODE_ENV !== "production" ? { verificationUrl } : null,
      "Da gui lai email xac nhan."
    );
  } catch (error) {
    console.error("Resend verification email error:", error);
    return fail(res, 500, "Khong the gui lai email xac nhan.");
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  const token = typeof req.body.token === "string" ? req.body.token.trim() : "";
  if (!token) return fail(res, 400, "Thiếu mã xác nhận email.");

  try {
    const user = db.prepare(
      `SELECT id, email, role, full_name, email_verification_expires_at
       FROM users
       WHERE email_verification_token = ?`
    ).get(token) as any;

    if (!user) return fail(res, 400, "Mã xác nhận không hợp lệ.");
    if (new Date(user.email_verification_expires_at).getTime() < Date.now()) {
      return fail(res, 400, "Mã xác nhận đã hết hạn. Vui lòng đăng ký lại.");
    }

    db.prepare(
      `UPDATE users
       SET email_verified = 1,
           email_verification_token = NULL,
           email_verification_expires_at = NULL
       WHERE id = ?`
    ).run(user.id);

    const authToken = signToken({ id: user.id, email: user.email, role: user.role });
    return ok(res, { token: authToken, user: publicUser(user) }, "Xác nhận email thành công.");
  } catch (error) {
    console.error("Verify email error:", error);
    return fail(res, 500, "Lỗi xác nhận email.");
  }
};

export const rejectEmail = async (req: Request, res: Response) => {
  const token = typeof req.body.token === "string" ? req.body.token.trim() : "";
  if (!token) return fail(res, 400, "Thiếu mã xác nhận email.");

  try {
    const user = db.prepare(
      `SELECT id, email_verification_expires_at
       FROM users
       WHERE email_verification_token = ?
         AND email_verified = 0`
    ).get(token) as any;

    if (!user) return fail(res, 400, "Mã xác nhận không hợp lệ hoặc đã được sử dụng.");
    if (new Date(user.email_verification_expires_at).getTime() < Date.now()) {
      db.prepare("DELETE FROM users WHERE id = ? AND email_verified = 0").run(user.id);
      return ok(res, null, "Link xác nhận đã hết hạn. Tài khoản đăng ký đã bị hủy.");
    }

    db.prepare("DELETE FROM users WHERE id = ? AND email_verified = 0").run(user.id);
    return ok(res, null, "Bạn đã từ chối xác nhận email. Tài khoản đăng ký đã bị hủy.");
  } catch (error) {
    console.error("Reject email error:", error);
    return fail(res, 500, "Lỗi từ chối xác nhận email.");
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
