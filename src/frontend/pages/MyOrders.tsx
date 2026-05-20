import React, { useEffect, useState } from "react";
import { orderService } from "../services/api.ts";
import { Package, Clock, CheckCircle, Truck, XCircle, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";
import { Link } from "react-router-dom";

const MyOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      orderService.getMyOrders()
        .then(setOrders)
        .finally(() => setLoading(false));
    }
  }, [user]);

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
                <Link to={`/orders/${order.id}`} className="text-indigo-600 text-sm font-bold flex items-center hover:underline">
                  Chi tiết <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
