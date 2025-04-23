import express from "express";
import authController from "../controllers/authController";
import upload from "../middlewares/uploadMiddleware";
import { authenticate } from "../middlewares/authenticate";

const router = express.Router();

// Existing routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/profile/:userId", authController.getUserProfile);
router.put(
  "/profile/:userId/avatar",
  upload.single("avatar"),
  authController.updateAvatar
);
router.put("/profile/:userId/password", authController.updatePassword);

// New admin routes for user management
router.get("/users", authenticate, authController.getAllUsers);
router.get("/users/:userId", authenticate, authController.getUserDetails);
router.put("/users/:userId", authenticate, authController.updateUser);
router.delete("/users/:userId", authenticate, authController.deleteUser);

export default router;
