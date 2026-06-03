import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import db from "../db/index.ts";
import { AuthRequest, signToken } from "../middleware/auth.ts";
import { created, fail, ok } from "../utils/response.ts";
import { hasErrors, isEmail, isNonEmptyString, isStrongPassword, isValidFullName, normalizeEmail, trimText, ValidationErrors } from "../utils/validation.ts";
import {
  buildVerificationUrl,
  createEmailVerificationToken,
  getEmailVerificationExpiry,
  isEmailConfigured,
  sendPasswordResetOtpEmail,
  sendVerificationEmail
} from "../services/emailService.ts";

const publicUser = (user: any) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  fullName: user.full_name ?? user.fullName ?? ""
});

const createPasswordResetOtp = () => crypto.randomInt(100000, 1000000).toString();
const hashPasswordResetOtp = (email: string, otp: string) =>
  crypto.createHash("sha256").update(`${email}:${otp}:${process.env.JWT_SECRET || ""}`).digest("hex");
const getPasswordResetExpiry = () => new Date(Date.now() + 10 * 60 * 1000).toISOString();

export const register = async (req: Request, res: Response) => {
  const email = typeof req.body.email === "string" ? normalizeEmail(req.body.email) : "";
  const password = req.body.password;
  const fullName = trimText(req.body.fullName);
  const errors: ValidationErrors = {};

  if (!isEmail(email)) errors.email = "Email không đúng định dạng.";
  if (!isStrongPassword(password)) errors.password = "Mật khẩu phải từ 8 đến 200 ký tự, gồm chữ và số.";
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
  if (!isEmail(email)) return fail(res, 400, "Email không đúng định dạng.");

  try {
    const user = db.prepare(
      "SELECT id, email, full_name, email_verified FROM users WHERE email = ?"
    ).get(email) as any;

    if (!user) {
      return ok(res, null, "Nếu email tồn tại và chưa xác nhận, BookHaven sẽ gửi lại liên kết xác nhận.");
    }
    if (user.email_verified) {
      return ok(res, null, "Tài khoản đã được xác nhận email.");
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
        "SMTP chưa cấu hình. Đã tạo lại liên kết xác nhận cho môi trường phát triển."
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
      "Đã gửi lại email xác nhận."
    );
  } catch (error) {
    console.error("Resend verification email error:", error);
    return fail(res, 500, "Không thể gửi lại email xác nhận.");
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  const email = typeof req.body.email === "string" ? normalizeEmail(req.body.email) : "";
  if (!isEmail(email)) return fail(res, 400, "Email không đúng định dạng.", { email: "Email không đúng định dạng." });

  const genericMessage = "Nếu email tồn tại, BookHaven sẽ gửi mã OTP đặt lại mật khẩu.";

  try {
    const user = db.prepare(
      "SELECT id, email, full_name, email_verified, is_active FROM users WHERE email = ?"
    ).get(email) as any;

    if (!user || !user.is_active) {
      return ok(res, null, genericMessage);
    }

    if (!isEmailConfigured()) {
      return fail(res, 500, "Hệ thống gửi email chưa được cấu hình.");
    }

    const otp = createPasswordResetOtp();
    const otpHash = hashPasswordResetOtp(email, otp);
    db.prepare(`
      UPDATE users
      SET password_reset_otp_hash = ?,
          password_reset_expires_at = ?,
          password_reset_attempts = 0
      WHERE id = ?
    `).run(otpHash, getPasswordResetExpiry(), user.id);

    try {
      await sendPasswordResetOtpEmail({
        to: user.email,
        fullName: user.full_name || user.email,
        otp
      });
    } catch (emailError) {
      db.prepare(`
        UPDATE users
        SET password_reset_otp_hash = NULL,
            password_reset_expires_at = NULL,
            password_reset_attempts = 0
        WHERE id = ?
      `).run(user.id);
      throw emailError;
    }

    return ok(res, null, genericMessage);
  } catch (error) {
    console.error("Request password reset error:", error);
    return fail(res, 500, "Không thể gửi mã OTP. Vui lòng thử lại sau.");
  }
};

export const resetPasswordWithOtp = async (req: Request, res: Response) => {
  const email = typeof req.body.email === "string" ? normalizeEmail(req.body.email) : "";
  const otp = typeof req.body.otp === "string" ? req.body.otp.trim() : "";
  const newPassword = req.body.newPassword;
  const errors: ValidationErrors = {};

  if (!isEmail(email)) errors.email = "Email không đúng định dạng.";
  if (!/^[0-9]{6}$/.test(otp)) errors.otp = "Mã OTP phải gồm 6 chữ số.";
  if (!isStrongPassword(newPassword)) errors.newPassword = "Mật khẩu mới phải từ 8 đến 200 ký tự, gồm chữ và số.";
  if (hasErrors(errors)) return fail(res, 400, "Dữ liệu đặt lại mật khẩu không hợp lệ.", errors);

  try {
    const user = db.prepare(`
      SELECT id, password_reset_otp_hash, password_reset_expires_at, password_reset_attempts
      FROM users
      WHERE email = ? AND is_active = 1
    `).get(email) as any;

    if (!user || !user.password_reset_otp_hash || !user.password_reset_expires_at) {
      return fail(res, 400, "Mã OTP không hợp lệ hoặc đã hết hạn.", { otp: "Mã OTP không hợp lệ hoặc đã hết hạn." });
    }

    if (user.password_reset_attempts >= 5 || new Date(user.password_reset_expires_at).getTime() < Date.now()) {
      db.prepare(`
        UPDATE users
        SET password_reset_otp_hash = NULL,
            password_reset_expires_at = NULL,
            password_reset_attempts = 0
        WHERE id = ?
      `).run(user.id);
      return fail(res, 400, "Mã OTP không hợp lệ hoặc đã hết hạn.", { otp: "Mã OTP không hợp lệ hoặc đã hết hạn." });
    }

    const otpHash = hashPasswordResetOtp(email, otp);
    const otpMatches = typeof user.password_reset_otp_hash === "string"
      && user.password_reset_otp_hash.length === otpHash.length
      && crypto.timingSafeEqual(Buffer.from(otpHash), Buffer.from(user.password_reset_otp_hash));
    if (!otpMatches) {
      db.prepare("UPDATE users SET password_reset_attempts = password_reset_attempts + 1 WHERE id = ?").run(user.id);
      return fail(res, 400, "Mã OTP không chính xác.", { otp: "Mã OTP không chính xác." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    db.prepare(`
      UPDATE users
      SET password = ?,
          email_verified = 1,
          email_verification_token = NULL,
          email_verification_expires_at = NULL,
          password_reset_otp_hash = NULL,
          password_reset_expires_at = NULL,
          password_reset_attempts = 0
      WHERE id = ?
    `).run(hashedPassword, user.id);

    return ok(res, null, "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.");
  } catch (error) {
    console.error("Reset password error:", error);
    return fail(res, 500, "Không thể đặt lại mật khẩu. Vui lòng thử lại sau.");
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  const token = typeof req.body.token === "string" ? req.body.token.trim() : "";
  if (!isNonEmptyString(token, 1, 256)) return fail(res, 400, "Mã xác nhận email không hợp lệ.");

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
  if (!isNonEmptyString(token, 1, 256)) return fail(res, 400, "Mã xác nhận email không hợp lệ.");

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
  const hasFullName = Object.prototype.hasOwnProperty.call(req.body, "fullName");
  const fullName = trimText(req.body.fullName);
  const currentPassword = req.body.currentPassword;
  const newPassword = req.body.newPassword;
  const errors: ValidationErrors = {};

  if (hasFullName && !isValidFullName(fullName, 2, 100)) errors.fullName = "Họ tên chỉ được chứa chữ và khoảng trắng, dài từ 2 đến 100 ký tự.";
  if (newPassword && !isStrongPassword(newPassword)) errors.newPassword = "Mật khẩu mới phải từ 8 đến 200 ký tự, gồm chữ và số.";
  if (newPassword && !isNonEmptyString(currentPassword, 1, 200)) errors.currentPassword = "Cần nhập mật khẩu hiện tại để đổi mật khẩu.";
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

    const updatedFullName = hasFullName ? fullName : user.full_name;
    db.prepare("UPDATE users SET full_name = ?, password = ? WHERE id = ?").run(updatedFullName, hashedPassword, userId);
    return ok(res, publicUser({ ...user, full_name: updatedFullName }), "Cập nhật thông tin thành công.");
  } catch (error) {
    console.error("Update profile error:", error);
    return fail(res, 500, "Lỗi cập nhật thông tin.");
  }
};
