import React, { useState, useEffect } from "react";
import { authService } from "../services/api.ts";
import { useAuth } from "../context/AuthContext.tsx";
import { User, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { isStrongPassword, isValidFullName } from "../utils/validation.ts";

const Profile = () => {
  const { user, login } = useAuth();
  const [fullName, setFullName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setFieldErrors({});

    if (!isValidFullName(fullName)) {
      setFieldErrors({ fullName: "Họ tên chỉ được chứa chữ và khoảng trắng, dài từ 2 đến 100 ký tự." });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Mật khẩu mới không khớp." });
      return;
    }

    if (newPassword && !isStrongPassword(newPassword)) {
      setFieldErrors({ newPassword: "Mật khẩu mới phải từ 8 đến 200 ký tự, gồm chữ và số." });
      return;
    }

    if (newPassword && !currentPassword) {
      setFieldErrors({ currentPassword: "Vui lòng nhập mật khẩu hiện tại." });
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await authService.updateProfile({
        fullName: fullName.trim(),
        currentPassword: newPassword ? currentPassword : undefined,
        newPassword: newPassword || undefined
      });
      
      const token = localStorage.getItem("token");
      if (token) {
        login({ token, user: updatedUser });
      }
      
      setMessage({ type: "success", text: "Cập nhật thông tin thành công." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      if (err?.errors && typeof err.errors === "object") setFieldErrors(err.errors);
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
                maxLength={100}
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={fullName}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/\d/.test(value)) {
                    setFieldErrors((current) => ({ ...current, fullName: "Họ tên không được chứa số." }));
                  } else {
                    setFieldErrors((current) => {
                      const next = { ...current };
                      delete next.fullName;
                      return next;
                    });
                  }
                  setFullName(value.replace(/\d/g, ""));
                }}
              />
              {fieldErrors.fullName && <p className="text-xs font-medium text-red-600">{fieldErrors.fullName}</p>}
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
                    maxLength={200}
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  {fieldErrors.currentPassword && <p className="text-xs font-medium text-red-600">{fieldErrors.currentPassword}</p>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Mật khẩu mới</label>
                    <input
                      type="password"
                      maxLength={200}
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    {fieldErrors.newPassword && <p className="text-xs font-medium text-red-600">{fieldErrors.newPassword}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Nhập lại mật khẩu mới</label>
                    <input
                      type="password"
                      maxLength={200}
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {fieldErrors.confirmPassword && <p className="text-xs font-medium text-red-600">{fieldErrors.confirmPassword}</p>}
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
