import express from "express";
import authController from "../controllers/authController";
import upload from "../middlewares/uploadMiddleware";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/profile/:userId", authController.getUserProfile);
router.put(
  "/profile/:userId/avatar",
  upload.single("avatar"),
  authController.updateAvatar
);
router.put("/profile/:userId/password", authController.updatePassword);

export default router;
