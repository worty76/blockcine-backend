import mongoose from "mongoose";

const aiRecommendationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Film",
    required: true,
  },
  basedOnMovieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Film",
  },
  matchedGenres: [String],
  recommendationScore: { type: Number, required: true },
  reasoning: { type: String }, // Added reasoning field from AI
  createdAt: { type: Date, default: Date.now },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  }, // 30 days expiry
});

// Compound index for finding recommendations for a user
aiRecommendationSchema.index({ userId: 1, recommendationScore: -1 });

export const AIRecommendation = mongoose.model(
  "AIRecommendation",
  aiRecommendationSchema
);
