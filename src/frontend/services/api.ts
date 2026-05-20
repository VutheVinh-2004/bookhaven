const API_URL = "/api";

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));

  if (response.status === 401 || response.status === 403) {
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
  getAllAdmin: () => fetchApi("/admin/orders"),
  getStats: () => fetchApi("/admin/stats"),
  updateStatus: (id: number, status: string) => fetchApi(`/admin/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
};

export const userService = {
  getAll: () => fetchApi("/superadmin/users"),
  updateRole: (id: number, role: string) => fetchApi(`/superadmin/users/${id}/role`, { method: "PUT", body: JSON.stringify({ role }) }),
  delete: (id: number) => fetchApi(`/superadmin/users/${id}`, { method: "DELETE" }),
};
