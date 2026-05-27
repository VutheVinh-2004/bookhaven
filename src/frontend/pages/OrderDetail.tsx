import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { orderService } from "../services/api.ts";
import { ArrowLeft, Package, MapPin, Calendar, CreditCard, Clock, CheckCircle, Truck, XCircle } from "lucide-react";

const FALLBACK_BOOK_COVER = "https://placehold.co/200x300/e5e7eb/6b7280?text=BookHaven";

const getPaymentMethodText = (method?: string) => {
  switch (method) {
    case "card": return "Thanh toán bằng thẻ";
    case "qr_code": return "Thanh toán bằng QR";
    case "bank_transfer": return "Chuyển khoản ngân hàng";
    case "momo": return "Ví MoMo";
    case "cod":
    default: return "Thanh toán khi nhận hàng (COD)";
  }
};

const getPaymentStatusText = (status?: string) => {
  switch (status) {
    case "paid": return "Đã thanh toán";
    case "pending": return "Chờ thanh toán";
    case "unpaid":
    default: return "Chưa thanh toán";
  }
};

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      orderService.getDetails(id)
        .then(setOrder)
        .finally(() => setLoading(false));
    }
  }, [id]);

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

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  if (!order) return <div className="text-center py-20">Không tìm thấy đơn hàng</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="mr-2 h-5 w-5" /> Quay lại
      </button>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-indigo-600 p-8 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Chi tiết đơn hàng #ORD-{order.id}</h1>
              <p className="text-indigo-100 flex items-center mt-1">
                <Calendar className="h-4 w-4 mr-2" /> 
                Ngày đặt: {new Date(order.created_at).toLocaleString('vi-VN')}
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2">
              {getStatusIcon(order.status)}
              <span className="font-bold">{getStatusText(order.status)}</span>
            </div>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-indigo-600" /> Thông tin giao hàng
              </h3>
              <div className="text-gray-600 bg-gray-50 p-4 rounded-xl border border-dashed space-y-2">
                <p><span className="font-medium">Địa chỉ:</span> {order.shipping_address}</p>
                {order.phone && <p><span className="font-medium">Số điện thoại:</span> {order.phone}</p>}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-indigo-600" /> Phương thức thanh toán
              </h3>
              <div className="text-gray-600 space-y-2">
                <p>{getPaymentMethodText(order.payment_method)}</p>
                <p>
                  Trạng thái: <span className={order.payment_status === "paid" ? "font-bold text-emerald-600" : "font-bold text-amber-600"}>{getPaymentStatusText(order.payment_status)}</span>
                </p>
                {order.payment_method !== "cod" && order.payment_status !== "paid" && (
                  <Link to={`/payment/${order.id}`} className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700">
                    Thanh toán ngay
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl border space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Tóm tắt chi phí</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span>
                <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_price)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span>
                <span className="text-green-600">Miễn phí</span>
              </div>
              <div className="pt-4 border-t flex justify-between text-xl font-bold text-indigo-600">
                <span>Tổng cộng</span>
                <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_price)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t">
          <div className="p-8 space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Sản phẩm đã đặt</h3>
            <div className="space-y-4">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl border hover:bg-gray-50 transition-colors">
                  <img
                    src={item.image_url || FALLBACK_BOOK_COVER}
                    alt={item.title}
                    className="w-16 h-24 object-cover rounded-lg shadow-sm"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== FALLBACK_BOOK_COVER) {
                        target.src = FALLBACK_BOOK_COVER;
                      }
                    }}
                  />
                  <div className="flex-grow">
                    <h4 className="font-bold text-gray-900">{item.title}</h4>
                    <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-indigo-600">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                    </div>
                    <div className="text-xs text-gray-400">Đơn giá</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
