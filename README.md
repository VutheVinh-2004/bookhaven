# Book Haven

Book Haven là website bán sách trực tuyến với đăng ký/xác nhận email, giỏ hàng, đặt hàng, thanh toán QR/COD/thẻ, quản lý sách và phân quyền người dùng.

## Tính năng chính

- Đăng ký, đăng nhập và xác nhận email qua hộp thư thật.
- Tìm kiếm, xem danh mục và chi tiết sách.
- Giỏ hàng, đặt hàng và theo dõi đơn hàng.
- Thanh toán bằng QR, thanh toán khi nhận hàng và thanh toán thẻ mô phỏng.
- Trang quản trị cho admin: quản lý sách, danh mục, đơn hàng và thống kê.
- Trang super admin: quản lý tài khoản và phân quyền.

## Cài đặt

Yêu cầu: Node.js.

```bash
npm install
```

Tạo file `.env` dựa trên `.env.example`, sau đó cấu hình các biến cần thiết như `JWT_SECRET`, thông tin email gửi xác nhận và `SEED_DATABASE`.

## Chạy dự án

```bash
npm run dev
```

Ứng dụng mặc định chạy tại:

```text
http://localhost:3000
```

## Seed dữ liệu

Nếu database chưa có dữ liệu, đặt trong `.env`:

```env
SEED_DATABASE=true
```

Sau khi đã seed xong, có thể đổi lại:

```env
SEED_DATABASE=false
```

## Tài khoản mẫu

```text
user@example.com / password123
admin@example.com / password123
superadmin@example.com / password123
```

## Lệnh hữu ích

```bash
npm run dev
npm run build
npm run typecheck
```

## Ghi chú

- Không commit file `.env`, database local, `node_modules` hoặc `dist`.
- QR thanh toán nằm trong thư mục `public`.
- Khi đổi cấu hình email, hãy khởi động lại server để áp dụng biến môi trường mới.
