import React, { useEffect, useState } from "react";
import { bookService, cartService } from "../services/api.ts";
import { Search, ChevronLeft, ChevronRight, ShoppingCart, Star } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext.tsx";
import { useToast } from "../context/ToastContext.tsx";

const Home = () => {
  const [books, setBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [activePromoSlide, setActivePromoSlide] = useState(0);
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const keyword = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    setSearch(keyword);
    setSelectedCategory(category);
  }, [searchParams]);

  const promoSlides = [
    {
      id: 1,
      badge: "BookHaven",
      subtitle: "Khám phá kho sách đa dạng từ kỹ năng sống, kinh tế, nuôi dạy con, thiếu nhi đến ngoại ngữ.",
      image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: 2,
      badge: "BookHaven",
      subtitle: "Cập nhật nhiều đầu sách chất lượng cho mọi nhu cầu học tập và phát triển bản thân.",
      image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: 3,
      badge: "BookHaven",
      subtitle: "Nơi bạn dễ dàng tìm thấy cuốn sách phù hợp cho hành trình của mình.",
      image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=1200&auto=format&fit=crop",
    }
  ];

  const uniqueCategories = categories.filter(
    (cat: any, index: number, arr: any[]) => arr.findIndex((c: any) => c.name === cat.name) === index
  );

  const sidebarCategories = [
    { label: "Tất cả sản phẩm", value: "" },
    ...uniqueCategories.map((cat: any) => ({ label: cat.name, value: cat.name }))
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActivePromoSlide((prev) => (prev + 1) % promoSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [promoSlides.length]);

  const prevPromoSlide = () => {
    setActivePromoSlide((prev) => (prev - 1 + promoSlides.length) % promoSlides.length);
  };

  const nextPromoSlide = () => {
    setActivePromoSlide((prev) => (prev + 1) % promoSlides.length);
  };

  useEffect(() => {
    bookService.getCategories()
      .then(setCategories)
      .catch(() => showToast("Không thể tải danh mục sách.", "error"));
  }, [showToast]);

  useEffect(() => {
    setLoading(true);
    const isSearching = Boolean(search.trim());
    const query = new URLSearchParams();

    query.set("limit", isSearching ? "24" : "5");
    if (search.trim()) query.set("search", search.trim());
    if (selectedCategory) query.set("category", selectedCategory);
    query.set("sort", "bestseller");

    const params = `?${query.toString()}`;
    bookService.getAll(params)
      .then(data => {
        setBooks(data.books || []);
      })
      .catch(() => {
        showToast("Không thể tải danh sách sách.", "error");
        setBooks([]);
      })
      .finally(() => setLoading(false));
  }, [search, selectedCategory, showToast]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (search.trim()) {
        next.set("search", search.trim());
      } else {
        next.delete("search");
      }
      if (selectedCategory) {
        next.set("category", selectedCategory);
      } else {
        next.delete("category");
      }
      return next;
    });
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Ecommerce bookstore hero */}
      <section className="bg-white rounded-2xl border border-orange-100 p-3 md:p-4">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
          <aside className="border border-orange-100 rounded-xl overflow-hidden bg-white">
            <div className="px-4 py-3 bg-orange-50 border-b border-orange-100">
              <div className="font-bold text-orange-700 whitespace-nowrap">Danh mục sản phẩm</div>
            </div>
            <div className="divide-y divide-orange-50">
              {sidebarCategories.map((category) => (
                <button
                  key={category.label}
                  onClick={() => {
                    if (!category.value) {
                      navigate("/category/all");
                    } else {
                      navigate(`/category/${encodeURIComponent(category.value)}`);
                    }
                  }}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${selectedCategory === category.value || (!selectedCategory && !category.value)
                    ? "bg-orange-100 text-orange-700 font-semibold"
                    : "text-gray-700 hover:bg-orange-50 hover:text-orange-700"
                    }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </aside>

          <div className="relative rounded-xl overflow-hidden border border-orange-100 min-h-[280px] md:min-h-[360px]">
            <img
              src={promoSlides[activePromoSlide].image}
              alt={promoSlides[activePromoSlide].badge}
              className="absolute inset-0 w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 to-black/20" />
            <div className="relative h-full p-6 md:p-10 text-white flex flex-col justify-center items-start gap-4">
              <div className="inline-block border border-orange-100/35 bg-black/10 rounded-md px-3 py-1.5">
                <p className="text-base md:text-xl tracking-[0.04em] text-orange-100 font-extrabold leading-none">
                  {promoSlides[activePromoSlide].badge}
                </p>
              </div>
              <p className="max-w-2xl text-base md:text-xl leading-relaxed md:leading-relaxed font-medium text-orange-50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
                {promoSlides[activePromoSlide].subtitle}
              </p>
            </div>

            <button onClick={prevPromoSlide} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white text-gray-700 p-2 rounded-full">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={nextPromoSlide} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white text-gray-700 p-2 rounded-full">
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {promoSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActivePromoSlide(index)}
                  className={`h-2.5 rounded-full transition-all ${activePromoSlide === index ? "w-7 bg-orange-500" : "w-2.5 bg-white/80"}`}
                />
              ))}
            </div>
          </div>

        </div>
      </section>

      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 uppercase">Sách bán chạy</h2>
          {selectedCategory ? <p className="text-sm text-gray-500">Danh mục: {selectedCategory}</p> : null}
        </div>
        <div className="hidden text-sm font-semibold text-orange-600 md:block">{books.length} sản phẩm</div>
      </div>

      {/* Book Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="animate-pulse space-y-4">
              <div className="bg-gray-200 aspect-[2/3] rounded-xl"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {books.map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <Link to={`/book/${book.id}`} className="block space-y-3">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
                    <img
                      src={book.image_url}
                      alt={book.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-indigo-700">
                      {book.category_name}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-sm text-gray-500">{book.author}</p>
                    <p className="flex items-center gap-1 text-xs text-gray-500">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-gray-700">{Number(book.average_rating || 0).toFixed(1)}</span>
                      <span>({book.review_count || 0})</span>
                    </p>
                    <p className="font-bold text-indigo-700">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(book.price)}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!user) { navigate("/login"); return; }
                    try {
                      await cartService.add(book.id, 1);
                      navigate("/cart");
                    } catch (err: any) {
                      showToast(err.message || "Không thể thêm sách vào giỏ hàng.", "error");
                    }
                  }}
                  className="mt-2 w-full bg-indigo-50 text-indigo-700 py-2 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-1"
                >
                  <ShoppingCart size={14} /> Mua ngay
                </button>
              </motion.div>
            ))}
          </div>

        </>
      )}
    </div>
  );
};

export default Home;
