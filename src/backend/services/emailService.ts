import crypto from "crypto";
import nodemailer from "nodemailer";

type VerificationEmailInput = {
  to: string;
  fullName: string;
  token: string;
};

const getFrontendUrl = () => (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

export const createEmailVerificationToken = () => crypto.randomBytes(32).toString("hex");

export const getEmailVerificationExpiry = () => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  return expiresAt.toISOString();
};

export const buildVerificationUrl = (token: string) => {
  const url = new URL("/verify-email", getFrontendUrl());
  url.searchParams.set("token", token);
  return url.toString();
};

export const isEmailConfigured = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const sendVerificationEmail = async ({ to, fullName, token }: VerificationEmailInput) => {
  if (!isEmailConfigured()) {
    throw new Error("SMTP_USER and SMTP_PASS must be configured before sending email.");
  }

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465;
  const from = process.env.SMTP_FROM || `"BookHaven" <${process.env.SMTP_USER}>`;
  const verificationUrl = buildVerificationUrl(token);
  const safeFullName = escapeHtml(fullName);
  const safeVerificationUrl = escapeHtml(verificationUrl);
  const smtpPass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    auth: {
      user: process.env.SMTP_USER,
      pass: smtpPass
    }
  });

  const info = await transporter.sendMail({
    from,
    to,
    subject: "Xac nhan dang ky tai khoan BookHaven",
    text: [
      `Xin chao ${fullName},`,
      "",
      "Cam on ban da dang ky BookHaven. Vui long bam vao lien ket ben duoi de xac nhan email:",
      verificationUrl,
      "",
      "Lien ket co hieu luc trong 24 gio."
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h2>Xac nhan dang ky BookHaven</h2>
        <p>Xin chao ${safeFullName},</p>
        <p>Cam on ban da dang ky BookHaven. Bam nut ben duoi de xac nhan email va kich hoat tai khoan.</p>
        <p>
          <a href="${safeVerificationUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:bold">
            Xac nhan email
          </a>
        </p>
        <p>Lien ket co hieu luc trong 24 gio.</p>
      </div>
    `
  });

  console.log("Verification email sent:", {
    to,
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response
  });
};
