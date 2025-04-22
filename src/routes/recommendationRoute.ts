import express from "express";
import {
  getRecommendations,
  refreshRecommendations,
} from "../controllers/recommendationController";
import { authenticate } from "../middlewares/authenticate";

const router = express.Router();

// Get movie recommendations based on user's booking history
router.get("/", authenticate, getRecommendations);

// Manually refresh recommendations
router.post("/refresh", authenticate, refreshRecommendations);

export default router;
