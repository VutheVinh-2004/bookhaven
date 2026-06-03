# BookHaven

BookHaven là ứng dụng bán sách trực tuyến full-stack, hỗ trợ người dùng tìm kiếm sách, quản lý giỏ hàng, đặt hàng, thanh toán mô phỏng và theo dõi trạng thái đơn hàng. Hệ thống có khu vực quản trị dành cho admin và super admin.

## Công nghệ sử dụng

### Frontend

- React 19 và TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide React
- Recharts

### Backend

- Node.js và Express
- TypeScript
- SQLite với `better-sqlite3`
- JWT cho xác thực
- bcryptjs để mã hóa mật khẩu
- Nodemailer để gửi email xác nhận

## Tính năng chính

### Người dùng

- Đăng ký, đăng nhập và xác nhận email.
- Quên mật khẩu và đặt lại mật khẩu bằng mã OTP gửi qua Gmail.
- Tìm kiếm, lọc theo danh mục và xem chi tiết sách.
- Thêm sách vào giỏ hàng, thay đổi số lượng và đặt hàng.
- Chọn thanh toán khi nhận hàng hoặc thanh toán thẻ mô phỏng.
- Xem lịch sử, chi tiết và hủy đơn hàng chưa thanh toán trước khi giao.
- Cập nhật thông tin cá nhân và mật khẩu.

### Admin

- Quản lý sách và danh mục.
- Quản lý trạng thái đơn hàng theo đúng luồng xử lý.
- Chỉ giao đơn thanh toán online sau khi đơn đã được thanh toán.
- Xem thống kê doanh thu dựa trên số tiền đã thanh toán.
- Quản lý vai trò người dùng.
- Vô hiệu hóa và khôi phục tài khoản mà không làm mất lịch sử đơn hàng.

## Luồng đơn hàng

```text
Chờ xử lý -> Đang đóng gói -> Đang giao -> Đã giao
     |              |
     +----------> Đã hủy
```

- Đơn thanh toán thẻ phải được thanh toán trước khi chuyển sang trạng thái giao hàng.
- Đơn COD được ghi nhận đã thanh toán khi giao thành công.
- Doanh thu chỉ tính các đơn có trạng thái thanh toán `paid`.

## Cài đặt

Yêu cầu: Node.js 20 trở lên.

```bash
npm install
```

Tạo file `.env` dựa trên `.env.example`, sau đó cấu hình các biến cần thiết:

```env
PORT=3000
JWT_SECRET=change-this-to-a-random-secret-at-least-32-characters-long
SEED_DATABASE=true
FRONTEND_URL=http://localhost:3000
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-gmail-app-password
```

Không sử dụng giá trị `JWT_SECRET` mẫu trong môi trường production.

## Chạy dự án

```bash
npm run dev
```

Ứng dụng mặc định chạy tại:

```text
http://localhost:3000
```

## Tài khoản mẫu

Khi `SEED_DATABASE=true`, có thể sử dụng:

```text
user@example.com / password123
admin@example.com / password123
```

## Thanh toán thẻ mô phỏng

```text
Số thẻ: 9704000000000018
Chủ thẻ: NGUYEN VAN A
Ngày hết hạn: 12/30
CVV: 123
OTP: 123456
```

Đây chỉ là luồng thanh toán phục vụ demo, không kết nối cổng thanh toán thực tế.

## Kiểm tra chất lượng

```bash
npm run typecheck
npm run build
```

## Lưu ý

- Không commit `.env`, database local, `node_modules` hoặc `dist`.
- Đổi `SEED_DATABASE=false` sau khi đã seed dữ liệu cần thiết.
- Khởi động lại server sau khi thay đổi cấu hình email hoặc biến môi trường.
