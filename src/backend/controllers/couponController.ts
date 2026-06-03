import { Response } from "express";
import db from "../db/index.ts";
import { AuthRequest } from "../middleware/auth.ts";
import { CouponValidationError, isValidCouponCode, normalizeCouponCode, validateCoupon } from "../services/couponService.ts";
import { created, fail, ok } from "../utils/response.ts";
import { hasErrors, isPositiveInt, isPositiveNumber, ValidationErrors } from "../utils/validation.ts";

const getCartTotal = (userId: number) => {
  const result = db.prepare(`
    SELECT COUNT(*) AS item_count, COALESCE(SUM(ci.quantity * b.price), 0) AS total
    FROM cart_items ci
    JOIN books b ON b.id = ci.book_id
    WHERE ci.user_id = ?
  `).get(userId) as { item_count: number; total: number };
  return { itemCount: Number(result.item_count), total: Number(result.total) };
};

const parseNullableNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  return Number(value);
};

const parseActive = (value: unknown) => {
  if (value === true || value === 1 || value === "1") return 1;
  if (value === false || value === 0 || value === "0") return 0;
  return null;
};

const parseCouponDate = (value: unknown, boundary: "start" | "end") => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return undefined;
  const toIsoDate = (year: string, month: string, day: string) => {
    const time = boundary === "start" ? "00:00:00.000" : "23:59:59.999";
    const date = new Date(`${year}-${month}-${day}T${time}`);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  };

  const vietnameseDate = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (vietnameseDate) {
    const [, day, month, year] = vietnameseDate;
    return toIsoDate(year, month, day);
  }

  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return toIsoDate(year, month, day);
  }

  if (Number.isNaN(new Date(value).getTime())) return undefined;
  return new Date(value).toISOString();
};

const validateCouponPayload = (body: any) => {
  const errors: ValidationErrors = {};
  const code = normalizeCouponCode(body.code);
  const type = body.type;
  const value = Number(body.value);
  const minOrderAmount = body.min_order_amount === undefined || body.min_order_amount === "" ? 0 : Number(body.min_order_amount);
  const maxDiscountAmount = parseNullableNumber(body.max_discount_amount);
  const usageLimit = parseNullableNumber(body.usage_limit);
  const startDate = parseCouponDate(body.start_date, "start");
  const endDate = parseCouponDate(body.end_date, "end");
  const isActive = body.is_active === undefined ? 1 : parseActive(body.is_active);

  if (!code || !isValidCouponCode(code)) errors.code = "Mã phải từ 3 đến 30 ký tự, chỉ gồm A-Z, 0-9, dấu gạch ngang hoặc gạch dưới.";
  if (!["percent", "fixed"].includes(type)) errors.type = "Loại giảm giá không hợp lệ.";
  if (!isPositiveNumber(body.value)) errors.value = "Giá trị giảm phải lớn hơn 0.";
  if (type === "percent" && value > 100) errors.value = "Giảm theo phần trăm không được vượt quá 100%.";
  if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0) {
    errors.min_order_amount = "Đơn tối thiểu phải lớn hơn hoặc bằng 0.";
  }
  if (maxDiscountAmount !== null && (!Number.isFinite(maxDiscountAmount) || maxDiscountAmount < 0)) {
    errors.max_discount_amount = "Giảm tối đa phải lớn hơn hoặc bằng 0 hoặc để trống.";
  }
  if (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit < 1)) {
    errors.usage_limit = "Giới hạn lượt dùng phải là số nguyên từ 1 trở lên hoặc để trống.";
  }
  if (startDate === undefined) errors.start_date = "Thời gian bắt đầu không hợp lệ.";
  if (endDate === undefined) errors.end_date = "Thời gian kết thúc không hợp lệ.";
  if (startDate && endDate && new Date(startDate).getTime() >= new Date(endDate).getTime()) {
    errors.end_date = "Thời gian kết thúc phải sau thời gian bắt đầu.";
  }
  if (isActive === null) errors.is_active = "Trạng thái hoạt động không hợp lệ.";

  return {
    data: {
      code,
      type,
      value,
      min_order_amount: minOrderAmount,
      max_discount_amount: maxDiscountAmount,
      usage_limit: usageLimit,
      start_date: startDate ?? null,
      end_date: endDate ?? null,
      is_active: isActive
    },
    errors
  };
};

export const applyCoupon = (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 401, "Bạn cần đăng nhập để sử dụng mã giảm giá.");
  const cart = getCartTotal(req.user.id);
  if (cart.itemCount === 0) return fail(res, 400, "Giỏ hàng đang trống.");

  try {
    const result = validateCoupon(req.body.code, req.user.id, cart.total);
    return ok(res, {
      code: result.code,
      discount_amount: result.discount_amount,
      final_total: result.final_total,
      message: "Áp dụng mã giảm giá thành công."
    }, "Áp dụng mã giảm giá thành công.");
  } catch (error) {
    if (error instanceof CouponValidationError) return fail(res, 400, error.message, { code: error.message });
    console.error("Apply coupon error:", error);
    return fail(res, 500, "Không thể áp dụng mã giảm giá.");
  }
};

export const getCoupons = (_req: AuthRequest, res: Response) => {
  return ok(res, db.prepare("SELECT * FROM coupons ORDER BY created_at DESC, id DESC").all());
};

export const createCoupon = (req: AuthRequest, res: Response) => {
  const { data, errors } = validateCouponPayload(req.body);
  if (hasErrors(errors)) return fail(res, 400, "Dữ liệu mã giảm giá không hợp lệ.", errors);

  try {
    const result = db.prepare(`
      INSERT INTO coupons (code, type, value, min_order_amount, max_discount_amount, usage_limit, start_date, end_date, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(data.code, data.type, data.value, data.min_order_amount, data.max_discount_amount, data.usage_limit, data.start_date, data.end_date, data.is_active);
    return created(res, { id: result.lastInsertRowid }, "Tạo mã giảm giá thành công.");
  } catch (error: any) {
    if (error?.code === "SQLITE_CONSTRAINT_UNIQUE") return fail(res, 409, "Mã giảm giá đã tồn tại.", { code: "Mã giảm giá đã tồn tại." });
    console.error("Create coupon error:", error);
    return fail(res, 500, "Không thể tạo mã giảm giá.");
  }
};

export const updateCoupon = (req: AuthRequest, res: Response) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 400, "ID mã giảm giá không hợp lệ.");
  const { data, errors } = validateCouponPayload(req.body);
  if (hasErrors(errors)) return fail(res, 400, "Dữ liệu mã giảm giá không hợp lệ.", errors);

  try {
    const result = db.prepare(`
      UPDATE coupons
      SET code = ?, type = ?, value = ?, min_order_amount = ?, max_discount_amount = ?,
          usage_limit = ?, start_date = ?, end_date = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(data.code, data.type, data.value, data.min_order_amount, data.max_discount_amount, data.usage_limit, data.start_date, data.end_date, data.is_active, req.params.id);
    if (result.changes === 0) return fail(res, 404, "Không tìm thấy mã giảm giá.");
    return ok(res, null, "Cập nhật mã giảm giá thành công.");
  } catch (error: any) {
    if (error?.code === "SQLITE_CONSTRAINT_UNIQUE") return fail(res, 409, "Mã giảm giá đã tồn tại.", { code: "Mã giảm giá đã tồn tại." });
    console.error("Update coupon error:", error);
    return fail(res, 500, "Không thể cập nhật mã giảm giá.");
  }
};

export const deleteCoupon = (req: AuthRequest, res: Response) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 400, "ID mã giảm giá không hợp lệ.");
  const result = db.prepare("UPDATE coupons SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return fail(res, 404, "Không tìm thấy mã giảm giá.");
  return ok(res, null, "Đã tắt mã giảm giá.");
};
