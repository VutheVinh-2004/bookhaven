import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { bookService, cartService } from "../services/api.ts";
import { useAuth } from "../context/AuthContext.tsx";
import { useToast } from "../context/ToastContext.tsx";
import { ShoppingCart, ArrowLeft, Check, AlertCircle } from "lucide-react";

const BookDetail = () => {
  const { id } = useParams();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState("1");
  const [adding, setAdding] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      bookService.getById(id)
        .then(setBook)
        .finally(() => setLoading(false));
    }
  }, [id]);

  useEffect(() => {
    setQuantityInput(String(quantity));
  }, [quantity]);

  const applyQuantityInput = () => {
    const parsed = parseInt(quantityInput, 10);
    if (isNaN(parsed)) {
      setQuantity(1);
      setQuantityInput("1");
      return;
    }
    const safe = Math.max(1, Math.min(book?.stock || 1, parsed));
    setQuantity(safe);
    setQuantityInput(String(safe));
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setAdding(true);
    try {
      await cartService.add(book.id, quantity);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      showToast(err.message || "Không thể thêm sách vào giỏ hàng.", "error");
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  if (!book) return <div className="text-center py-20">Không tìm thấy sách</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-indigo-600 mb-8 transition-colors">
        <ArrowLeft className="mr-2 h-5 w-5" /> Quay lại
      </button>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-gray-100">
        <div className="md:w-2/5 bg-gray-50 p-8 flex justify-center items-center">
          <img
            src={book.image_url}
            alt={book.title}
            className="rounded-xl shadow-2xl max-h-[500px] object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="md:w-3/5 p-8 md:p-12 space-y-6">
          <div className="space-y-2">
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
              {book.category_name}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">{book.title}</h1>
            <p className="text-xl text-gray-500 font-medium">Tác giả: <span className="text-gray-900">{book.author}</span></p>
          </div>

          <div className="text-3xl font-bold text-indigo-600">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(book.price)}
          </div>

          <div className="pt-6 border-t border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Mô tả nội dung</h3>
            <p className="text-gray-600 leading-relaxed text-lg">{book.description}</p>
          </div>

          <div className="pt-6 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center border rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-4 py-2 hover:bg-gray-100 transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={book.stock}
                  value={quantityInput}
                  onChange={(e) => {
                    setQuantityInput(e.target.value);
                  }}
                  onFocus={(e) => e.currentTarget.select()}
                  onBlur={applyQuantityInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyQuantityInput();
                    }
                  }}
                  className="w-16 py-2 font-bold text-center border-x focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  onClick={() => setQuantity(q => Math.min(book.stock, q + 1))}
                  className="px-4 py-2 hover:bg-gray-100 transition-colors"
                >
                  +
                </button>
              </div>
              <span className="text-sm text-gray-500">Còn lại: {book.stock} cuốn</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleAddToCart}
                disabled={adding || book.stock === 0}
                className={`flex-1 flex items-center justify-center py-4 rounded-2xl font-bold text-lg transition-all ${
                  success 
                    ? "bg-green-500 text-white" 
                    : "bg-white text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-50"
                } disabled:opacity-50`}
              >
                {success ? (
                  <><Check className="mr-2" /> Đã thêm</>
                ) : adding ? (
                  "Đang xử lý..."
                ) : book.stock === 0 ? (
                  "Hết hàng"
                ) : (
                  <><ShoppingCart className="mr-2" /> Thêm vào giỏ</>
                )}
              </button>

              <button
                onClick={async () => {
                  if (!user) { navigate("/login"); return; }
                  try {
                    await cartService.add(book.id, quantity);
                    navigate("/cart");
                  } catch (err: any) {
                    showToast(err.message || "Không thể thêm sách vào giỏ hàng.", "error");
                  }
                }}
                disabled={adding || book.stock === 0}
                className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
              >
                Mua ngay
              </button>
            </div>
            
            {!user && (
              <p className="text-center text-sm text-gray-500 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 mr-1" /> Đăng nhập để mua hàng
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetail;
