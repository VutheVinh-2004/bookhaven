const API_URL = "/api";
const API_TIMEOUT_MS = 10000;

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, { ...options, headers, signal: options.signal || controller.signal });
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error("Máy chủ phản hồi quá lâu. Vui lòng khởi động lại server rồi thử lại.");
    }
    throw new Error("Không thể kết nối đến máy chủ. Vui lòng kiểm tra server đang chạy rồi thử lại.");
  } finally {
    window.clearTimeout(timeoutId);
  }

  const payload = await response.json().catch(() => ({}));

  if (response.status === 401) {
    localStorage.removeItem("token");
  }

  if (!response.ok || payload.success === false) {
    const error: any = new Error(payload.message || "Có lỗi xảy ra");
    error.errors = payload.errors;
    throw error;
  }

  return Object.prototype.hasOwnProperty.call(payload, "data") ? payload.data : payload;
};

export const authService = {
  login: (credentials: any) => fetchApi("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  register: (userData: any) => fetchApi("/auth/register", { method: "POST", body: JSON.stringify(userData) }),
  resendVerification: (email: string) => fetchApi("/auth/resend-verification", { method: "POST", body: JSON.stringify({ email }) }),
  forgotPassword: (email: string) => fetchApi("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (data: { email: string; otp: string; newPassword: string }) => fetchApi("/auth/reset-password", { method: "POST", body: JSON.stringify(data) }),
  verifyEmail: (token: string) => fetchApi("/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) }),
  rejectEmail: (token: string) => fetchApi("/auth/reject-email", { method: "POST", body: JSON.stringify({ token }) }),
  getProfile: () => fetchApi("/auth/profile"),
  updateProfile: (data: any) => fetchApi("/auth/profile", { method: "PUT", body: JSON.stringify(data) }),
};

export const bookService = {
  getAll: (params: string = "") => fetchApi(`/books${params}`),
  getById: (id: string) => fetchApi(`/books/${id}`),
  getCategories: () => fetchApi("/categories"),
  createCategory: (data: any) => fetchApi("/admin/categories", { method: "POST", body: JSON.stringify(data) }),
  updateCategory: (id: number, data: any) => fetchApi(`/admin/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCategory: (id: number) => fetchApi(`/admin/categories/${id}`, { method: "DELETE" }),
  create: (data: any) => fetchApi("/admin/books", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchApi(`/admin/books/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi(`/admin/books/${id}`, { method: "DELETE" }),
};

export const reviewService = {
  getByBook: (bookId: string) => fetchApi(`/books/${bookId}/reviews`),
  getEligibility: (bookId: string) => fetchApi(`/books/${bookId}/reviews/eligibility`),
  save: (bookId: string, data: { rating: number; comment: string }) =>
    fetchApi(`/books/${bookId}/reviews`, { method: "POST", body: JSON.stringify(data) }),
  remove: (bookId: string) => fetchApi(`/books/${bookId}/reviews`, { method: "DELETE" }),
};

export const couponService = {
  apply: (code: string) => fetchApi("/coupons/apply", { method: "POST", body: JSON.stringify({ code }) }),
  adminList: () => fetchApi("/admin/coupons"),
  adminCreate: (data: any) => fetchApi("/admin/coupons", { method: "POST", body: JSON.stringify(data) }),
  adminUpdate: (id: number, data: any) => fetchApi(`/admin/coupons/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  adminDelete: (id: number) => fetchApi(`/admin/coupons/${id}`, { method: "DELETE" }),
};

export const cartService = {
  get: () => fetchApi("/cart"),
  add: (bookId: number, quantity: number = 1) => fetchApi("/cart", { method: "POST", body: JSON.stringify({ book_id: bookId, quantity }) }),
  update: (id: number, quantity: number) => fetchApi(`/cart/${id}`, { method: "PUT", body: JSON.stringify({ quantity }) }),
  remove: (id: number) => fetchApi(`/cart/${id}`, { method: "DELETE" }),
};

export const orderService = {
  create: (data: any) => fetchApi("/orders", { method: "POST", body: JSON.stringify(data) }),
  getMyOrders: () => fetchApi("/orders/my"),
  getDetails: (id: string) => fetchApi(`/orders/${id}`),
  payTest: (id: string | number) => fetchApi(`/orders/${id}/pay-test`, { method: "POST" }),
  cancel: (id: string | number) => fetchApi(`/orders/${id}/cancel`, { method: "PUT" }),
  getAllAdmin: () => fetchApi("/admin/orders"),
  getStats: (period: "7d" | "30d" | "12m" = "7d") => fetchApi(`/admin/stats?period=${period}`),
  updateStatus: (id: number, status: string) => fetchApi(`/admin/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
};

export const userService = {
  getAll: (status: "all" | "active" | "inactive" = "all") => fetchApi(`/admin/users?status=${status}`),
  updateRole: (id: number, role: string) => fetchApi(`/admin/users/${id}/role`, { method: "PUT", body: JSON.stringify({ role }) }),
  reactivate: (id: number) => fetchApi(`/admin/users/${id}/reactivate`, { method: "PUT" }),
  delete: (id: number) => fetchApi(`/admin/users/${id}`, { method: "DELETE" }),
};
