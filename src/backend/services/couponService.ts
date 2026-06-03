import db from "../db/index.ts";

export type Coupon = {
  id: number;
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  start_date: string | null;
  end_date: string | null;
  is_active: number;
};

export class CouponValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CouponValidationError";
  }
}

export const normalizeCouponCode = (value: unknown) =>
  typeof value === "string" ? value.trim().toUpperCase() : "";

export const isValidCouponCode = (code: string) => /^[A-Z0-9_-]{3,30}$/.test(code);

export const validateCoupon = (rawCode: unknown, _userId: number, cartTotal: number) => {
  const code = normalizeCouponCode(rawCode);
  if (!code) throw new CouponValidationError("Vui lòng nhập mã giảm giá.");
  if (!isValidCouponCode(code)) {
    throw new CouponValidationError("Mã giảm giá phải từ 3 đến 30 ký tự, chỉ gồm A-Z, 0-9, dấu gạch ngang hoặc gạch dưới.");
  }
  if (!Number.isFinite(cartTotal) || cartTotal <= 0) {
    throw new CouponValidationError("Tổng tiền giỏ hàng không hợp lệ.");
  }

  const coupon = db.prepare("SELECT * FROM coupons WHERE code = ?").get(code) as Coupon | undefined;
  if (!coupon) throw new CouponValidationError("Mã giảm giá không tồn tại.");
  if (!coupon.is_active) throw new CouponValidationError("Mã giảm giá không còn hoạt động.");

  const now = Date.now();
  if (coupon.start_date && now < new Date(coupon.start_date).getTime()) {
    throw new CouponValidationError("Mã giảm giá chưa đến thời gian sử dụng.");
  }
  if (coupon.end_date && now > new Date(coupon.end_date).getTime()) {
    throw new CouponValidationError("Mã giảm giá đã hết hạn.");
  }
  if (cartTotal < Number(coupon.min_order_amount || 0)) {
    throw new CouponValidationError(`Đơn hàng cần đạt tối thiểu ${Number(coupon.min_order_amount || 0).toLocaleString("vi-VN")} đ để sử dụng mã này.`);
  }
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    throw new CouponValidationError("Mã giảm giá đã hết lượt sử dụng.");
  }

  let discountAmount = coupon.type === "percent"
    ? cartTotal * Number(coupon.value) / 100
    : Number(coupon.value);
  if (coupon.max_discount_amount !== null) {
    discountAmount = Math.min(discountAmount, Number(coupon.max_discount_amount));
  }
  discountAmount = Math.max(0, Math.min(discountAmount, cartTotal));
  discountAmount = Math.round(discountAmount);
  const finalTotal = Math.max(0, cartTotal - discountAmount);

  return { coupon, code, discount_amount: discountAmount, final_total: finalTotal };
};
