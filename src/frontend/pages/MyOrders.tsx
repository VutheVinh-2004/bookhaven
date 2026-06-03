import React, { useEffect, useState } from "react";
import { orderService } from "../services/api.ts";
import { Package, Clock, CheckCircle, Truck, XCircle, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext.tsx";

const MyOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showToast } = useToast();

  const fetchOrders = () => {
    if (!user) return;
    setLoading(true);
    orderService.getMyOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setOrders([]);
      setLoading(false);
    }
  }, [user]);

  const handleCancelOrder = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn hủy đơn hàng này?")) return;

    try {
      await orderService.cancel(id);
      showToast("Đã hủy đơn hàng.", "success");
      fetchOrders();
    } catch (err: any) {
      showToast(err.message || "Không thể hủy đơn hàng.", "error");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="text-yellow-500" />;
      case "processing": return <Package className="text-blue-500" />;
      case "shipped": return <Truck className="text-indigo-500" />;
      case "delivered": return <CheckCircle className="text-green-500" />;
      case "cancelled": return <XCircle className="text-red-500" />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Chờ xử lý";
      case "processing": return "Đang đóng gói";
      case "shipped": return "Đang giao hàng";
      case "delivered": return "Đã giao hàng";
      case "cancelled": return "Đã hủy";
      default: return status;
    }
  };

  const getPaymentMethodText = (method?: string) => {
    switch (method) {
      case "card": return "Thẻ";
      case "qr_code": return "Không còn hỗ trợ";
      case "bank_transfer": return "Chuyển khoản";
      case "momo": return "MoMo";
      case "cod":
      default: return "COD";
    }
  };

  const getPaymentStatusText = (status?: string) => {
    switch (status) {
      case "paid": return "Đã thanh toán";
      case "pending": return "Chờ thanh toán";
      case "cancelled": return "Đã hủy thanh toán";
      case "unpaid":
      default: return "Chưa thanh toán";
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  if (!user) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
          <Package className="h-10 w-10 text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">
            Vui lòng <Link to="/login" className="text-indigo-600 font-bold hover:underline">đăng nhập</Link> để xem lịch sử đơn hàng.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Lịch sử đơn hàng</h1>

      {orders.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl text-center border border-dashed border-gray-300">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Bạn chưa có đơn hàng nào.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 font-medium">Mã đơn hàng:</span>
                    <span className="font-bold text-gray-900">#ORD-{order.id}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Ngày đặt: {new Date(order.created_at).toLocaleDateString('vi-VN')}
                  </div>
                  <div className="text-sm text-gray-500">
                    Thanh toán: {getPaymentMethodText(order.payment_method)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Trạng thái thanh toán: <span className={order.payment_status === "paid" ? "font-bold text-emerald-600" : order.payment_status === "cancelled" ? "font-bold text-red-600" : "font-bold text-amber-600"}>{getPaymentStatusText(order.payment_status)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Tổng cộng</div>
                    <div className="font-bold text-indigo-600">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_price)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border">
                    {getStatusIcon(order.status)}
                    <span className="font-bold text-sm text-gray-700">{getStatusText(order.status)}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-3 border-t flex justify-between items-center">
                <p className="text-sm text-gray-600 truncate max-w-md">
                  <span className="font-bold">Giao đến:</span> {order.shipping_address}
                </p>
                <div className="flex items-center gap-3">
                  {order.payment_method === "card" && order.payment_status !== "paid" && order.status !== "cancelled" && (
                    <Link to={`/payment/${order.id}`} className="text-amber-600 text-sm font-bold hover:underline">
                      Thanh toán ngay
                    </Link>
                  )}
                  {["pending", "processing"].includes(order.status) && order.payment_status !== "paid" && (
                    <button
                      type="button"
                      onClick={() => handleCancelOrder(order.id)}
                      className="text-red-600 text-sm font-bold hover:underline"
                    >
                      Hủy đơn
                    </button>
                  )}
                  <Link to={`/orders/${order.id}`} className="text-indigo-600 text-sm font-bold flex items-center hover:underline">
                    Chi tiết <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
