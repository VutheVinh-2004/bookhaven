import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Check, ShoppingCart, Star, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";
import { useToast } from "../context/ToastContext.tsx";
import { bookService, cartService, reviewService } from "../services/api.ts";

type Review = {
  id: number;
  user_id: number;
  rating: number;
  comment: string;
  reviewer_name: string;
  created_at: string;
  updated_at: string;
};

type ReviewSummary = {
  review_count: number;
  average_rating: number;
};

const StarRating = ({ value, size = "h-5 w-5" }: { value: number; size?: string }) => (
  <div className="flex items-center gap-0.5" aria-label={`${value} trên 5 sao`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`${size} ${star <= Math.round(value) ? "fill-amber-400 text-amber-400" : "fill-gray-100 text-gray-300"}`}
      />
    ))}
  </div>
);

const BookDetail = () => {
  const { id } = useParams();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState("1");
  const [adding, setAdding] = useState(false);
  const [success, setSuccess] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary>({ review_count: 0, average_rating: 0 });
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [checkingReviewEligibility, setCheckingReviewEligibility] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const loadReviews = async (bookId: string) => {
    try {
      const data = await reviewService.getByBook(bookId);
      setReviews(data.reviews);
      setReviewSummary(data.summary);
    } catch (err: any) {
      showToast(err.message || "Không thể tải đánh giá sản phẩm.", "error");
    }
  };

  useEffect(() => {
    if (!id) return;
    bookService.getById(id)
      .then(setBook)
      .catch((err: any) => showToast(err.message || "Không thể tải thông tin sách.", "error"))
      .finally(() => setLoading(false));
    loadReviews(id);
  }, [id]);

  useEffect(() => {
    setQuantityInput(String(quantity));
  }, [quantity]);

  useEffect(() => {
    const myReview = reviews.find((review) => review.user_id === user?.id);
    if (myReview) {
      setReviewRating(myReview.rating);
      setReviewComment(myReview.comment);
    } else {
      setReviewRating(5);
      setReviewComment("");
    }
  }, [reviews, user?.id]);

  useEffect(() => {
    if (!id || !user) {
      setCanReview(false);
      return;
    }

    setCheckingReviewEligibility(true);
    reviewService.getEligibility(id)
      .then((data) => setCanReview(Boolean(data.can_review)))
      .catch(() => setCanReview(false))
      .finally(() => setCheckingReviewEligibility(false));
  }, [id, user?.id]);

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

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) {
      navigate("/login");
      return;
    }

    const comment = reviewComment.trim();
    if (!comment || comment.length > 1000) {
      setReviewError("Nội dung đánh giá phải từ 1 đến 1000 ký tự.");
      return;
    }

    setReviewError("");
    setSavingReview(true);
    try {
      await reviewService.save(id, { rating: reviewRating, comment });
      await loadReviews(id);
      showToast("Đã lưu đánh giá của bạn.", "success");
    } catch (err: any) {
      setReviewError(err?.errors?.comment || err?.errors?.rating || err.message || "Không thể lưu đánh giá.");
    } finally {
      setSavingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!id || !window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return;
    setSavingReview(true);
    try {
      await reviewService.remove(id);
      await loadReviews(id);
      showToast("Đã xóa đánh giá.", "success");
    } catch (err: any) {
      showToast(err.message || "Không thể xóa đánh giá.", "error");
    } finally {
      setSavingReview(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600" /></div>;
  }
  if (!book) return <div className="py-20 text-center">Không tìm thấy sách</div>;

  const myReviewExists = reviews.some((review) => review.user_id === user?.id);

  return (
    <div className="mx-auto max-w-5xl">
      <button onClick={() => navigate(-1)} className="mb-8 flex items-center text-gray-600 transition-colors hover:text-indigo-600">
        <ArrowLeft className="mr-2 h-5 w-5" /> Quay lại
      </button>

      <div className="flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl md:flex-row">
        <div className="flex items-center justify-center bg-gray-50 p-8 md:w-2/5">
          <img
            src={book.image_url}
            alt={book.title}
            className="max-h-[500px] rounded-xl object-cover shadow-2xl"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="space-y-6 p-8 md:w-3/5 md:p-12">
          <div className="space-y-2">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-bold uppercase tracking-wider text-indigo-700">
              {book.category_name}
            </span>
            <h1 className="text-3xl font-extrabold leading-tight text-gray-900 md:text-4xl">{book.title}</h1>
            <p className="text-xl font-medium text-gray-500">Tác giả: <span className="text-gray-900">{book.author}</span></p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <StarRating value={reviewSummary.average_rating} />
              <span className="text-sm font-bold text-gray-700">{Number(reviewSummary.average_rating).toFixed(1)}</span>
              <span className="text-sm text-gray-500">({reviewSummary.review_count} đánh giá)</span>
            </div>
          </div>

          <div className="text-3xl font-bold text-indigo-600">
            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(book.price)}
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="mb-3 text-lg font-bold text-gray-900">Mô tả nội dung</h3>
            <p className="text-lg leading-relaxed text-gray-600">{book.description}</p>
          </div>

          <div className="space-y-4 pt-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center overflow-hidden rounded-xl border">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-4 py-2 transition-colors hover:bg-gray-100">-</button>
                <input
                  type="number"
                  min="1"
                  max={book.stock}
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  onBlur={applyQuantityInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyQuantityInput();
                    }
                  }}
                  className="w-16 border-x py-2 text-center font-bold focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button onClick={() => setQuantity((q) => Math.min(book.stock, q + 1))} className="px-4 py-2 transition-colors hover:bg-gray-100">+</button>
              </div>
              <span className="text-sm text-gray-500">Còn lại: {book.stock} cuốn</span>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                onClick={handleAddToCart}
                disabled={adding || book.stock === 0}
                className={`flex flex-1 items-center justify-center rounded-2xl py-4 text-lg font-bold transition-all ${
                  success ? "bg-green-500 text-white" : "border-2 border-indigo-600 bg-white text-indigo-600 hover:bg-indigo-50"
                } disabled:opacity-50`}
              >
                {success ? <><Check className="mr-2" /> Đã thêm</> : adding ? "Đang xử lý..." : book.stock === 0 ? "Hết hàng" : <><ShoppingCart className="mr-2" /> Thêm vào giỏ</>}
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
                className="flex-1 rounded-2xl bg-indigo-600 py-4 text-lg font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 disabled:opacity-50"
              >
                Mua ngay
              </button>
            </div>

            {!user && (
              <p className="flex items-center justify-center text-center text-sm text-gray-500">
                <AlertCircle className="mr-1 h-4 w-4" /> Đăng nhập để mua hàng
              </p>
            )}
          </div>
        </div>
      </div>

      <section className="mt-10 border-t border-gray-200 pt-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Đánh giá sản phẩm</h2>
            <p className="mt-1 text-sm text-gray-500">Chia sẻ cảm nhận của bạn để mọi người cùng tham khảo.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-extrabold text-gray-900">{Number(reviewSummary.average_rating).toFixed(1)}</span>
            <div>
              <StarRating value={reviewSummary.average_rating} />
              <p className="mt-1 text-xs text-gray-500">{reviewSummary.review_count} lượt đánh giá</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <div>
            {user && canReview ? (
              <form onSubmit={handleSaveReview} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-bold text-gray-900">{myReviewExists ? "Cập nhật đánh giá của bạn" : "Viết đánh giá"}</h3>
                <div className="mt-4">
                  <p className="mb-2 text-sm font-semibold text-gray-700">Mức độ hài lòng</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setReviewRating(star)} className="p-1" aria-label={`Chọn ${star} sao`} title={`${star} sao`}>
                        <Star className={`h-7 w-7 ${star <= reviewRating ? "fill-amber-400 text-amber-400" : "fill-gray-100 text-gray-300"}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="review-comment" className="text-sm font-semibold text-gray-700">Nội dung đánh giá</label>
                  <textarea
                    id="review-comment"
                    rows={5}
                    maxLength={1000}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="mt-2 w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    placeholder="Bạn cảm thấy cuốn sách này thế nào?"
                  />
                  <div className="mt-1 flex justify-between gap-3 text-xs">
                    <span className="text-red-600">{reviewError}</span>
                    <span className="shrink-0 text-gray-400">{reviewComment.length}/1000</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button type="submit" disabled={savingReview} className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
                    {savingReview ? "Đang lưu..." : "Lưu đánh giá"}
                  </button>
                  {myReviewExists && (
                    <button type="button" onClick={handleDeleteReview} disabled={savingReview} className="rounded-lg border border-red-200 p-2.5 text-red-600 hover:bg-red-50 disabled:opacity-50" aria-label="Xóa đánh giá" title="Xóa đánh giá">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </form>
            ) : user ? (
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="font-bold text-gray-900">Đánh giá sau khi nhận hàng</h3>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {checkingReviewEligibility
                    ? "Đang kiểm tra đơn hàng của bạn..."
                    : "Bạn chỉ có thể đánh giá sản phẩm sau khi đơn hàng chứa sách này đã được giao thành công."}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="font-bold text-gray-900">Bạn đã đọc cuốn sách này?</h3>
                <p className="mt-2 text-sm leading-6 text-gray-500">Đăng nhập để chia sẻ đánh giá của bạn.</p>
                <button type="button" onClick={() => navigate("/login")} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">
                  Đăng nhập để đánh giá
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="border-y border-gray-200 py-10 text-center text-gray-500">Chưa có đánh giá nào cho sản phẩm này.</div>
            ) : reviews.map((review) => (
              <article key={review.id} className="border-b border-gray-200 pb-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900">{review.reviewer_name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <StarRating value={review.rating} size="h-4 w-4" />
                      {review.user_id === user?.id && <span className="text-xs font-semibold text-indigo-600">Đánh giá của bạn</span>}
                    </div>
                  </div>
                  <time className="text-xs text-gray-400">
                    {new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(review.updated_at))}
                  </time>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-600">{review.comment}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default BookDetail;
