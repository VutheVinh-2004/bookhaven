import React, { useEffect, useState } from "react";
import { cartService, orderService } from "../services/api.ts";
import { Trash2, ShoppingBag, ArrowRight, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";

const FALLBACK_BOOK_COVER = "https://placehold.co/200x300/e5e7eb/6b7280?text=BookHaven";

const Cart = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [ordering, setOrdering] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchCart = () => {
    setLoading(true);
    cartService.get()
      .then(setItems)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) fetchCart();
    else setLoading(false);
  }, [user]);

  const updateQuantity = async (id: number, q: number) => {
    if (q < 1) return;
    try {
      await cartService.update(id, q);
      fetchCart();
    } catch (err: any) {
      alert(err.message || "Lỗi cập nhật số lượng");
      fetchCart(); // Refresh to revert UI to valid state
    }
  };

  const removeItem = async (id: number) => {
    try {
      await cartService.remove(id);
      fetchCart();
    } catch (err) {
      alert("Lỗi xóa sản phẩm");
    }
  };

  const handleOrder = async () => {
    const normalizedAddress = address.trim();
    const normalizedPhone = phone.replace(/[\s.-]/g, "").trim();

    if (!normalizedAddress || !normalizedPhone) {
      alert("Vui lòng nhập đầy đủ địa chỉ và số điện thoại giao hàng");
      return;
    }

    if (normalizedAddress.length < 5 || normalizedAddress.length > 255) {
      alert("Địa chỉ giao hàng phải từ 5 đến 255 ký tự.");
      return;
    }

    if (!/^(0|\+84)[0-9]{8,10}$/.test(normalizedPhone)) {
      alert("Số điện thoại Việt Nam không hợp lệ.");
      return;
    }

    setOrdering(true);
    try {
      await orderService.create({ shipping_address: normalizedAddress, phone: normalizedPhone });
      alert("Đặt hàng thành công!");
      navigate("/orders");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setOrdering(false);
    }
  };

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (!user) return <div className="text-center py-20">Vui lòng <Link to="/login" className="text-indigo-600 font-bold">đăng nhập</Link> để xem giỏ hàng</div>;
  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
        <ShoppingBag className="mr-3 h-8 w-8 text-indigo-600" /> Giỏ hàng của bạn
      </h1>

      {items.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
          <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Giỏ hàng trống</h2>
          <p className="text-gray-500 mb-8">Bạn chưa thêm cuốn sách nào vào giỏ hàng.</p>
          <Link to="/" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all inline-block">
            Tiếp tục mua sắm
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <img
                  src={item.image_url || FALLBACK_BOOK_COVER}
                  alt={item.title}
                  className="w-20 h-28 object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== FALLBACK_BOOK_COVER) {
                      target.src = FALLBACK_BOOK_COVER;
                    }
                  }}
                />
                <div className="flex-grow">
                  <h3 className="font-bold text-gray-900 line-clamp-1">{item.title}</h3>
                  <p className="text-indigo-600 font-bold">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                  </p>
                  <div className="flex items-center mt-2 space-x-3">
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2 py-1 hover:bg-gray-100">-</button>
                      <input
                        type="number"
                        min="1"
                        max={item.stock}
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) {
                            updateQuantity(item.id, Math.max(1, Math.min(item.stock, val)));
                          }
                        }}
                        className="w-12 py-1 font-medium text-center border-x focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 hover:bg-gray-100">+</button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 p-1">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
                <div className="text-right font-bold text-gray-900">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
              <h3 className="text-xl font-bold text-gray-900">Tổng quan đơn hàng</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính</span>
                  <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span className="text-green-600 font-medium">Miễn phí</span>
                </div>
                <div className="pt-4 border-t flex justify-between text-xl font-bold text-gray-900">
                  <span>Tổng cộng</span>
                  <span className="text-indigo-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" /> Địa chỉ giao hàng
                </label>
                <textarea
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                  placeholder="Nhập địa chỉ nhận hàng của bạn..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Nhập số điện thoại liên hệ..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <button
                onClick={handleOrder}
                disabled={ordering}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center disabled:opacity-50"
              >
                {ordering ? "Đang xử lý..." : <><ShoppingBag className="mr-2" /> Đặt hàng ngay <ArrowRight className="ml-2 h-5 w-5" /></>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
