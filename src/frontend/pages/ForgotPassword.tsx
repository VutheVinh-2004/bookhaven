import React, { useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound, Lock, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/api.ts";
import { isStrongPassword } from "../utils/validation.ts";

const ForgotPassword = () => {
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const normalizedEmail = email.trim().toLowerCase();

  const requestOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setFieldErrors({});
    setMessage({ type: "", text: "" });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setFieldErrors({ email: "Email không đúng định dạng." });
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(normalizedEmail);
      setStep("reset");
      setMessage({ type: "success", text: "Nếu email hợp lệ, mã OTP đã được gửi. Vui lòng kiểm tra hộp thư." });
    } catch (err: any) {
      if (err?.errors && typeof err.errors === "object") setFieldErrors(err.errors);
      setMessage({ type: "error", text: err.message || "Không thể gửi mã OTP." });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    setMessage({ type: "", text: "" });

    if (!/^[0-9]{6}$/.test(otp)) errors.otp = "Mã OTP phải gồm 6 chữ số.";
    if (!isStrongPassword(newPassword)) errors.newPassword = "Mật khẩu mới phải từ 8 đến 200 ký tự, gồm chữ và số.";
    if (newPassword !== confirmPassword) errors.confirmPassword = "Mật khẩu nhập lại không khớp.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      await authService.resetPassword({ email: normalizedEmail, otp, newPassword });
      setMessage({ type: "success", text: "Đặt lại mật khẩu thành công. Đang chuyển đến trang đăng nhập..." });
      window.setTimeout(() => navigate("/login"), 1200);
    } catch (err: any) {
      if (err?.errors && typeof err.errors === "object") setFieldErrors(err.errors);
      setMessage({ type: "error", text: err.message || "Không thể đặt lại mật khẩu." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" /> Quay lại đăng nhập
        </Link>

        <div className="text-center mt-6 mb-8">
          <div className="mx-auto h-14 w-14 rounded-full bg-indigo-50 text-indigo-600 grid place-items-center">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Quên mật khẩu</h1>
          <p className="text-gray-500 mt-2">
            {step === "email" ? "Nhập email để nhận mã OTP đặt lại mật khẩu." : "Nhập mã OTP trong email và mật khẩu mới."}
          </p>
        </div>

        {message.text && (
          <div className={`p-4 rounded-lg mb-6 flex items-start gap-2 ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
            {message.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" /> : <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={requestOtp} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  maxLength={254}
                  className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Mail className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
              </div>
              {fieldErrors.email && <p className="text-xs font-medium text-red-600">{fieldErrors.email}</p>}
            </div>
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50">
              {loading ? "Đang gửi mã OTP..." : "Gửi mã OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="space-y-5">
            <div className="rounded-lg bg-gray-50 border px-4 py-3 text-sm text-gray-600">
              Mã OTP đã được gửi đến <span className="font-bold text-gray-900">{normalizedEmail}</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Mã OTP</label>
              <input
                inputMode="numeric"
                maxLength={6}
                className="w-full p-3 border rounded-xl text-center text-2xl font-bold tracking-[0.35em] focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              />
              {fieldErrors.otp && <p className="text-xs font-medium text-red-600">{fieldErrors.otp}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Mật khẩu mới</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  maxLength={200}
                  className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Lock className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
              </div>
              {fieldErrors.newPassword && <p className="text-xs font-medium text-red-600">{fieldErrors.newPassword}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Nhập lại mật khẩu mới</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  maxLength={200}
                  className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Lock className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
              </div>
              {fieldErrors.confirmPassword && <p className="text-xs font-medium text-red-600">{fieldErrors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50">
              {loading ? "Đang đặt lại mật khẩu..." : "Đặt lại mật khẩu"}
            </button>
            <button type="button" disabled={loading} onClick={() => void requestOtp()} className="w-full text-sm font-bold text-indigo-600 hover:underline disabled:opacity-50">
              Gửi lại mã OTP
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
