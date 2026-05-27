import React, { useEffect, useState } from "react";
import { bookService, orderService } from "../services/api.ts";
import { useAuth } from "../context/AuthContext.tsx";
import { Plus, Edit2, Trash2, Package, Book as BookIcon, LayoutDashboard, Check, X, ChevronRight, TrendingUp, Users, ShoppingBag, DollarSign } from "lucide-react";
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
    { title: "Tổng doanh thu", value: formatCurrency(data?.stats?.totalRevenue || 0), note: "Chỉ tính đơn đã giao", icon: <DollarSign className="text-emerald-600" />, bg: "bg-emerald-50" },
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
    title: "", author: "", description: "", price: "", category_id: 1, stock: "", image_url: ""
  });

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
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock),
      };

      if (editingBook) {
        await bookService.update(editingBook.id, payload);
      } else {
        await bookService.create(payload);
      }
      setIsModalOpen(false);
      fetchBooks();
    } catch (err) {
      console.error("Lỗi lưu thông tin:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await bookService.delete(id);
      fetchBooks();
    } catch (err) {
      console.error("Lỗi xóa sách:", err);
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
      setFormData({ title: "", author: "", description: "", price: "", category_id: 1, stock: "", image_url: "" });
    }
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
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="Tìm theo tên sách hoặc tác giả..."
          className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
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
                <input required className="w-full p-2 border rounded-lg" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Tác giả</label>
                <input required className="w-full p-2 border rounded-lg" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Thể loại</label>
                <select className="w-full p-2 border rounded-lg" value={formData.category_id} onChange={e => setFormData({...formData, category_id: Number(e.target.value)})}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Giá (VND)</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full p-2 border rounded-lg"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Số lượng trong kho</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full p-2 border rounded-lg"
                  value={formData.stock}
                  onChange={e => setFormData({...formData, stock: e.target.value})}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold">URL Hình ảnh</label>
                <input className="w-full p-2 border rounded-lg" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold">Mô tả</label>
                <textarea className="w-full p-2 border rounded-lg h-32" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
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
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h2>
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">Mã ĐH</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">Khách hàng</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">SĐT</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">Tổng tiền</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">Trạng thái</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-900">#ORD-{order.id}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{order.user_email}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{order.phone || "-"}</td>
                <td className="px-6 py-4 text-sm font-bold text-indigo-600">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_price)}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                  <Link to={`/orders/${order.id}`} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                    <ChevronRight size={18} />
                  </Link>
                  <select 
                    className="text-sm border rounded p-1"
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                  >
                    <option value="pending">Chờ xử lý</option>
                    <option value="processing">Đang xử lý</option>
                    <option value="shipped">Đang giao</option>
                    <option value="delivered">Đã giao</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [name, setName] = useState("");

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
    try {
      if (editingCategory) {
        await bookService.updateCategory(editingCategory.id, { name });
      } else {
        await bookService.createCategory({ name });
      }
      setIsModalOpen(false);
      setName("");
      fetchCategories();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa thể loại này?")) {
      try {
        await bookService.deleteCategory(id);
        fetchCategories();
      } catch (err: any) {
        alert(err.message);
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
                <input required className="w-full p-2 border rounded-lg" value={name} onChange={e => setName(e.target.value)} />
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

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      navigate("/");
    }
  }, [user, navigate]);

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
      </aside>
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<AdminOverview />} />
          <Route path="/books" element={<AdminBooks />} />
          <Route path="/orders" element={<AdminOrders />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminDashboard;
