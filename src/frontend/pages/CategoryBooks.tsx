import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { bookService, cartService } from "../services/api.ts";
import { ShoppingCart } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext.tsx";

const CategoryBooks = () => {
  const { categoryName = "" } = useParams();
  const decodedCategory = decodeURIComponent(categoryName);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    bookService
      .getAll(`?limit=60&category=${encodeURIComponent(decodedCategory)}&sort=bestseller`)
      .then((data) => setBooks(data.books || []))
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  }, [decodedCategory]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{decodedCategory}</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {[...Array(12)].map((_, i) => <div key={i} className="animate-pulse h-64 bg-gray-200 rounded-xl" />)}
        </div>
      ) : books.length === 0 ? (
        <div className="bg-white border rounded-2xl p-10 text-center text-gray-500">Chưa có sách trong thể loại này.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {books.map((book, index) => (
            <motion.div key={book.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="group">
              <Link to={`/book/${book.id}`} className="block space-y-3">
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
                  <img src={book.image_url} alt={book.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">{book.title}</h3>
                  <p className="text-sm text-gray-500">{book.author}</p>
                  <p className="font-bold text-indigo-700">{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(book.price)}</p>
                </div>
              </Link>
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  if (!user) return navigate("/login");
                  await cartService.add(book.id, 1);
                  navigate("/cart");
                }}
                className="mt-2 w-full bg-indigo-50 text-indigo-700 py-2 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-1"
              >
                <ShoppingCart size={14} /> Mua ngay
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryBooks;
