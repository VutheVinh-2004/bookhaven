import { Request, Response } from "express";
import db from "../db/index.ts";
import { AuthRequest } from "../middleware/auth.ts";
import { created, fail, ok } from "../utils/response.ts";
import { hasErrors, isNonEmptyString, isPositiveInt, trimText, ValidationErrors } from "../utils/validation.ts";

const validateReview = (body: any) => {
  const errors: ValidationErrors = {};
  const rating = Number(body.rating);
  const comment = trimText(body.comment);

  if (!isPositiveInt(body.rating) || rating > 5) {
    errors.rating = "Vui lòng chọn số sao từ 1 đến 5.";
  }
  if (!isNonEmptyString(comment, 1, 1000)) {
    errors.comment = "Nội dung đánh giá phải từ 1 đến 1000 ký tự.";
  }

  return { data: { rating, comment }, errors };
};

const hasDeliveredBook = (userId: number, bookId: string) => {
  return Boolean(db.prepare(`
    SELECT 1
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.user_id = ? AND oi.book_id = ? AND o.status = 'delivered'
    LIMIT 1
  `).get(userId, bookId));
};

export const getBookReviews = (req: Request, res: Response) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 400, "ID sách không hợp lệ.");

  const book = db.prepare("SELECT id FROM books WHERE id = ?").get(req.params.id);
  if (!book) return fail(res, 404, "Không tìm thấy sách.");

  const reviews = db.prepare(`
    SELECT r.id, r.book_id, r.user_id, r.rating, r.comment, r.created_at, r.updated_at,
           COALESCE(NULLIF(trim(u.full_name), ''), 'Người dùng BookHaven') AS reviewer_name
    FROM book_reviews r
    JOIN users u ON u.id = r.user_id
    WHERE r.book_id = ?
    ORDER BY r.updated_at DESC, r.id DESC
  `).all(req.params.id);

  const summary = db.prepare(`
    SELECT COUNT(*) AS review_count, COALESCE(ROUND(AVG(rating), 1), 0) AS average_rating
    FROM book_reviews
    WHERE book_id = ?
  `).get(req.params.id);

  return ok(res, { reviews, summary });
};

export const getMyReviewEligibility = (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 401, "Bạn cần đăng nhập để kiểm tra quyền đánh giá.");
  if (!isPositiveInt(req.params.id)) return fail(res, 400, "ID sách không hợp lệ.");

  const book = db.prepare("SELECT id FROM books WHERE id = ?").get(req.params.id);
  if (!book) return fail(res, 404, "Không tìm thấy sách.");

  return ok(res, { can_review: hasDeliveredBook(req.user.id, req.params.id) });
};

export const upsertMyReview = (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 401, "Bạn cần đăng nhập để đánh giá sản phẩm.");
  if (!isPositiveInt(req.params.id)) return fail(res, 400, "ID sách không hợp lệ.");

  const { data, errors } = validateReview(req.body);
  if (hasErrors(errors)) return fail(res, 400, "Đánh giá không hợp lệ.", errors);

  const book = db.prepare("SELECT id FROM books WHERE id = ?").get(req.params.id);
  if (!book) return fail(res, 404, "Không tìm thấy sách.");
  if (!hasDeliveredBook(req.user.id, req.params.id)) {
    return fail(res, 403, "Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua và nhận hàng.");
  }

  const existing = db.prepare(
    "SELECT id FROM book_reviews WHERE book_id = ? AND user_id = ?"
  ).get(req.params.id, req.user.id) as { id: number } | undefined;

  if (existing) {
    db.prepare(`
      UPDATE book_reviews
      SET rating = ?, comment = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(data.rating, data.comment, existing.id);
    return ok(res, { id: existing.id }, "Đã cập nhật đánh giá.");
  }

  const result = db.prepare(`
    INSERT INTO book_reviews (book_id, user_id, rating, comment)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, req.user.id, data.rating, data.comment);

  return created(res, { id: result.lastInsertRowid }, "Đã gửi đánh giá.");
};

export const deleteMyReview = (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 401, "Bạn cần đăng nhập để xóa đánh giá.");
  if (!isPositiveInt(req.params.id)) return fail(res, 400, "ID sách không hợp lệ.");

  const result = db.prepare(
    "DELETE FROM book_reviews WHERE book_id = ? AND user_id = ?"
  ).run(req.params.id, req.user.id);

  if (result.changes === 0) return fail(res, 404, "Không tìm thấy đánh giá của bạn.");
  return ok(res, null, "Đã xóa đánh giá.");
};
