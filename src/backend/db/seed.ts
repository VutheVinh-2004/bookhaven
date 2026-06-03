import db, { initDb } from "./index.ts";
import bcrypt from "bcryptjs";
import { booksDataFromSql } from "./booksDataFromSql.ts";

export async function seed() {
  initDb();

  // Check if database is already seeded
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (userCount.count > 0) {
    console.log("Database already seeded. Skipping seeding process.");
    return;
  }

  console.log("Seeding database...");

  // Clear existing data
  db.prepare("DELETE FROM order_items").run();
  db.prepare("DELETE FROM orders").run();
  db.prepare("DELETE FROM books").run();
  db.prepare("DELETE FROM categories").run();
  db.prepare("DELETE FROM users").run();
  db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('categories', 'books', 'users', 'orders', 'order_items')").run();

  // Seed Categories
  const categories = [
    "Tiểu thuyết",
    "Kinh tế",
    "Kỹ năng sống",
    "Nuôi dạy con",
    "Thiếu nhi",
    "Trinh thám",
    "Chính trị",
    "Song ngữ"
  ];

  const insertCategory = db.prepare("INSERT INTO categories (name) VALUES (?)");
  for (const cat of categories) {
    insertCategory.run(cat);
  }

  // Seed Users
  const hashedPassword = await bcrypt.hash("password123", 10);
  const insertUser = db.prepare("INSERT INTO users (email, password, full_name, role, email_verified) VALUES (?, ?, ?, ?, 1)");
  
  insertUser.run("user@example.com", hashedPassword, "Người dùng mẫu", "user");
  insertUser.run("admin@example.com", hashedPassword, "Quản trị viên", "admin");

  // Seed Books
  const insertBook = db.prepare(`
    INSERT INTO books (title, author, description, price, category_id, stock, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const allBooks = booksDataFromSql;

  for (const book of allBooks) {
    insertBook.run(
      book.title,
      book.author,
      book.description,
      book.price,
      book.category_id,
      book.stock,
      book.image_url
    );
  }

  console.log("Seeding completed successfully.");
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed().catch(console.error);
}
