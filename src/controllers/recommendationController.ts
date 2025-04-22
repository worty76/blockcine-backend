import { Request, Response } from "express";
import { recommendationService } from "../services/recommendationService";

// Define interface for Request with optional userId property
interface AuthenticatedRequest extends Request {
  userId?: string; // Make userId optional
}

export const getRecommendations = async (req: Request, res: Response) => {
  try {
    // Use type assertion to access userId
    const userId = (req as AuthenticatedRequest).userId;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const recommendations = await recommendationService.getRecommendations(
      userId,
      limit
    );

    return res.status(200).json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get recommendations",
    });
  }
};

export const refreshRecommendations = async (req: Request, res: Response) => {
  try {
    // Use type assertion to access userId
    const userId = (req as AuthenticatedRequest).userId;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    await recommendationService.generateRecommendations(userId);

    return res.status(200).json({
      success: true,
      message: "Recommendations refreshed successfully",
    });
  } catch (error) {
    console.error("Error refreshing recommendations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to refresh recommendations",
    });
  }
};
