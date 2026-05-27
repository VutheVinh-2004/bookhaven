import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { bookService, cartService } from "../services/api.ts";
import { ShoppingCart } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext.tsx";

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const navigate = useNavigate();
  const { user } = useAuth();

  const keyword = (searchParams.get("search") || "").trim();
  const currentPage = Math.max(Number(searchParams.get("page") || 1), 1);
  const PAGE_SIZE = 24;

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    query.set("page", String(currentPage));
    query.set("limit", String(PAGE_SIZE));
    if (keyword) query.set("search", keyword);

    bookService
      .getAll(`?${query.toString()}`)
      .then((data) => {
        setBooks(data.books || []);
        setTotalPages(Math.max(Number(data.totalPages) || 1, 1));
      })
      .catch(() => {
        setBooks([]);
        setTotalPages(1);
      })
      .finally(() => setLoading(false));
  }, [keyword, currentPage]);

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const goToPage = (page: number) => {
    const safePage = Math.min(Math.max(page, 1), totalPages);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (safePage <= 1) next.delete("page");
      else next.set("page", String(safePage));
      return next;
    });
  };

  const submitPageInput = () => {
    const page = Number(pageInput);
    if (!Number.isFinite(page)) {
      setPageInput(String(currentPage));
      return;
    }
    goToPage(page);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Kết quả tìm kiếm</h1>
        <p className="text-gray-600 mt-1">
          {keyword ? <>Từ khóa: <span className="font-semibold">"{keyword}"</span></> : "Vui lòng nhập từ khóa để tìm sách."}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {[...Array(12)].map((_, i) => <div key={i} className="animate-pulse h-64 bg-gray-200 rounded-xl" />)}
        </div>
      ) : books.length === 0 ? (
        <div className="bg-white border rounded-2xl p-10 text-center text-gray-500">Không tìm thấy sách phù hợp.</div>
      ) : (
        <>
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white disabled:opacity-50"
              >
                Trước
              </button>

              <div className="flex items-center gap-1.5 text-sm text-gray-700">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onBlur={submitPageInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submitPageInput();
                    }
                  }}
                  className="w-14 px-2 py-1.5 text-center rounded-lg border border-gray-300"
                />
                <span>/ {totalPages}</span>
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchResults;