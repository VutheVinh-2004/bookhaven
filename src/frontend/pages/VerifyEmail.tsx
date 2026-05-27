import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2, MailCheck, XCircle } from "lucide-react";
import { authService } from "../services/api.ts";

type VerifyStatus = "prompt" | "loading" | "success" | "declined" | "error";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() || "", [searchParams]);
  const [status, setStatus] = useState<VerifyStatus>(token ? "prompt" : "error");
  const [message, setMessage] = useState(
    token
      ? "Vui lòng chọn xác nhận để kích hoạt tài khoản, hoặc từ chối nếu bạn không muốn đăng ký."
      : "Link xác nhận không hợp lệ."
  );
  const navigate = useNavigate();

  const handleConfirm = async () => {
    if (!token) {
      setStatus("error");
      setMessage("Link xác nhận không hợp lệ.");
      return;
    }

    setStatus("loading");
    setMessage("Đang xác nhận email...");

    try {
      await authService.verifyEmail(token);
      setStatus("success");
      setMessage("Đăng ký thành công. Bạn sẽ được chuyển về trang đăng nhập.");
      window.setTimeout(() => navigate("/login"), 1500);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Không thể xác nhận email.");
    }
  };

  const handleDecline = async () => {
    if (!token) {
      setStatus("error");
      setMessage("Link xác nhận không hợp lệ.");
      return;
    }

    setStatus("loading");
    setMessage("Đang từ chối xác nhận email...");

    try {
      await authService.rejectEmail(token);
      setStatus("declined");
      setMessage("Bạn đã từ chối xác nhận email. Tài khoản đăng ký đã bị hủy.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Không thể từ chối xác nhận email.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center">
        <div className="flex justify-center mb-5">
          {status === "prompt" && <MailCheck className="h-12 w-12 text-indigo-600" />}
          {status === "loading" && <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />}
          {status === "success" && <CheckCircle2 className="h-12 w-12 text-emerald-600" />}
          {status === "declined" && <XCircle className="h-12 w-12 text-amber-600" />}
          {status === "error" && <AlertCircle className="h-12 w-12 text-red-600" />}
        </div>

        <h1 className="text-3xl font-bold text-gray-900">Xác nhận email</h1>
        <p className="text-gray-500 mt-3">{message}</p>

        {status === "prompt" && (
          <div className="mt-8 flex justify-center gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Xác nhận
            </button>
            <button
              type="button"
              onClick={handleDecline}
              className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Từ chối
            </button>
          </div>
        )}

        {status === "success" && (
          <div className="mt-8">
            <Link to="/login" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Đăng nhập
            </Link>
          </div>
        )}

        {status === "declined" && (
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Đăng ký lại
            </Link>
            <Link to="/login" className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Đăng nhập
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Đăng ký lại
            </Link>
            <Link to="/login" className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Đăng nhập
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
