import React, { useState, useEffect } from "react";
import { authService } from "../services/api.ts";
import { useAuth } from "../context/AuthContext.tsx";
import { User, Lock, Mail, CheckCircle, AlertCircle } from "lucide-react";

const Profile = () => {
  const { user, login } = useAuth();
  const [fullName, setFullName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const isValidFullName = (value: string) => {
    const trimmed = value.trim();
    return trimmed.length >= 2 && trimmed.length <= 100 && /^[A-Za-zÀ-ỹ\s]+$/u.test(trimmed);
  };

  const isStrongPassword = (value: string) => value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!isValidFullName(fullName)) {
      setMessage({ type: "error", text: "Họ tên chỉ được chứa chữ và khoảng trắng, dài từ 2 đến 100 ký tự." });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Mật khẩu mới không khớp" });
      return;
    }

    if (newPassword && !isStrongPassword(newPassword)) {
      setMessage({ type: "error", text: "Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ và số." });
      return;
    }

    setLoading(true);
    try {
      const response = await authService.updateProfile({
        fullName: fullName.trim(),
        currentPassword: newPassword ? currentPassword : undefined,
        newPassword: newPassword || undefined
      });
      
      // Update local auth context
      if (response.user) {
        login({ token: localStorage.getItem("token"), user: response.user });
      }
      
      setMessage({ type: "success", text: response.message });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="text-center py-20">Vui lòng đăng nhập để xem trang này</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-indigo-600 p-8 text-white text-center">
          <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <User size={40} />
          </div>
          <h1 className="text-2xl font-bold">Thông tin cá nhân</h1>
          <p className="text-indigo-100">{user.email}</p>
        </div>

        <div className="p-8">
          {message.text && (
            <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${
              message.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
            }`}>
              {message.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span className="font-medium">{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center">
                <User size={16} className="mr-2" /> Họ và tên
              </label>
              <input
                type="text"
                required
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="pt-6 border-t space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center">
                <Lock size={18} className="mr-2" /> Thay đổi mật khẩu
              </h3>
              <p className="text-sm text-gray-500">Để trống nếu bạn không muốn thay đổi mật khẩu.</p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Mật khẩu mới</label>
                    <input
                      type="password"
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Nhập lại mật khẩu mới</label>
                    <input
                      type="password"
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? "Đang lưu..." : "Cập nhật thông tin"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
