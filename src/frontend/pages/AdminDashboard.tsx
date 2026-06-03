import React, { useEffect, useState } from "react";
import { bookService, orderService, userService } from "../services/api.ts";
import { useAuth } from "../context/AuthContext.tsx";
import { useToast } from "../context/ToastContext.tsx";
import { Plus, Edit2, Trash2, Package, Book as BookIcon, LayoutDashboard, Check, X, ChevronRight, TrendingUp, Users, ShoppingBag, DollarSign, Clock, MapPin, Phone, RefreshCw, Shield, UserPlus } from "lucide-react";
import { useNavigate, Routes, Route, Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

const AdminOverview = () => {
  const [period, setPeriod] = useState<"7d" | "30d" | "12m">("7d");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    orderService.getStats(period)
      .then(setData)
      .finally(() => setLoading(false));
  }, [period]);

  const formatCurrency = (value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);
  const formatCompact = (value: number) => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return `${value || 0}`;
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === "pending" || status === "processing") return "bg-yellow-100 text-yellow-700";
    if (status === "shipped") return "bg-blue-100 text-blue-700";
    if (status === "delivered") return "bg-green-100 text-green-700";
    if (status === "cancelled") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  const getStatusText = (status: string) => {
    if (status === "pending") return "Pending";
    if (status === "processing") return "Processing";
    if (status === "shipped") return "Shipping";
    if (status === "delivered") return "Delivered";
    if (status === "cancelled") return "Cancelled";
    return status;
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  const totalCategoryItems = (data?.categoryDistribution || []).reduce((sum: number, item: any) => sum + Number(item.count || 0), 0);
  const statCards = [
    { title: "Tổng doanh thu", value: formatCurrency(data?.stats?.totalRevenue || 0), note: "Chỉ tính đơn đã thanh toán", icon: <DollarSign className="text-emerald-600" />, bg: "bg-emerald-50" },
    { title: "Người dùng", value: `${data?.stats?.totalUsers || 0}`, note: "Tài khoản khách hàng", icon: <Users className="text-amber-600" />, bg: "bg-amber-50" },
    { title: "Tổng đầu sách", value: `${data?.stats?.totalBooks || 0}`, note: "Sản phẩm trong kho", icon: <BookIcon className="text-indigo-600" />, bg: "bg-indigo-50" },
    { title: "Đơn chờ xử lý", value: `${data?.stats?.pendingOrders || 0}`, note: "Đơn pending + processing", icon: <ShoppingBag className="text-orange-600" />, bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tổng quan vận hành BookHaven</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.bg}`}>{card.icon}</div>
            </div>
            <p className="text-sm text-gray-500 font-medium">{card.title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
            <p className="text-xs text-gray-400 mt-2">{card.note}</p>
          </div>
        ))}
      </div>

      

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Sách bán chạy</h3>
          <div className="space-y-3">
            {(data?.topSellingBooks || []).map((book: any, idx: number) => (
              <div key={book.id} className="flex items-start justify-between p-3 rounded-xl bg-gray-50">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">#{idx + 1} {book.title}</p>
                  <p className="text-xs text-gray-500 truncate">{book.author}</p>
                </div>
                <p className="text-sm font-bold text-indigo-600 whitespace-nowrap">{book.sold_quantity} đã bán</p>
              </div>
            ))}
            {(!data?.topSellingBooks || data.topSellingBooks.length === 0) && <p className="text-sm text-gray-500">Chưa có dữ liệu bán hàng đã giao.</p>}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Sách sắp hết hàng</h3>
          <div className="space-y-3">
            {(data?.lowStockBooks || []).map((book: any) => (
              <div key={book.id} className="flex items-start justify-between p-3 rounded-xl bg-red-50">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{book.title}</p>
                  <p className="text-xs text-gray-500 truncate">{book.author}</p>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-700">Còn {book.stock}</span>
              </div>
            ))}
            {(!data?.lowStockBooks || data.lowStockBooks.length === 0) && <p className="text-sm text-gray-500">Không có cảnh báo tồn kho thấp.</p>}
          </div>
        </div>

      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Đơn hàng gần đây</h3>
          <Link to="/admin/orders" className="text-indigo-600 text-sm font-semibold hover:underline">Xem tất cả</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">Mã đơn</th>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">Khách hàng</th>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">Ngày đặt</th>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">Tổng tiền</th>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {(data?.recentOrders || []).map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-indigo-600">#ORD-{order.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 font-medium">{order.user_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString("vi-VN")}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(order.total_price)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(order.status)}`}>{getStatusText(order.status)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminBooks = () => {
  const { showToast } = useToast();
  const [books, setBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [inputPage, setInputPage] = useState("1");
  const [formData, setFormData] = useState({
    title: "", author: "", description: "", price: "", category_id: 0, stock: "", image_url: ""
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fetchBooks = () => {
    setLoading(true);
    const normalizedKeyword = searchKeyword.trim();
    const query = normalizedKeyword
      ? `?page=${page}&limit=25&search=${encodeURIComponent(normalizedKeyword)}`
      : `?page=${page}&limit=25`;

    bookService.getAll(query)
      .then(data => {
        setBooks(data.books);
        setTotalPages(data.totalPages);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBooks();
  }, [page, searchKeyword]);

  useEffect(() => {
    setPage(1);
  }, [searchKeyword]);

  useEffect(() => {
    bookService.getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    setInputPage(page.toString());
  }, [page]);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPage(e.target.value);
  };

  const handlePageInputBlur = () => {
    const newPage = parseInt(inputPage);
    if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    } else {
      setInputPage(page.toString());
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handlePageInputBlur();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const title = formData.title.trim();
    const author = formData.author.trim();
    const description = formData.description.trim();
    const price = Number(formData.price);
    const stock = Number(formData.stock);

    if (!title || title.length > 200) errors.title = "Tiêu đề phải từ 1 đến 200 ký tự.";
    if (!author || author.length > 150) errors.author = "Tác giả phải từ 1 đến 150 ký tự.";
    if (description.length > 5000) errors.description = "Mô tả sách tối đa 5000 ký tự.";
    if (formData.price.trim() === "" || !Number.isFinite(price) || price <= 0) errors.price = "Giá sách phải lớn hơn 0.";
    if (formData.stock.trim() === "" || !Number.isInteger(stock) || stock < 0) errors.stock = "Tồn kho phải là số nguyên không âm.";
    if (!Number.isInteger(formData.category_id) || formData.category_id <= 0) errors.category_id = "Vui lòng chọn danh mục.";
    if (formData.image_url.trim()) {
      try {
        const imageUrl = new URL(formData.image_url.trim());
        if (!["http:", "https:"].includes(imageUrl.protocol)) errors.image_url = "URL ảnh phải sử dụng HTTP hoặc HTTPS.";
      } catch {
        errors.image_url = "URL ảnh không hợp lệ.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showToast("Vui lòng kiểm tra lại thông tin sách.", "error");
      return;
    }

    setFieldErrors({});
    try {
      const payload = {
        ...formData,
        title,
        author,
        description,
        price,
        stock,
      };

      if (editingBook) {
        await bookService.update(editingBook.id, payload);
      } else {
        await bookService.create(payload);
      }
      setIsModalOpen(false);
      fetchBooks();
    } catch (err: any) {
      if (err?.errors && typeof err.errors === "object") setFieldErrors(err.errors);
      showToast(err.message || "Không thể lưu thông tin sách.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await bookService.delete(id);
      fetchBooks();
    } catch (err: any) {
      showToast(err.message || "Không thể xóa sách.", "error");
    }
  };

  const openModal = (book: any = null) => {
    if (book) {
      setEditingBook(book);
      setFormData({
        title: book.title,
        author: book.author,
        description: book.description,
        price: String(book.price ?? ""),
        category_id: book.category_id,
        stock: String(book.stock ?? ""),
        image_url: book.image_url
      });
    } else {
      setEditingBook(null);
      setFormData({ title: "", author: "", description: "", price: "", category_id: categories[0]?.id ?? 0, stock: "", image_url: "" });
    }
    setFieldErrors({});
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý kho sách</h2>
        <button onClick={() => openModal()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center font-bold hover:bg-indigo-700">
          <Plus className="mr-2 h-5 w-5" /> Thêm sách mới
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-4">
        <input
          type="text"
          value={searchKeyword}
          maxLength={100}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="Tìm theo tên sách hoặc tác giả..."
          className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">Sách</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">Thể loại</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">Giá</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">Kho</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Đang tải...</td>
              </tr>
            ) : books.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  {searchKeyword.trim() ? "Không tìm thấy sách phù hợp" : "Không có sách nào"}
                </td>
              </tr>
            ) : (
              books.map(book => (
                <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={book.image_url} className="w-10 h-14 object-cover rounded" referrerPolicy="no-referrer" />
                      <div>
                        <div className="font-bold text-gray-900">{book.title}</div>
                        <div className="text-xs text-gray-500">{book.author}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{book.category_name}</td>
                  <td className="px-6 py-4 text-sm font-bold text-indigo-600">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(book.price)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{book.stock}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => openModal(book)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(book.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="rotate-180" />
          </button>
          <div className="flex items-center space-x-2 font-medium">
            <span>Trang</span>
            <input
              type="text"
              value={inputPage}
              onChange={handlePageInputChange}
              onBlur={handlePageInputBlur}
              onKeyDown={handlePageInputKeyDown}
              className="w-12 h-9 text-center border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <span className="text-gray-500">/ {totalPages}</span>
          </div>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight />
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">{editingBook ? "Cập nhật sách" : "Thêm sách mới"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold">Tiêu đề</label>
                <input required maxLength={200} className="w-full p-2 border rounded-lg" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                {fieldErrors.title && <p className="text-xs font-medium text-red-600">{fieldErrors.title}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Tác giả</label>
                <input required maxLength={150} className="w-full p-2 border rounded-lg" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} />
                {fieldErrors.author && <p className="text-xs font-medium text-red-600">{fieldErrors.author}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Thể loại</label>
                <select className="w-full p-2 border rounded-lg" value={formData.category_id} onChange={e => setFormData({...formData, category_id: Number(e.target.value)})}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {fieldErrors.category_id && <p className="text-xs font-medium text-red-600">{fieldErrors.category_id}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Giá (VND)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  className="w-full p-2 border rounded-lg"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                />
                {fieldErrors.price && <p className="text-xs font-medium text-red-600">{fieldErrors.price}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Số lượng trong kho</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  className="w-full p-2 border rounded-lg"
                  value={formData.stock}
                  onChange={e => setFormData({...formData, stock: e.target.value})}
                />
                {fieldErrors.stock && <p className="text-xs font-medium text-red-600">{fieldErrors.stock}</p>}
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold">URL Hình ảnh</label>
                <input maxLength={2048} className="w-full p-2 border rounded-lg" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
                {fieldErrors.image_url && <p className="text-xs font-medium text-red-600">{fieldErrors.image_url}</p>}
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold">Mô tả</label>
                <textarea maxLength={5000} className="w-full p-2 border rounded-lg h-32" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                {fieldErrors.description && <p className="text-xs font-medium text-red-600">{fieldErrors.description}</p>}
              </div>
              <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 border rounded-lg font-bold">Hủy</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminOrders = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    setLoading(true);
    orderService.getAllAdmin()
      .then(setOrders)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await orderService.updateStatus(id, status);
      fetchOrders();
    } catch (err: any) {
      showToast(err.message || "Không thể cập nhật trạng thái đơn hàng.", "error");
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);
  const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString("vi-VN") : "-";

  const getOrderStatus = (status?: string) => {
    switch (status) {
      case "pending":
        return { label: "Chờ xử lý", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" };
      case "processing":
        return { label: "Đang xử lý", className: "bg-sky-50 text-sky-700 ring-1 ring-sky-200" };
      case "shipped":
        return { label: "Đang giao", className: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200" };
      case "delivered":
        return { label: "Đã giao", className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" };
      case "cancelled":
        return { label: "Đã hủy", className: "bg-red-50 text-red-700 ring-1 ring-red-200" };
      default:
        return { label: status || "Không rõ", className: "bg-gray-50 text-gray-700 ring-1 ring-gray-200" };
    }
  };

  const getPaymentStatus = (status?: string) => {
    switch (status) {
      case "paid":
        return { label: "Đã thanh toán", className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" };
      case "pending":
        return { label: "Chờ thanh toán", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" };
      case "cancelled":
        return { label: "Đã hủy thanh toán", className: "bg-red-50 text-red-700 ring-1 ring-red-200" };
      case "unpaid":
      default:
        return { label: "Chưa thanh toán", className: "bg-gray-50 text-gray-700 ring-1 ring-gray-200" };
    }
  };

  const getPaymentMethodText = (method?: string) => {
    switch (method) {
      case "card":
        return "Thẻ";
      case "qr_code":
        return "Không còn hỗ trợ";
      case "cod":
      default:
        return "COD";
    }
  };

  const getAllowedNextStatuses = (order: any) => {
    const transitions: Record<string, string[]> = {
      pending: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: [],
      cancelled: []
    };

    return (transitions[order.status] || []).filter(status => {
      if (status === "cancelled" && order.payment_status === "paid") return false;
      if ((status === "shipped" || status === "delivered") && order.payment_method !== "cod" && order.payment_status !== "paid") return false;
      return true;
    });
  };

  const summary = {
    total: orders.length,
    pending: orders.filter(order => order.status === "pending" || order.status === "processing").length,
    delivering: orders.filter(order => order.status === "shipped").length,
    revenue: orders
      .filter(order => order.payment_status === "paid")
      .reduce((sum, order) => sum + Number(order.total_price || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-950">Quản lý đơn hàng</h2>
          <p className="text-sm text-gray-500 mt-1">Theo dõi xử lý, giao hàng và thanh toán của toàn bộ đơn.</p>
        </div>
        <button
          type="button"
          onClick={fetchOrders}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" /> Làm mới
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600"><Package className="h-5 w-5" /></div>
            <span className="text-xs font-bold text-gray-400 uppercase">Tổng</span>
          </div>
          <p className="mt-4 text-sm font-medium text-gray-500">Tổng đơn hàng</p>
          <p className="mt-1 text-2xl font-bold text-gray-950">{summary.total}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600"><Clock className="h-5 w-5" /></div>
            <span className="text-xs font-bold text-gray-400 uppercase">Chờ</span>
          </div>
          <p className="mt-4 text-sm font-medium text-gray-500">Cần xử lý</p>
          <p className="mt-1 text-2xl font-bold text-gray-950">{summary.pending}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-sky-50 p-3 text-sky-600"><ShoppingBag className="h-5 w-5" /></div>
            <span className="text-xs font-bold text-gray-400 uppercase">Giao</span>
          </div>
          <p className="mt-4 text-sm font-medium text-gray-500">Đang giao</p>
          <p className="mt-1 text-2xl font-bold text-gray-950">{summary.delivering}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600"><DollarSign className="h-5 w-5" /></div>
            <span className="text-xs font-bold text-gray-400 uppercase">Thu</span>
          </div>
          <p className="mt-4 text-sm font-medium text-gray-500">Doanh thu đã thanh toán</p>
          <p className="mt-1 text-xl font-bold text-gray-950">{formatCurrency(summary.revenue)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="font-bold text-gray-950">Danh sách đơn hàng</h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-indigo-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 font-semibold text-gray-700">Chưa có đơn hàng</p>
            <p className="mt-1 text-sm text-gray-500">Khi khách đặt hàng, đơn sẽ hiển thị ở đây.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left border-collapse">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-500">Đơn hàng</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-500">Khách hàng</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-500">Liên hệ</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-500">Thanh toán</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-500">Trạng thái</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-500">Cập nhật</th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(order => {
                  const paymentStatus = getPaymentStatus(order.payment_status);
                  const orderStatus = getOrderStatus(order.status);
                  const allowedNextStatuses = getAllowedNextStatuses(order);

                  return (
                    <tr key={order.id} className="align-top hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-gray-950">#ORD-{order.id}</div>
                        <div className="mt-1 text-xs text-gray-500">{formatDate(order.created_at)}</div>
                        <div className="mt-2 font-bold text-indigo-600">{formatCurrency(order.total_price)}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="max-w-[220px] truncate font-semibold text-gray-900">{order.user_name || order.user_email}</div>
                        <div className="mt-1 max-w-[220px] truncate text-xs text-gray-500">{order.user_email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{order.phone || "-"}</span>
                        </div>
                        <div className="mt-2 flex items-start gap-2 text-xs text-gray-500">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                          <span className="line-clamp-2 max-w-[260px]">{order.shipping_address || "-"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${paymentStatus.className}`}>
                          {paymentStatus.label}
                        </span>
                        <div className="mt-2 text-xs font-medium text-gray-500">{getPaymentMethodText(order.payment_method)}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${orderStatus.className}`}>
                          {orderStatus.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          className="w-40 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50 disabled:text-gray-400"
                          value={order.status}
                          disabled={allowedNextStatuses.length === 0}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        >
                          <option value={order.status}>{orderStatus.label}</option>
                          {allowedNextStatuses.includes("processing") && <option value="processing">Đang xử lý</option>}
                          {allowedNextStatuses.includes("shipped") && <option value="shipped">Đang giao</option>}
                          {allowedNextStatuses.includes("delivered") && <option value="delivered">Đã giao</option>}
                          {allowedNextStatuses.includes("cancelled") && <option value="cancelled">Đã hủy</option>}
                        </select>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/orders/${order.id}`}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-100 text-indigo-600 hover:bg-indigo-50"
                          aria-label={`Xem chi tiết đơn #ORD-${order.id}`}
                        >
                          <ChevronRight size={18} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminCategories = () => {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");

  const fetchCategories = () => {
    setLoading(true);
    bookService.getCategories()
      .then(setCategories)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedName = name.trim();
    if (normalizedName.length < 2 || normalizedName.length > 100) {
      setNameError("Tên thể loại phải từ 2 đến 100 ký tự.");
      return;
    }

    setNameError("");
    try {
      if (editingCategory) {
        await bookService.updateCategory(editingCategory.id, { name: normalizedName });
      } else {
        await bookService.createCategory({ name: normalizedName });
      }
      setIsModalOpen(false);
      setName("");
      fetchCategories();
    } catch (err: any) {
      setNameError(err.message || "Không thể lưu danh mục.");
      showToast(err.message || "Không thể lưu danh mục.", "error");
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa thể loại này?")) {
      try {
        await bookService.deleteCategory(id);
        fetchCategories();
      } catch (err: any) {
        showToast(err.message || "Không thể xóa danh mục.", "error");
      }
    }
  };

  const openModal = (cat: any = null) => {
    if (cat) {
      setEditingCategory(cat);
      setName(cat.name);
    } else {
      setEditingCategory(null);
      setName("");
    }
    setNameError("");
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý thể loại</h2>
        <button onClick={() => openModal()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center font-bold hover:bg-indigo-700">
          <Plus className="mr-2 h-5 w-5" /> Thêm thể loại
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">ID</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">Tên thể loại</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map(cat => (
              <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-600">{cat.id}</td>
                <td className="px-6 py-4 font-bold text-gray-900">{cat.name}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openModal(cat)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">{editingCategory ? "Cập nhật thể loại" : "Thêm thể loại mới"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">Tên thể loại</label>
                <input required maxLength={100} className="w-full p-2 border rounded-lg" value={name} onChange={e => setName(e.target.value)} />
                {nameError && <p className="text-xs font-medium text-red-600">{nameError}</p>}
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 border rounded-lg font-bold">Hủy</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [accountStatus, setAccountStatus] = useState<"active" | "inactive">("active");
  const [showOnlyAdmins, setShowOnlyAdmins] = useState(false);
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const fetchUsers = () => {
    setLoading(true);
    userService.getAll(accountStatus)
      .then(setUsers)
      .catch((err: any) => showToast(err.message || "Không thể tải danh sách người dùng.", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [accountStatus]);

  const filteredUsers = users.filter((user) => {
    if (showOnlyAdmins && user.role !== "admin") return false;
    const keyword = searchTerm.trim().toLowerCase();
    return !keyword || user.full_name?.toLowerCase().includes(keyword) || user.email?.toLowerCase().includes(keyword);
  });

  const handleRoleUpdate = async (id: number, role: string) => {
    try {
      await userService.updateRole(id, role);
      showToast("Đã cập nhật quyền người dùng.", "success");
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || "Không thể cập nhật quyền người dùng.", "error");
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!window.confirm("Vô hiệu hóa tài khoản này? Lịch sử đơn hàng vẫn được giữ lại.")) return;
    try {
      await userService.delete(id);
      showToast("Đã vô hiệu hóa tài khoản.", "success");
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || "Không thể vô hiệu hóa tài khoản.", "error");
    }
  };

  const handleReactivate = async (id: number) => {
    try {
      await userService.reactivate(id);
      showToast("Đã khôi phục tài khoản.", "success");
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || "Không thể khôi phục tài khoản.", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h2>
        <p className="mt-1 text-sm text-gray-500">Quản lý quyền và trạng thái tài khoản trong hệ thống.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
          <div className="rounded-lg bg-amber-50 p-3 text-amber-600"><Users size={24} /></div>
          <div><p className="text-sm text-gray-500">Tài khoản đang hiển thị</p><p className="text-2xl font-bold text-gray-900">{users.length}</p></div>
        </div>
        <div className="flex items-center gap-4 rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
          <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600"><Shield size={24} /></div>
          <div><p className="text-sm text-gray-500">Quản trị viên</p><p className="text-2xl font-bold text-gray-900">{users.filter((user) => user.role === "admin").length}</p></div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 bg-gray-50 p-4 lg:flex-row lg:items-center lg:justify-between">
          <input type="search" maxLength={100} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm theo tên hoặc email..." className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 lg:max-w-xs" />
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-gray-200 bg-white p-1">
              <button type="button" onClick={() => setAccountStatus("active")} className={`rounded-md px-3 py-1.5 text-sm font-semibold ${accountStatus === "active" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>Đang hoạt động</button>
              <button type="button" onClick={() => setAccountStatus("inactive")} className={`rounded-md px-3 py-1.5 text-sm font-semibold ${accountStatus === "inactive" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>Đã vô hiệu hóa</button>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={showOnlyAdmins} onChange={(e) => setShowOnlyAdmins(e.target.checked)} className="h-4 w-4 rounded text-indigo-600" />
              Chỉ hiện Admin
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-500">Người dùng</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-500">Email</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-500">Vai trò</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-500">Ngày tham gia</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 font-semibold text-gray-900">{user.full_name || "Chưa cập nhật"}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-5 py-4">
                    <select value={user.role} onChange={(e) => handleRoleUpdate(user.id, e.target.value)} disabled={user.id === currentUser?.id || accountStatus === "inactive"} className={`rounded-full border-0 px-3 py-1 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 ${user.role === "admin" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-700"}`}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString("vi-VN")}</td>
                  <td className="px-5 py-4 text-right">
                    {accountStatus === "active" ? (
                      <button type="button" onClick={() => handleDeactivate(user.id)} disabled={user.id === currentUser?.id} className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-20" aria-label="Vô hiệu hóa tài khoản" title="Vô hiệu hóa tài khoản"><Trash2 size={18} /></button>
                    ) : (
                      <button type="button" onClick={() => handleReactivate(user.id)} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50" aria-label="Khôi phục tài khoản" title="Khôi phục tài khoản"><UserPlus size={18} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && filteredUsers.length === 0 && <p className="p-8 text-center text-sm text-gray-500">Không tìm thấy tài khoản phù hợp.</p>}
        {loading && <p className="p-8 text-center text-sm text-gray-500">Đang tải danh sách người dùng...</p>}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      navigate("/");
    }
  }, [loading, user, navigate]);

  if (loading || !user || user.role !== "admin") {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <aside className="w-full md:w-64 space-y-2">
        <Link to="/admin" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-indigo-50 text-gray-700 font-medium">
          <LayoutDashboard size={20} /> <span>Tổng quan</span>
        </Link>
        <Link to="/admin/books" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-indigo-50 text-gray-700 font-medium">
          <BookIcon size={20} /> <span>Quản lý sách</span>
        </Link>
        <Link to="/admin/orders" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-indigo-50 text-gray-700 font-medium">
          <Package size={20} /> <span>Quản lý đơn hàng</span>
        </Link>
        <Link to="/admin/users" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-indigo-50 text-gray-700 font-medium">
          <Users size={20} /> <span>Quản lý người dùng</span>
        </Link>
      </aside>
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<AdminOverview />} />
          <Route path="/books" element={<AdminBooks />} />
          <Route path="/orders" element={<AdminOrders />} />
          <Route path="/users" element={<AdminUsers />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminDashboard;
