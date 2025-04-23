import express from "express";
import statisticController from "../controllers/statisticController";
import { authenticate } from "../middlewares/authenticate";

const router = express.Router();

// All stat routes should be protected by authentication
router.use(authenticate);

// Dashboard overview statistics
router.get("/overview", statisticController.getOverviewStats);

// Top performing films
router.get("/top-films", statisticController.getTopFilms);

// Revenue data for charts
router.get("/revenue", statisticController.getRevenueData);

// Recent activities
router.get("/activities", statisticController.getRecentActivities);

export default router;
