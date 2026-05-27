import { Request, Response } from "express";
import db from "../db/index.ts";
import { created, fail, ok } from "../utils/response.ts";
import { hasErrors, isNonEmptyString, isNonNegativeInt, isPositiveInt, isPositiveNumber, isUrlOrEmpty, trimText, ValidationErrors } from "../utils/validation.ts";

const validateBook = (body: any) => {
  const errors: ValidationErrors = {};
  const data = {
    title: trimText(body.title),
    author: trimText(body.author),
    description: trimText(body.description),
    price: Number(body.price),
    category_id: Number(body.category_id),
    stock: Number(body.stock ?? 0),
    image_url: trimText(body.image_url)
  };

  if (!isNonEmptyString(data.title, 1, 200)) errors.title = "Tên sách không được để trống và tối đa 200 ký tự.";
  if (!isNonEmptyString(data.author, 1, 150)) errors.author = "Tác giả không được để trống và tối đa 150 ký tự.";
  if (!isPositiveNumber(data.price)) errors.price = "Giá sách phải lớn hơn 0.";
  if (!isPositiveInt(data.category_id)) errors.category_id = "Danh mục không hợp lệ.";
  if (!isNonNegativeInt(data.stock)) errors.stock = "Số lượng tồn kho phải là số nguyên không âm.";
  if (!isUrlOrEmpty(data.image_url)) errors.image_url = "URL ảnh không hợp lệ.";

  return { data, errors };
};

export const getAllBooks = (req: Request, res: Response) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 100);
  const offset = (page - 1) * limit;
  const category = trimText(req.query.category);
  const search = trimText(req.query.search);
  const sort = trimText(req.query.sort);

  let query = `
    SELECT b.*, c.name as category_name,
      COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN oi.quantity ELSE 0 END), 0) as sold_count
    FROM books b
    JOIN categories c ON b.category_id = c.id
    LEFT JOIN order_items oi ON oi.book_id = b.id
    LEFT JOIN orders o ON o.id = oi.order_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (category) {
    query += " AND c.name = ?";
    params.push(category);
  }
  if (search) {
    query += " AND (b.title LIKE ? OR b.author LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  query += " GROUP BY b.id, c.name";

  const totalCount = db.prepare(`SELECT COUNT(*) as count FROM (${query})`).get(...params) as { count: number };
  if (sort === "bestseller") {
    query += " ORDER BY sold_count DESC, b.created_at DESC";
  } else {
    query += " ORDER BY b.created_at DESC";
  }
  query += " LIMIT ? OFFSET ?";
  params.push(limit, offset);

  return ok(res, {
    books: db.prepare(query).all(...params),
    totalPages: Math.ceil(totalCount.count / limit),
    currentPage: page,
    totalItems: totalCount.count
  });
};

export const getBookById = (req: Request, res: Response) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 400, "ID sách không hợp lệ.");
  const book = db.prepare(`
    SELECT b.*, c.name as category_name
    FROM books b
    JOIN categories c ON b.category_id = c.id
    WHERE b.id = ?
  `).get(req.params.id);

  if (!book) return fail(res, 404, "Không tìm thấy sách.");
  return ok(res, book);
};

export const createBook = (req: Request, res: Response) => {
  const { data, errors } = validateBook(req.body);
  if (hasErrors(errors)) return fail(res, 400, "Dữ liệu sách không hợp lệ.", errors);

  const category = db.prepare("SELECT id FROM categories WHERE id = ?").get(data.category_id);
  if (!category) return fail(res, 400, "Danh mục không tồn tại.");

  try {
    const result = db.prepare(`
      INSERT INTO books (title, author, description, price, category_id, stock, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(data.title, data.author, data.description, data.price, data.category_id, data.stock, data.image_url);
    return created(res, { id: result.lastInsertRowid }, "Tạo sách thành công.");
  } catch (error) {
    console.error("Create book error:", error);
    return fail(res, 500, "Lỗi tạo sách.");
  }
};

export const updateBook = (req: Request, res: Response) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 400, "ID sách không hợp lệ.");
  const { data, errors } = validateBook(req.body);
  if (hasErrors(errors)) return fail(res, 400, "Dữ liệu sách không hợp lệ.", errors);

  const book = db.prepare("SELECT id FROM books WHERE id = ?").get(req.params.id);
  if (!book) return fail(res, 404, "Không tìm thấy sách.");
  const category = db.prepare("SELECT id FROM categories WHERE id = ?").get(data.category_id);
  if (!category) return fail(res, 400, "Danh mục không tồn tại.");

  try {
    db.prepare(`
      UPDATE books
      SET title = ?, author = ?, description = ?, price = ?, category_id = ?, stock = ?, image_url = ?
      WHERE id = ?
    `).run(data.title, data.author, data.description, data.price, data.category_id, data.stock, data.image_url, req.params.id);
    return ok(res, null, "Cập nhật sách thành công.");
  } catch (error) {
    console.error("Update book error:", error);
    return fail(res, 500, "Lỗi cập nhật sách.");
  }
};

export const deleteBook = (req: Request, res: Response) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 400, "ID sách không hợp lệ.");
  try {
    const result = db.prepare("DELETE FROM books WHERE id = ?").run(req.params.id);
    if (result.changes === 0) return fail(res, 404, "Không tìm thấy sách.");
    return ok(res, null, "Xóa sách thành công.");
  } catch (error) {
    console.error("Delete book error:", error);
    return fail(res, 500, "Không thể xóa sách vì có dữ liệu liên quan.");
  }
};

export const getAllCategories = (_req: Request, res: Response) => {
  return ok(res, db.prepare("SELECT * FROM categories ORDER BY name").all());
};

export const createCategory = (req: Request, res: Response) => {
  const name = trimText(req.body.name);
  if (!isNonEmptyString(name, 2, 100)) return fail(res, 400, "Tên danh mục phải từ 2 đến 100 ký tự.");
  try {
    const result = db.prepare("INSERT INTO categories (name) VALUES (?)").run(name);
    return created(res, { id: result.lastInsertRowid }, "Tạo danh mục thành công.");
  } catch {
    return fail(res, 409, "Danh mục đã tồn tại.");
  }
};

export const updateCategory = (req: Request, res: Response) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 400, "ID danh mục không hợp lệ.");
  const name = trimText(req.body.name);
  if (!isNonEmptyString(name, 2, 100)) return fail(res, 400, "Tên danh mục phải từ 2 đến 100 ký tự.");
  try {
    const result = db.prepare("UPDATE categories SET name = ? WHERE id = ?").run(name, req.params.id);
    if (result.changes === 0) return fail(res, 404, "Không tìm thấy danh mục.");
    return ok(res, null, "Cập nhật danh mục thành công.");
  } catch {
    return fail(res, 409, "Tên danh mục đã tồn tại.");
  }
};

export const deleteCategory = (req: Request, res: Response) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 400, "ID danh mục không hợp lệ.");
  const booksCount = db.prepare("SELECT COUNT(*) as count FROM books WHERE category_id = ?").get(req.params.id) as { count: number };
  if (booksCount.count > 0) return fail(res, 400, "Không thể xóa danh mục đang có sách.");

  const result = db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return fail(res, 404, "Không tìm thấy danh mục.");
  return ok(res, null, "Xóa danh mục thành công.");
};
