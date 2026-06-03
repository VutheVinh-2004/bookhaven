import express from "express";
import * as authController from "../controllers/authController.ts";
import * as bookController from "../controllers/bookController.ts";
import * as orderController from "../controllers/orderController.ts";
import * as reviewController from "../controllers/reviewController.ts";
import * as userController from "../controllers/userController.ts";
import { authenticateToken, authorizeRoles } from "../middleware/auth.ts";
import { loginRateLimit, passwordResetRateLimit } from "../middleware/rateLimit.ts";

const router = express.Router();

router.post("/auth/register", authController.register);
router.post("/auth/login", loginRateLimit, authController.login);
router.post("/auth/resend-verification", authController.resendVerificationEmail);
router.post("/auth/forgot-password", passwordResetRateLimit, authController.requestPasswordReset);
router.post("/auth/reset-password", authController.resetPasswordWithOtp);
router.post("/auth/verify-email", authController.verifyEmail);
router.post("/auth/reject-email", authController.rejectEmail);
router.get("/books", bookController.getAllBooks);
router.get("/books/:id", bookController.getBookById);
router.get("/books/:id/reviews", reviewController.getBookReviews);
router.get("/categories", bookController.getAllCategories);

router.get("/auth/profile", authenticateToken, authController.getProfile);
router.put("/auth/profile", authenticateToken, authController.updateProfile);
router.get("/cart", authenticateToken, orderController.getCart);
router.post("/cart", authenticateToken, orderController.addToCart);
router.put("/cart/:id", authenticateToken, orderController.updateCartItem);
router.delete("/cart/:id", authenticateToken, orderController.removeFromCart);
router.post("/orders", authenticateToken, orderController.createOrder);
router.get("/orders/my", authenticateToken, orderController.getMyOrders);
router.post("/orders/:id/pay-test", authenticateToken, orderController.payOrderTest);
router.put("/orders/:id/cancel", authenticateToken, orderController.cancelMyOrder);
router.get("/orders/:id", authenticateToken, orderController.getOrderDetails);
router.get("/books/:id/reviews/eligibility", authenticateToken, reviewController.getMyReviewEligibility);
router.post("/books/:id/reviews", authenticateToken, reviewController.upsertMyReview);
router.delete("/books/:id/reviews", authenticateToken, reviewController.deleteMyReview);

router.post("/admin/categories", authenticateToken, authorizeRoles("admin"), bookController.createCategory);
router.put("/admin/categories/:id", authenticateToken, authorizeRoles("admin"), bookController.updateCategory);
router.delete("/admin/categories/:id", authenticateToken, authorizeRoles("admin"), bookController.deleteCategory);
router.post("/admin/books", authenticateToken, authorizeRoles("admin"), bookController.createBook);
router.put("/admin/books/:id", authenticateToken, authorizeRoles("admin"), bookController.updateBook);
router.delete("/admin/books/:id", authenticateToken, authorizeRoles("admin"), bookController.deleteBook);
router.get("/admin/orders", authenticateToken, authorizeRoles("admin"), orderController.getAllOrders);
router.get("/admin/stats", authenticateToken, authorizeRoles("admin"), orderController.getAdminStats);
router.put("/admin/orders/:id/status", authenticateToken, authorizeRoles("admin"), orderController.updateOrderStatus);
router.get("/admin/users", authenticateToken, authorizeRoles("admin"), userController.getAllUsers);
router.put("/admin/users/:id/role", authenticateToken, authorizeRoles("admin"), userController.updateUserRole);
router.put("/admin/users/:id/reactivate", authenticateToken, authorizeRoles("admin"), userController.reactivateUser);
router.delete("/admin/users/:id", authenticateToken, authorizeRoles("admin"), userController.deleteUser);

export default router;
