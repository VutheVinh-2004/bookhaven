import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "../services/api.ts";
import { Mail, Lock, User, AlertCircle, CheckCircle2 } from "lucide-react";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setFieldErrors({});

    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim();
    const clientErrors: Record<string, string> = {};

    if (trimmedFullName.length < 2 || trimmedFullName.length > 100) {
      clientErrors.fullName = "Họ tên phải từ 2 đến 100 ký tự.";
    } else if (!/^[A-Za-zÀ-ỹ\s]+$/u.test(trimmedFullName)) {
      clientErrors.fullName = "Họ tên chỉ được chứa chữ và khoảng trắng.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      clientErrors.email = "Email không đúng định dạng.";
    }

    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      clientErrors.password = "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ và số.";
    }

    if (password !== confirmPassword) {
      clientErrors.confirmPassword = "Mật khẩu nhập lại không khớp.";
    }

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setError("Vui lòng kiểm tra lại thông tin đăng ký.");
      return;
    }

    setLoading(true);
    try {
      await authService.register({ email: trimmedEmail, password, fullName: trimmedFullName });
      setSuccess("Vui lòng kiểm tra email để xác nhận tài khoản.");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFullName("");
    } catch (err: any) {
      if (err?.errors && typeof err.errors === "object") {
        setFieldErrors(err.errors);
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tạo tài khoản</h1>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg mb-6 flex items-start gap-2">
            <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Họ và tên</label>
            <div className="relative">
              <input
                type="text"
                required
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <User className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
            </div>
            {fieldErrors.fullName && <p className="text-red-600 text-xs">{fieldErrors.fullName}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Gmail hoặc email</label>
            <div className="relative">
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="email@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Mail className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
            </div>
            {fieldErrors.email && <p className="text-red-600 text-xs">{fieldErrors.email}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Mật khẩu</label>
            <div className="relative">
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
            </div>
            {fieldErrors.password && <p className="text-red-600 text-xs">{fieldErrors.password}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Nhập lại mật khẩu</label>
            <div className="relative">
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Lock className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
            </div>
            {fieldErrors.confirmPassword && <p className="text-red-600 text-xs">{fieldErrors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Đang gửi email xác nhận..." : "Đăng ký"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-indigo-600 font-bold hover:underline">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
