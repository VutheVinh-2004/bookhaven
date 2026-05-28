import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Banknote,
  CreditCard,
  MapPin,
  Phone,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { cartService, orderService } from "../services/api.ts";
import { useAuth } from "../context/AuthContext.tsx";

const FALLBACK_BOOK_COVER = "https://placehold.co/200x300/e5e7eb/6b7280?text=BookHaven";

type Ward = { code: number; name: string };
type District = { code: number; name: string; wards?: Ward[] };
type Province = { code: number; name: string; districts?: District[] };
type PaymentMethod = "qr_code" | "cod" | "card";

const formatCurrency = (value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

const paymentOptions: Array<{
  value: PaymentMethod;
  label: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    value: "qr_code",
    label: "Thanh toán bằng QR",
    description: "Quét QR của bạn để chuyển khoản nhanh.",
    icon: QrCode
  },
  {
    value: "cod",
    label: "Thanh toán khi nhận hàng",
    description: "Trả tiền mặt khi sách được giao đến bạn.",
    icon: Banknote
  },
  {
    value: "card",
    label: "Thanh toán bằng thẻ",
    description: "Nhập thông tin thẻ và xác thực OTP.",
    icon: CreditCard
  }
];

const paymentGuide: Record<PaymentMethod, string[]> = {
  qr_code: ["Sau khi đặt hàng, bạn sẽ được chuyển sang trang QR thanh toán."],
  cod: ["Bạn thanh toán trực tiếp cho nhân viên giao hàng khi nhận sách."],
  card: ["Bạn sẽ nhập thông tin thẻ ở cổng thanh toán bảo mật.", "Giao dịch cần xác thực OTP trước khi hoàn tất."]
};

const Cart = () => {
  const [items, setItems] = useState<any[]>([]);
  const [quantityInputs, setQuantityInputs] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [streetAddress, setStreetAddress] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [ordering, setOrdering] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);
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

  useEffect(() => {
    const nextInputs: Record<number, string> = {};
    items.forEach((item) => {
      nextInputs[item.id] = String(item.quantity);
    });
    setQuantityInputs(nextInputs);
  }, [items]);

  useEffect(() => {
    const fetchAddressData = async () => {
      try {
        const res = await fetch("https://provinces.open-api.vn/api/?depth=3");
        const data = await res.json();
        setProvinces(Array.isArray(data) ? data : []);
      } catch {
        setProvinces([]);
      } finally {
        setAddressLoading(false);
      }
    };

    fetchAddressData();
  }, []);

  const updateQuantity = async (id: number, q: number) => {
    if (q < 1) return;
    try {
      await cartService.update(id, q);
      fetchCart();
    } catch (err: any) {
      alert(err.message || "Lỗi cập nhật số lượng");
      fetchCart();
    }
  };

  const applyQuantityInput = async (item: any) => {
    const raw = quantityInputs[item.id] ?? String(item.quantity);
    const parsed = Number.parseInt(raw, 10);

    if (Number.isNaN(parsed)) {
      setQuantityInputs((prev) => ({ ...prev, [item.id]: String(item.quantity) }));
      return;
    }

    const nextQuantity = Math.max(1, Math.min(item.stock, parsed));
    setQuantityInputs((prev) => ({ ...prev, [item.id]: String(nextQuantity) }));

    if (nextQuantity !== item.quantity) {
      await updateQuantity(item.id, nextQuantity);
    }
  };

  const removeItem = async (id: number) => {
    try {
      await cartService.remove(id);
      fetchCart();
    } catch {
      alert("Lỗi xóa sản phẩm");
    }
  };

  const handleOrder = async () => {
    const normalizedStreet = streetAddress.trim();
    const normalizedProvince = province.trim();
    const normalizedDistrict = district.trim();
    const normalizedWard = ward.trim();
    const normalizedAddress = `${normalizedStreet}, ${normalizedWard}, ${normalizedDistrict}, ${normalizedProvince}`.replace(/\s+/g, " ").trim();
    const normalizedPhone = phone.replace(/[\s.-]/g, "").trim();

    if (!normalizedStreet || !normalizedProvince || !normalizedDistrict || !normalizedWard || !normalizedPhone) {
      alert("Vui lòng nhập số nhà/đường và chọn đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã cùng số điện thoại.");
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
      const order = await orderService.create({ shipping_address: normalizedAddress, phone: normalizedPhone, payment_method: paymentMethod });
      if (paymentMethod === "cod") {
        alert("Đặt hàng thành công!");
        navigate("/orders");
      } else {
        navigate(`/payment/${order.id}`);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setOrdering(false);
    }
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasAddressDirectory = provinces.length > 0;
  const selectedProvince = provinces.find((p) => p.name === province);
  const districts = selectedProvince?.districts || [];
  const selectedDistrict = districts.find((d) => d.name === district);
  const wards = selectedDistrict?.wards || [];

  if (!user) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
          <ShoppingBag className="h-10 w-10 text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">
            Vui lòng <Link to="/login" className="text-indigo-600 font-bold hover:underline">đăng nhập</Link> để xem giỏ hàng
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-950 flex items-center">
            <ShoppingBag className="mr-3 h-8 w-8 text-indigo-600" /> Giỏ hàng của bạn
          </h1>
          <p className="text-gray-500 mt-2">{items.length} sản phẩm đang chờ thanh toán</p>
        </div>
        <Link to="/" className="text-sm font-bold text-indigo-600 hover:underline">
          Tiếp tục mua sách
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
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
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px] gap-8 items-start">
          <div className="space-y-5">
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition-shadow">
                  <img
                    src={item.image_url || FALLBACK_BOOK_COVER}
                    alt={item.title}
                    className="w-20 h-28 sm:w-24 sm:h-32 object-cover rounded-xl border border-gray-100"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== FALLBACK_BOOK_COVER) target.src = FALLBACK_BOOK_COVER;
                    }}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-950 line-clamp-2">{item.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">Còn {item.stock} cuốn trong kho</p>
                        <p className="text-indigo-600 font-bold mt-2">{formatCurrency(item.price)}</p>
                      </div>
                      <div className="text-left sm:text-right font-bold text-gray-950 whitespace-nowrap">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                        <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-10 w-10 hover:bg-white font-bold text-gray-700">
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={item.stock}
                          value={quantityInputs[item.id] ?? String(item.quantity)}
                          onChange={(e) => setQuantityInputs((prev) => ({ ...prev, [item.id]: e.target.value }))}
                          onBlur={() => void applyQuantityInput(item)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void applyQuantityInput(item);
                            }
                          }}
                          className="h-10 w-14 text-center bg-white border-x border-gray-200 font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-10 w-10 hover:bg-white font-bold text-gray-700">
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="h-10 w-10 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 grid place-items-center"
                        aria-label="Xóa sản phẩm"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-950">Thông tin giao hàng</h2>
                <p className="text-sm text-gray-500 mt-1">Điền địa chỉ nhận sách và chọn cách thanh toán.</p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700 flex items-center">
                    <MapPin className="h-4 w-4 mr-1 text-indigo-600" /> Địa chỉ giao hàng
                  </label>
                  <input
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="Số nhà, tên đường..."
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                  />
                  <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${hasAddressDirectory ? "" : "hidden"}`}>
                    <select
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      value={province}
                      onChange={(e) => {
                        setProvince(e.target.value);
                        setDistrict("");
                        setWard("");
                      }}
                    >
                      <option value="">Chọn Tỉnh/Thành</option>
                      {provinces.map((p) => (
                        <option key={p.code} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                    <select
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-gray-50 disabled:text-gray-400"
                      value={district}
                      onChange={(e) => {
                        setDistrict(e.target.value);
                        setWard("");
                      }}
                      disabled={!province}
                    >
                      <option value="">Chọn Quận/Huyện</option>
                      {districts.map((d) => (
                        <option key={d.code} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <select
                    className={`w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-gray-50 disabled:text-gray-400 ${hasAddressDirectory ? "" : "hidden"}`}
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    disabled={!district}
                  >
                    <option value="">Chọn Phường/Xã</option>
                    {wards.map((w) => (
                      <option key={w.code} value={w.name}>{w.name}</option>
                    ))}
                  </select>
                  {!hasAddressDirectory && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        placeholder="Tinh/Thanh"
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                      />
                      <input
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        placeholder="Quan/Huyen"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                      />
                      <input
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none sm:col-span-2"
                        placeholder="Phuong/Xa"
                        value={ward}
                        onChange={(e) => setWard(e.target.value)}
                      />
                    </div>
                  )}
                  {addressLoading && <p className="text-xs text-gray-500">Đang tải danh sách địa chỉ toàn quốc...</p>}

                  <div className="space-y-3 pt-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center">
                      <Phone className="h-4 w-4 mr-1 text-indigo-600" /> Số điện thoại
                    </label>
                    <input
                      type="tel"
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      placeholder="Nhập số điện thoại liên hệ..."
                      value={phone}
                      inputMode="numeric"
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData("text") || "";
                        setPhone(pasted.replace(/\D/g, ""));
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700 flex items-center">
                    <QrCode className="h-4 w-4 mr-1 text-indigo-600" /> Phương thức thanh toán
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
                    {paymentOptions.map((option) => {
                      const Icon = option.icon;
                      const selected = paymentMethod === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setPaymentMethod(option.value)}
                          className={`w-full min-h-[86px] text-left p-3 border rounded-xl transition-all flex gap-3 ${
                            selected ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100" : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${selected ? "text-indigo-600" : "text-gray-500"}`} />
                          <span>
                            <span className="block font-bold text-sm text-gray-950">{option.label}</span>
                            <span className="block text-xs text-gray-500 mt-1 leading-5">{option.description}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-sm text-gray-600 space-y-1">
                    {paymentGuide[paymentMethod].map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                    {paymentMethod === "qr_code" && (
                      <div className="mt-3 mx-auto h-28 w-28 rounded-xl border border-gray-200 bg-white grid place-items-center">
                        <QrCode className="h-16 w-16 text-gray-700" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
              <h3 className="text-xl font-bold text-gray-950 flex items-center">
                <ShieldCheck className="h-5 w-5 mr-2 text-indigo-600" /> Tổng quan đơn hàng
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center"><Truck className="h-4 w-4 mr-1" /> Phí vận chuyển</span>
                  <span className="text-emerald-600 font-semibold">Miễn phí</span>
                </div>
                <div className="pt-4 border-t flex justify-between text-xl font-bold text-gray-950">
                  <span>Tổng cộng</span>
                  <span className="text-indigo-600">{formatCurrency(total)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOrder}
                disabled={ordering}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center disabled:opacity-50"
              >
                {ordering ? "Đang xử lý..." : <><ShoppingBag className="mr-2 h-5 w-5" /> Đặt hàng ngay <ArrowRight className="ml-2 h-5 w-5" /></>}
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default Cart;
