import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/api.ts";
import { useAuth } from "../context/AuthContext.tsx";
import { Mail, Lock, AlertCircle } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const data = await authService.login({ email, password });
      login(data);
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) return;

    setError("");
    setNotice("");
    setResending(true);
    try {
      await authService.resendVerification(email);
      setNotice("Da gui lai email xac nhan. Vui long kiem tra hop thu cua ban.");
    } catch (err: any) {
      setError(err.message || "Khong the gui lai email xac nhan.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Chào mừng trở lại</h1>
          <p className="text-gray-500 mt-2">Đăng nhập để tiếp tục mua sắm tại BookHaven</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {notice && (
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg mb-6 text-sm font-medium">
            {notice}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Email</label>
            <div className="relative">
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Mail className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
            </div>
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
          {error && email.trim() && (
            <button
              type="button"
              disabled={resending}
              onClick={handleResendVerification}
              className="w-full border border-indigo-200 text-indigo-700 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors disabled:opacity-50"
            >
              {resending ? "Dang gui..." : "Gui lai email xac nhan"}
            </button>
          )}
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="text-indigo-600 font-bold hover:underline">
            Đăng ký ngay
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
