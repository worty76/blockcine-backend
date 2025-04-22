import { Film } from "../models/film";
import { Reservation } from "../models/reservation";
import { AIRecommendation } from "../models/ai-recommendation";
import { aiApiService } from "./aiApiService";

class RecommendationService {
  /**
   * Generate recommendations for a user based on their booking history using AI API
   */
  async generateRecommendations(userId: string): Promise<void> {
    try {
      // 1. Get user's booking history
      const userReservations = await Reservation.find({
        userId,
        verified: true, // Only consider verified bookings
      }).populate("filmId");

      if (!userReservations.length) {
        return; // No bookings to base recommendations on
      }

      // 2. Extract watched movies
      const watchedMovies: any = [];
      const watchedMovieIds = new Set<string>();

      userReservations.forEach((reservation) => {
        // Handle the case where filmId is populated or just an ID
        const film = reservation.filmId as any;
        if (!film || !film._id) return;

        const movieId = film._id.toString();
        if (watchedMovieIds.has(movieId)) return; // Skip duplicates

        watchedMovieIds.add(movieId);
        watchedMovies.push({
          _id: movieId,
          name: film.name,
          genres: film.genres || [],
          description: film.description || "",
          releaseDate: film.releaseDate,
        });
      });

      // 3. Get available movies to recommend (unwatched films)
      const availableMovies: any = await Film.find({
        _id: { $nin: Array.from(watchedMovieIds) },
      }).select("_id name genres description releaseDate");

      if (!availableMovies.length) {
        return; // No unwatched movies to recommend
      }

      // 4. Call the AI API to get recommendations
      const aiRecommendations = await aiApiService.getRecommendations(
        watchedMovies,
        availableMovies
      );

      // 5. Prepare recommendations for database
      const recommendations = aiRecommendations.map((rec) => ({
        userId,
        movieId: rec.movieId,
        recommendationScore: rec.score,
        matchedGenres: [], // We'll leave this empty as the AI handles genre matching
        reasoning: rec.reasoning,
      }));

      // 6. Clear old recommendations and save new ones
      await AIRecommendation.deleteMany({ userId });
      if (recommendations.length) {
        await AIRecommendation.insertMany(recommendations);
      }
    } catch (error) {
      console.error("Error generating AI recommendations:", error);
      throw error;
    }
  }

  /**
   * Get recommendations for a user
   */
  async getRecommendations(userId: string, limit = 10) {
    try {
      // Check if recommendations exist
      const count = await AIRecommendation.countDocuments({ userId });

      // Generate recommendations if none exist
      if (count === 0) {
        await this.generateRecommendations(userId);
      }

      // Get recommendations sorted by score
      return await AIRecommendation.find({ userId })
        .sort({ recommendationScore: -1 })
        .limit(limit)
        .populate("movieId");
    } catch (error) {
      console.error("Error getting recommendations:", error);
      throw error;
    }
  }
}

export const recommendationService = new RecommendationService();
