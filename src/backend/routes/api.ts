import express from "express";
import * as authController from "../controllers/authController.ts";
import * as bookController from "../controllers/bookController.ts";
import * as orderController from "../controllers/orderController.ts";
import * as userController from "../controllers/userController.ts";
import { authenticateToken, authorizeRoles } from "../middleware/auth.ts";
import { loginRateLimit } from "../middleware/rateLimit.ts";

const router = express.Router();

router.post("/auth/register", authController.register);
router.post("/auth/login", loginRateLimit, authController.login);
router.get("/books", bookController.getAllBooks);
router.get("/books/:id", bookController.getBookById);
router.get("/categories", bookController.getAllCategories);

router.get("/auth/profile", authenticateToken, authController.getProfile);
router.put("/auth/profile", authenticateToken, authController.updateProfile);
router.get("/cart", authenticateToken, orderController.getCart);
router.post("/cart", authenticateToken, orderController.addToCart);
router.put("/cart/:id", authenticateToken, orderController.updateCartItem);
router.delete("/cart/:id", authenticateToken, orderController.removeFromCart);
router.post("/orders", authenticateToken, orderController.createOrder);
router.get("/orders/my", authenticateToken, orderController.getMyOrders);
router.get("/orders/:id", authenticateToken, orderController.getOrderDetails);

router.post("/admin/categories", authenticateToken, authorizeRoles("admin", "super_admin"), bookController.createCategory);
router.put("/admin/categories/:id", authenticateToken, authorizeRoles("admin", "super_admin"), bookController.updateCategory);
router.delete("/admin/categories/:id", authenticateToken, authorizeRoles("admin", "super_admin"), bookController.deleteCategory);
router.post("/admin/books", authenticateToken, authorizeRoles("admin", "super_admin"), bookController.createBook);
router.put("/admin/books/:id", authenticateToken, authorizeRoles("admin", "super_admin"), bookController.updateBook);
router.delete("/admin/books/:id", authenticateToken, authorizeRoles("admin", "super_admin"), bookController.deleteBook);
router.get("/admin/orders", authenticateToken, authorizeRoles("admin", "super_admin"), orderController.getAllOrders);
router.get("/admin/stats", authenticateToken, authorizeRoles("admin", "super_admin"), orderController.getAdminStats);
router.put("/admin/orders/:id/status", authenticateToken, authorizeRoles("admin", "super_admin"), orderController.updateOrderStatus);

router.get("/superadmin/users", authenticateToken, authorizeRoles("super_admin"), userController.getAllUsers);
router.put("/superadmin/users/:id/role", authenticateToken, authorizeRoles("super_admin"), userController.updateUserRole);
router.delete("/superadmin/users/:id", authenticateToken, authorizeRoles("super_admin"), userController.deleteUser);

export default router;
