import { Response } from "express";
import db from "../db/index.ts";
import { AuthRequest } from "../middleware/auth.ts";
import { fail, ok, created } from "../utils/response.ts";
import { hasErrors, isNonEmptyString, isPhone, isPositiveInt, trimText, ValidationErrors } from "../utils/validation.ts";

export const getCart = (req: AuthRequest, res: Response) => {
  const items = db.prepare(`
    SELECT ci.*, b.title, b.price, b.image_url, b.stock
    FROM cart_items ci
    JOIN books b ON ci.book_id = b.id
    WHERE ci.user_id = ?
    ORDER BY ci.id DESC
  `).all(req.user?.id);
  return ok(res, items);
};

export const addToCart = (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const bookId = Number(req.body.book_id);
  const quantity = Number(req.body.quantity ?? 1);
  const errors: ValidationErrors = {};

  if (!isPositiveInt(bookId)) errors.book_id = "ID sách không hợp lệ.";
  if (!isPositiveInt(quantity)) errors.quantity = "Số lượng phải là số nguyên lớn hơn 0.";
  if (hasErrors(errors)) return fail(res, 400, "Dữ liệu giỏ hàng không hợp lệ.", errors);

  try {
    const book = db.prepare("SELECT id, stock FROM books WHERE id = ?").get(bookId) as any;
    if (!book) return fail(res, 404, "Không tìm thấy sách.");

    const existing = db.prepare("SELECT * FROM cart_items WHERE user_id = ? AND book_id = ?").get(userId, bookId) as any;
    const newQuantity = (existing ? existing.quantity : 0) + quantity;
    if (newQuantity > book.stock) {
      return fail(res, 400, `Chỉ còn ${book.stock} cuốn trong kho. Bạn đã có ${existing ? existing.quantity : 0} cuốn trong giỏ.`);
    }

    if (existing) {
      db.prepare("UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?").run(newQuantity, existing.id, userId);
    } else {
      db.prepare("INSERT INTO cart_items (user_id, book_id, quantity) VALUES (?, ?, ?)").run(userId, bookId, quantity);
    }
    return ok(res, null, "Đã thêm vào giỏ hàng.");
  } catch (error) {
    console.error("Add cart error:", error);
    return fail(res, 500, "Lỗi thêm vào giỏ hàng.");
  }
};

export const updateCartItem = (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const quantity = Number(req.body.quantity);
  const userId = req.user?.id;

  if (!isPositiveInt(id)) return fail(res, 400, "ID giỏ hàng không hợp lệ.");
  if (!isPositiveInt(quantity)) return fail(res, 400, "Số lượng phải là số nguyên lớn hơn 0.");

  try {
    const cartItem = db.prepare("SELECT book_id FROM cart_items WHERE id = ? AND user_id = ?").get(id, userId) as any;
    if (!cartItem) return fail(res, 404, "Không tìm thấy sản phẩm trong giỏ hàng.");

    const book = db.prepare("SELECT stock FROM books WHERE id = ?").get(cartItem.book_id) as any;
    if (quantity > book.stock) return fail(res, 400, `Chỉ còn ${book.stock} cuốn trong kho.`);

    db.prepare("UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?").run(quantity, id, userId);
    return ok(res, null, "Cập nhật giỏ hàng thành công.");
  } catch (error) {
    console.error("Update cart error:", error);
    return fail(res, 500, "Lỗi cập nhật giỏ hàng.");
  }
};

export const removeFromCart = (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!isPositiveInt(id)) return fail(res, 400, "ID giỏ hàng không hợp lệ.");
  const result = db.prepare("DELETE FROM cart_items WHERE id = ? AND user_id = ?").run(id, req.user?.id);
  if (result.changes === 0) return fail(res, 404, "Không tìm thấy sản phẩm trong giỏ hàng.");
  return ok(res, null, "Đã xóa khỏi giỏ hàng.");
};

export const createOrder = (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const shippingAddress = trimText(req.body.shipping_address);
  const phone = trimText(req.body.phone);
  const errors: ValidationErrors = {};

  if (!isNonEmptyString(shippingAddress, 5, 255)) errors.shipping_address = "Địa chỉ giao hàng phải từ 5 đến 255 ký tự.";
  if (!isPhone(phone)) errors.phone = "Số điện thoại Việt Nam không hợp lệ.";
  if (hasErrors(errors)) return fail(res, 400, "Dữ liệu đặt hàng không hợp lệ.", errors);

  try {
    const cartItems = db.prepare(`
      SELECT ci.*, b.title, b.price, b.stock
      FROM cart_items ci
      JOIN books b ON ci.book_id = b.id
      WHERE ci.user_id = ?
    `).all(userId) as any[];

    if (cartItems.length === 0) return fail(res, 400, "Giỏ hàng đang trống.");
    for (const item of cartItems) {
      if (item.quantity <= 0) return fail(res, 400, "Giỏ hàng có số lượng không hợp lệ.");
      if (item.stock < item.quantity) return fail(res, 400, `Sách "${item.title}" không đủ hàng. Chỉ còn ${item.stock} cuốn.`);
    }

    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const transaction = db.transaction(() => {
      const orderResult = db.prepare(`
        INSERT INTO orders (user_id, total_price, shipping_address, phone)
        VALUES (?, ?, ?, ?)
      `).run(userId, totalPrice, shippingAddress, phone);
      const orderId = orderResult.lastInsertRowid;
      const insertOrderItem = db.prepare("INSERT INTO order_items (order_id, book_id, quantity, price) VALUES (?, ?, ?, ?)");
      const updateStock = db.prepare("UPDATE books SET stock = stock - ? WHERE id = ? AND stock >= ?");

      for (const item of cartItems) {
        insertOrderItem.run(orderId, item.book_id, item.quantity, item.price);
        const result = updateStock.run(item.quantity, item.book_id, item.quantity);
        if (result.changes === 0) throw new Error(`Sách "${item.title}" không đủ hàng.`);
      }
      db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(userId);
      return orderId;
    });

    return created(res, { id: transaction() }, "Đặt hàng thành công.");
  } catch (error: any) {
    console.error("Create order error:", error);
    return fail(res, 400, error.message || "Lỗi tạo đơn hàng.");
  }
};

export const getMyOrders = (req: AuthRequest, res: Response) => {
  return ok(res, db.prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC").all(req.user?.id));
};

export const getOrderDetails = (req: AuthRequest, res: Response) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 400, "ID đơn hàng không hợp lệ.");
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id) as any;
  if (!order) return fail(res, 404, "Không tìm thấy đơn hàng.");
  if (req.user?.role === "user" && order.user_id !== req.user.id) return fail(res, 403, "Bạn không có quyền xem đơn hàng này.");

  const items = db.prepare(`
    SELECT oi.*, b.title, b.image_url
    FROM order_items oi
    JOIN books b ON oi.book_id = b.id
    WHERE oi.order_id = ?
  `).all(req.params.id);
  return ok(res, { ...order, items });
};

export const getAllOrders = (_req: AuthRequest, res: Response) => {
  return ok(res, db.prepare(`
    SELECT o.*, u.email as user_email, u.full_name as user_name
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `).all());
};

export const updateOrderStatus = (req: AuthRequest, res: Response) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 400, "ID đơn hàng không hợp lệ.");
  const status = trimText(req.body.status);
  const allowed = ["pending", "processing", "shipped", "delivered", "cancelled"];
  if (!allowed.includes(status)) return fail(res, 400, "Trạng thái đơn hàng không hợp lệ.");

  const result = db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, req.params.id);
  if (result.changes === 0) return fail(res, 404, "Không tìm thấy đơn hàng.");
  return ok(res, null, "Cập nhật trạng thái đơn hàng thành công.");
};

export const getAdminStats = (_req: AuthRequest, res: Response) => {
  const totalRevenue = db.prepare("SELECT SUM(total_price) as total FROM orders WHERE status = 'delivered'").get() as any;
  const totalOrders = db.prepare("SELECT COUNT(*) as count FROM orders").get() as any;
  const totalCustomers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get() as any;
  const totalBooks = db.prepare("SELECT COUNT(*) as count FROM books").get() as any;
  const revenueByDay = db.prepare(`
    SELECT date(created_at) as date, SUM(total_price) as revenue
    FROM orders
    WHERE status = 'delivered' AND created_at >= date('now', '-7 days')
    GROUP BY date(created_at)
    ORDER BY date
  `).all();
  const categoryDistribution = db.prepare(`
    SELECT c.name, COUNT(b.id) as value
    FROM categories c
    LEFT JOIN books b ON c.id = b.category_id
    GROUP BY c.id
  `).all();
  const recentOrders = db.prepare(`
    SELECT o.*, u.full_name as user_name
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
    LIMIT 5
  `).all();

  return ok(res, {
    stats: {
      totalRevenue: totalRevenue.total || 0,
      totalOrders: totalOrders.count,
      totalCustomers: totalCustomers.count,
      totalBooks: totalBooks.count
    },
    revenueByDay,
    categoryDistribution,
    recentOrders
  });
};
