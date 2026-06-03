import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, CreditCard, Loader2, LockKeyhole } from "lucide-react";
import { orderService } from "../services/api.ts";
import { useToast } from "../context/ToastContext.tsx";

const TEST_CARD = {
  number: "9704000000000018",
  holder: "NGUYEN VAN A",
  expiry: "12/30",
  cvv: "123",
  otp: "123456"
};

const formatCurrency = (value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);
const normalizeDigits = (value: string) => value.replace(/\D/g, "");
const maskCard = (value: string) => {
  const digits = normalizeDigits(value);
  if (digits.length < 4) return "**** **** **** ****";
  return `**** **** **** ${digits.slice(-4)}`;
};

const getPaymentMethodText = (method?: string) => {
  switch (method) {
    case "card": return "Thanh toán bằng thẻ";
    case "qr_code": return "Phương thức không còn hỗ trợ";
    case "cod":
    default: return "Thanh toán khi nhận hàng";
  }
};

const PaymentTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [cardStep, setCardStep] = useState<"details" | "otp">("details");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [otp, setOtp] = useState("");
  const [cardError, setCardError] = useState("");

  useEffect(() => {
    if (!id) return;
    orderService.getDetails(id)
      .then((data) => {
        setOrder(data);
        setPaid(data.payment_status === "paid");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const validateCardDetails = () => {
    if (normalizeDigits(cardNumber) !== TEST_CARD.number) {
      setCardError("Thông tin thẻ không hợp lệ.");
      return false;
    }
    if (cardHolder.trim().toUpperCase() !== TEST_CARD.holder) {
      setCardError("Thông tin thẻ không hợp lệ.");
      return false;
    }
    if (expiry.trim() !== TEST_CARD.expiry || cvv.trim() !== TEST_CARD.cvv) {
      setCardError("Ngày hết hạn hoặc CVV không đúng.");
      return false;
    }
    setCardError("");
    return true;
  };

  const handleContinueToOtp = () => {
    if (!validateCardDetails()) return;
    setOtp("");
    setCardStep("otp");
  };

  const handlePayTest = async () => {
    if (!id) return;
    if (order?.payment_method === "card") {
      if (!validateCardDetails()) return;
      if (otp.trim() !== TEST_CARD.otp) {
        setCardError("Mã OTP không đúng.");
        return;
      }
    }

    setPaying(true);
    try {
      await orderService.payTest(id);
      setPaid(true);
      showToast("Thanh toán thành công.", "success");
      window.setTimeout(() => navigate(`/orders/${id}`), 1200);
    } catch (err: any) {
      showToast(err.message || "Không thể thanh toán.", "error");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 text-indigo-600 animate-spin" /></div>;
  }

  if (!order) {
    return <div className="text-center py-20">Không tìm thấy đơn hàng.</div>;
  }

  const isCard = order.payment_method === "card";

  if (order.payment_method !== "card") {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900">Đơn hàng không cần thanh toán online</h1>
          <p className="text-sm text-gray-500 mt-2">
            {order.payment_method === "cod"
              ? "Đơn COD sẽ được thanh toán khi bạn nhận hàng."
              : "Phương thức thanh toán của đơn hàng này không còn được hỗ trợ."}
          </p>
          <Link to={`/orders/${order.id}`} className="inline-block mt-6 text-indigo-600 font-bold hover:underline">
            Xem chi tiết đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 bg-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <CreditCard className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Thanh toán đơn #ORD-{order.id}</h1>
              <p className="text-indigo-100 mt-1">{getPaymentMethodText(order.payment_method)}</p>
            </div>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 border">
                <div className="text-sm text-gray-500">Số tiền</div>
                <div className="text-2xl font-bold text-indigo-600 mt-1">{formatCurrency(order.total_price)}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border">
                <div className="text-sm text-gray-500">Phương thức</div>
                <div className="font-bold text-gray-900 mt-1">{getPaymentMethodText(order.payment_method)}</div>
              </div>
            </div>

            {isCard && !paid && cardStep === "details" && (
              <div className="border rounded-2xl p-5 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Nhập thông tin thẻ</h2>
                    <p className="text-sm text-gray-500">Thông tin thẻ được bảo mật trong quá trình thanh toán.</p>
                  </div>
                </div>

                <div className="bg-gray-900 text-white rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">BOOKHAVEN CARD</span>
                    <CreditCard className="h-6 w-6 text-indigo-200" />
                  </div>
                  <div className="mt-8 text-xl font-bold tracking-widest">{maskCard(cardNumber)}</div>
                  <div className="mt-6 flex justify-between text-sm">
                    <div>
                      <div className="text-gray-400">Chủ thẻ</div>
                      <div className="font-semibold">{cardHolder || "NGUYEN VAN A"}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Hiệu lực</div>
                      <div className="font-semibold">{expiry || "MM/YY"}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input inputMode="numeric" maxLength={19} className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Số thẻ" value={cardNumber} onChange={(e) => setCardNumber(normalizeDigits(e.target.value))} />
                  <input maxLength={100} className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Tên chủ thẻ" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} />
                  <input maxLength={5} className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="MM/YY" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
                  <input inputMode="numeric" maxLength={4} className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="CVV" value={cvv} onChange={(e) => setCvv(normalizeDigits(e.target.value))} />
                </div>
                {cardError && <p className="text-sm font-semibold text-red-600">{cardError}</p>}
                <button type="button" onClick={handleContinueToOtp} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                  Tiếp tục thanh toán
                </button>
              </div>
            )}

            {isCard && !paid && cardStep === "otp" && (
              <div className="border rounded-2xl p-5 space-y-5">
                <div className="text-center">
                  <div className="h-14 w-14 rounded-full bg-indigo-50 text-indigo-600 mx-auto grid place-items-center">
                    <LockKeyhole className="h-7 w-7" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mt-4">Xác thực OTP</h2>
                  <p className="text-sm text-gray-500 mt-1">Mã OTP đã được gửi tới số điện thoại đăng ký với ngân hàng.</p>
                </div>

                <div className="bg-gray-50 border rounded-xl p-4 space-y-2 text-sm text-gray-600">
                  <p><span className="font-semibold text-gray-900">Đơn hàng:</span> #ORD-{order.id}</p>
                  <p><span className="font-semibold text-gray-900">Số tiền:</span> {formatCurrency(order.total_price)}</p>
                  <p><span className="font-semibold text-gray-900">Thẻ:</span> {maskCard(cardNumber)}</p>
                </div>

                <input
                  className="w-full p-4 border rounded-xl text-center text-2xl font-bold tracking-[0.4em] outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="______"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(normalizeDigits(e.target.value))}
                />
                {cardError && <p className="text-sm font-semibold text-red-600">{cardError}</p>}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button type="button" onClick={() => { setCardStep("details"); setCardError(""); }} className="border border-gray-200 py-4 rounded-xl font-bold text-gray-700 hover:bg-gray-50">
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={handlePayTest}
                    disabled={paying}
                    className="bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {paying ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Đang xử lý...</> : "Xác nhận OTP"}
                  </button>
                </div>
              </div>
            )}

            {isCard && paid && (
              <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl p-4 flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-5 w-5" /> Đơn hàng đã được thanh toán.
              </div>
            )}

            <Link to={`/orders/${order.id}`} className="block text-center text-sm font-bold text-indigo-600 hover:underline">
              Xem chi tiết đơn hàng
            </Link>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 border border-dashed rounded-2xl p-6 text-center">
              <div className="mx-auto h-56 w-56 bg-white border rounded-xl grid place-items-center">
                <CreditCard className="h-28 w-28 text-gray-800" />
              </div>
              <p className="text-sm text-gray-500 mt-4">Cổng thanh toán thẻ</p>
            </div>

            <div className="border rounded-xl p-4 space-y-2 text-sm text-gray-600">
              <p><span className="font-semibold text-gray-900">SĐT nhận hàng:</span> {order.phone}</p>
              <p><span className="font-semibold text-gray-900">Địa chỉ:</span> {order.shipping_address}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentTest;
