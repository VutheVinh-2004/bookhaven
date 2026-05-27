import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, LogOut, Search, Menu, X } from "lucide-react";
import { AuthProvider, useAuth } from "./frontend/context/AuthContext.tsx";
import Home from "./frontend/pages/Home.tsx";
import Login from "./frontend/pages/Login.tsx";
import Register from "./frontend/pages/Register.tsx";
import VerifyEmail from "./frontend/pages/VerifyEmail.tsx";
import BookDetail from "./frontend/pages/BookDetail.tsx";
import Cart from "./frontend/pages/Cart.tsx";
import MyOrders from "./frontend/pages/MyOrders.tsx";
import OrderDetail from "./frontend/pages/OrderDetail.tsx";
import PaymentTest from "./frontend/pages/PaymentTest.tsx";
import AdminDashboard from "./frontend/pages/AdminDashboard.tsx";
import SuperAdminDashboard from "./frontend/pages/SuperAdminDashboard.tsx";
import Profile from "./frontend/pages/Profile.tsx";
import CategoryBooks from "./frontend/pages/CategoryBooks.tsx";
import SearchResults from "./frontend/pages/SearchResults.tsx";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [searchText, setSearchText] = React.useState("");

  const handleNavbarSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const keyword = searchText.trim();
    if (keyword) {
      navigate(`/search?search=${encodeURIComponent(keyword)}`);
    } else {
      navigate("/search");
    }
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/book-haven-logo.svg" alt="Book Haven" className="h-8 w-8" />
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                BookHaven
              </span>
            </Link>
            <form onSubmit={handleNavbarSearch} className="hidden md:flex items-center relative w-[320px] lg:w-[380px]">
              <Search className="absolute left-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm sách..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </form>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                {(user.role === "admin" || user.role === "super_admin") && (
                  <Link to="/admin" className="text-indigo-600 font-bold hover:text-indigo-700">Admin</Link>
                )}
                {user.role === "super_admin" && (
                  <Link to="/superadmin" className="text-purple-600 font-bold hover:text-purple-700">Super Admin</Link>
                )}
                <Link to="/cart" className="text-gray-700 hover:text-indigo-600 relative">
                  <ShoppingCart className="h-6 w-6" />
                </Link>
                <div className="relative group">
                  <button className="flex items-center space-x-1 text-gray-700 hover:text-indigo-600 font-medium">
                    <User className="h-6 w-6" />
                    <span>{user.fullName}</span>
                  </button>
                  <div className="absolute right-0 w-48 mt-2 py-2 bg-white border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50">Thông tin cá nhân</Link>
                    <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50">Đơn hàng của tôi</Link>
                    {(user.role === "admin" || user.role === "super_admin") && (
                      <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 font-semibold text-indigo-600">Quản trị</Link>
                    )}
                    {user.role === "super_admin" && (
                      <Link to="/superadmin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 font-semibold text-purple-600">Siêu quản trị</Link>
                    )}
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                      <LogOut className="h-4 w-4 mr-2" /> Đăng xuất
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-700 hover:text-indigo-600 font-medium">Đăng nhập</Link>
                <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">Đăng ký</Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-700">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t px-4 py-4 space-y-4">
          <form onSubmit={handleNavbarSearch} className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm sách..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </form>
          {user ? (
            <>
              <Link to="/profile" className="block text-gray-700 font-medium">Thông tin cá nhân</Link>
              <Link to="/cart" className="block text-gray-700 font-medium">Giỏ hàng</Link>
              <Link to="/orders" className="block text-gray-700 font-medium">Đơn hàng của tôi</Link>
              {(user.role === "admin" || user.role === "super_admin") && (
                <Link to="/admin" className="block text-indigo-600 font-bold">Quản trị</Link>
              )}
              {user.role === "super_admin" && (
                <Link to="/superadmin" className="block text-purple-600 font-bold">Siêu quản trị</Link>
              )}
              <button onClick={handleLogout} className="block text-red-600 font-medium">Đăng xuất</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block text-gray-700 font-medium">Đăng nhập</Link>
              <Link to="/register" className="block text-indigo-600 font-medium">Đăng ký</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/book/:id" element={<BookDetail />} />
              <Route path="/category/:categoryName" element={<CategoryBooks />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/payment/:id" element={<PaymentTest />} />
              <Route path="/orders" element={<MyOrders />} />
              <Route path="/orders/:id" element={<OrderDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
              <Route path="/superadmin/*" element={<SuperAdminDashboard />} />
            </Routes>
          </main>
          <footer className="bg-gray-800 text-white py-8">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p>&copy; 2026 BookHaven. Hệ thống bán sách trực tuyến mô phỏng Spring Boot/Angular.</p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}
