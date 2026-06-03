import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "../../../database.sqlite");
const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

const hasColumn = (tableName: string, columnName: string) => {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  return columns.some(column => column.name === columnName);
};

export function initDb() {
  // Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);

  // Books table
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL CHECK(price > 0),
      category_id INTEGER,
      stock INTEGER DEFAULT 0 CHECK(stock >= 0),
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    )
  `);

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      full_name TEXT,
      role TEXT CHECK(role IN ('user', 'admin')) DEFAULT 'user',
      email_verified INTEGER NOT NULL DEFAULT 0,
      email_verification_token TEXT,
      email_verification_expires_at DATETIME,
      password_reset_otp_hash TEXT,
      password_reset_expires_at DATETIME,
      password_reset_attempts INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const addedEmailVerified = !hasColumn("users", "email_verified");
  if (addedEmailVerified) {
    db.exec("ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0");
  }
  if (!hasColumn("users", "email_verification_token")) {
    db.exec("ALTER TABLE users ADD COLUMN email_verification_token TEXT");
  }
  if (!hasColumn("users", "email_verification_expires_at")) {
    db.exec("ALTER TABLE users ADD COLUMN email_verification_expires_at DATETIME");
  }
  if (!hasColumn("users", "is_active")) {
    db.exec("ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1");
  }
  if (!hasColumn("users", "password_reset_otp_hash")) {
    db.exec("ALTER TABLE users ADD COLUMN password_reset_otp_hash TEXT");
  }
  if (!hasColumn("users", "password_reset_expires_at")) {
    db.exec("ALTER TABLE users ADD COLUMN password_reset_expires_at DATETIME");
  }
  if (!hasColumn("users", "password_reset_attempts")) {
    db.exec("ALTER TABLE users ADD COLUMN password_reset_attempts INTEGER NOT NULL DEFAULT 0");
  }
  if (addedEmailVerified) {
    db.prepare("UPDATE users SET email_verified = 1 WHERE email_verified = 0").run();
  }
  db.prepare("UPDATE users SET role = 'admin' WHERE role = 'super_admin'").run();

  // Orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_price REAL NOT NULL CHECK(total_price > 0),
      coupon_code TEXT,
      discount_amount REAL NOT NULL DEFAULT 0 CHECK(discount_amount >= 0),
      final_total REAL CHECK(final_total >= 0),
      status TEXT CHECK(status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending',
      shipping_address TEXT,
      phone TEXT,
      payment_method TEXT DEFAULT 'cod',
      payment_status TEXT DEFAULT 'unpaid',
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Add phone column if it doesn't exist (for existing databases)
  try {
    db.exec("ALTER TABLE orders ADD COLUMN phone TEXT");
  } catch (e) {
    // Column might already exist
  }

  if (!hasColumn("orders", "payment_method")) {
    db.exec("ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'cod'");
  }
  if (!hasColumn("orders", "payment_status")) {
    db.exec("ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'unpaid'");
    db.prepare("UPDATE orders SET payment_status = 'unpaid' WHERE payment_method = 'cod'").run();
  }
  if (!hasColumn("orders", "paid_at")) {
    db.exec("ALTER TABLE orders ADD COLUMN paid_at DATETIME");
  }
  if (!hasColumn("orders", "coupon_code")) {
    db.exec("ALTER TABLE orders ADD COLUMN coupon_code TEXT");
  }
  if (!hasColumn("orders", "discount_amount")) {
    db.exec("ALTER TABLE orders ADD COLUMN discount_amount REAL NOT NULL DEFAULT 0");
  }
  if (!hasColumn("orders", "final_total")) {
    db.exec("ALTER TABLE orders ADD COLUMN final_total REAL");
  }
  db.prepare("UPDATE orders SET final_total = total_price WHERE final_total IS NULL").run();
  db.prepare("UPDATE orders SET paid_at = created_at WHERE payment_status = 'paid' AND paid_at IS NULL").run();

  // Order Items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      price REAL NOT NULL CHECK(price > 0),
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books (id)
    )
  `);

  // Cart table
  db.exec(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE,
      UNIQUE(user_id, book_id)
    )
  `);

  // Product reviews table
  db.exec(`
    CREATE TABLE IF NOT EXISTS book_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT NOT NULL CHECK(length(trim(comment)) BETWEEN 1 AND 1000),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(book_id, user_id)
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_book_reviews_book_id
    ON book_reviews (book_id, created_at DESC)
  `);

  // Coupons table
  db.exec(`
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      type TEXT CHECK(type IN ('percent', 'fixed')) NOT NULL,
      value REAL NOT NULL CHECK(value > 0),
      min_order_amount REAL DEFAULT 0 CHECK(min_order_amount >= 0),
      max_discount_amount REAL CHECK(max_discount_amount IS NULL OR max_discount_amount >= 0),
      usage_limit INTEGER CHECK(usage_limit IS NULL OR usage_limit >= 1),
      used_count INTEGER NOT NULL DEFAULT 0 CHECK(used_count >= 0),
      start_date DATETIME,
      end_date DATETIME,
      is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Protect existing databases that were created before CHECK constraints were added.
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS validate_books_insert
    BEFORE INSERT ON books
    WHEN NEW.price <= 0 OR NEW.stock < 0 OR typeof(NEW.stock) != 'integer'
    BEGIN
      SELECT RAISE(ABORT, 'Invalid book numeric values');
    END;

    CREATE TRIGGER IF NOT EXISTS validate_books_update
    BEFORE UPDATE OF price, stock ON books
    WHEN NEW.price <= 0 OR NEW.stock < 0 OR typeof(NEW.stock) != 'integer'
    BEGIN
      SELECT RAISE(ABORT, 'Invalid book numeric values');
    END;

    CREATE TRIGGER IF NOT EXISTS validate_cart_items_insert
    BEFORE INSERT ON cart_items
    WHEN NEW.quantity <= 0 OR typeof(NEW.quantity) != 'integer'
    BEGIN
      SELECT RAISE(ABORT, 'Invalid cart quantity');
    END;

    CREATE TRIGGER IF NOT EXISTS validate_cart_items_update
    BEFORE UPDATE OF quantity ON cart_items
    WHEN NEW.quantity <= 0 OR typeof(NEW.quantity) != 'integer'
    BEGIN
      SELECT RAISE(ABORT, 'Invalid cart quantity');
    END;

    CREATE TRIGGER IF NOT EXISTS validate_order_items_insert
    BEFORE INSERT ON order_items
    WHEN NEW.quantity <= 0 OR typeof(NEW.quantity) != 'integer' OR NEW.price <= 0
    BEGIN
      SELECT RAISE(ABORT, 'Invalid order item values');
    END;

    CREATE TRIGGER IF NOT EXISTS validate_orders_insert
    BEFORE INSERT ON orders
    WHEN NEW.total_price <= 0 OR NEW.discount_amount < 0 OR NEW.final_total < 0
    BEGIN
      SELECT RAISE(ABORT, 'Invalid order total');
    END;

    CREATE TRIGGER IF NOT EXISTS validate_orders_discount_update
    BEFORE UPDATE OF total_price, discount_amount, final_total ON orders
    WHEN NEW.total_price <= 0 OR NEW.discount_amount < 0 OR NEW.final_total < 0
    BEGIN
      SELECT RAISE(ABORT, 'Invalid order total');
    END;

    CREATE TRIGGER IF NOT EXISTS validate_order_discounts_insert
    BEFORE INSERT ON orders
    WHEN NEW.discount_amount < 0 OR NEW.final_total < 0
    BEGIN
      SELECT RAISE(ABORT, 'Invalid order discount');
    END;

    CREATE TRIGGER IF NOT EXISTS validate_book_reviews_insert
    BEFORE INSERT ON book_reviews
    WHEN NEW.rating < 1 OR NEW.rating > 5 OR typeof(NEW.rating) != 'integer'
      OR length(trim(NEW.comment)) < 1 OR length(trim(NEW.comment)) > 1000
    BEGIN
      SELECT RAISE(ABORT, 'Invalid book review');
    END;

    CREATE TRIGGER IF NOT EXISTS validate_book_reviews_update
    BEFORE UPDATE OF rating, comment ON book_reviews
    WHEN NEW.rating < 1 OR NEW.rating > 5 OR typeof(NEW.rating) != 'integer'
      OR length(trim(NEW.comment)) < 1 OR length(trim(NEW.comment)) > 1000
    BEGIN
      SELECT RAISE(ABORT, 'Invalid book review');
    END;
  `);
}

export default db;
