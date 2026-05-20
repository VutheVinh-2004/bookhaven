# BookHaven - bản đã sửa

## Cách chạy

```bash
npm install
npm run dev
```

Nếu database chưa có dữ liệu, file `.env` đang để `SEED_DATABASE=true` để tự seed dữ liệu mẫu.
Sau khi đã có dữ liệu, có thể đổi thành:

```env
SEED_DATABASE=false
```

## Tài khoản mẫu

- user@example.com / password123
- admin@example.com / password123
- superadmin@example.com / password123

## Các phần đã sửa chính

- Bỏ JWT secret mặc định yếu, yêu cầu secret đủ mạnh trong `.env`.
- Thêm validate cho đăng ký, đăng nhập, profile, sách, danh mục, giỏ hàng, đơn hàng, user role.
- Chuẩn hóa response API: `{ success, message, data }`.
- Frontend service đã tự unwrap `data` nên các page cũ vẫn dùng được.
- Thêm rate limit đăng nhập đơn giản chống brute force.
- CORS giới hạn bằng biến `CORS_ORIGIN`.
- Không tự seed DB trừ khi `SEED_DATABASE=true`.
- Không xóa `order_items` khi xóa sách, tránh phá dữ liệu lịch sử đơn hàng.
- Thêm `.gitignore` bỏ database, node_modules, dist, .env.
- Đổi tên package thành `bookhaven-online-bookstore`.
