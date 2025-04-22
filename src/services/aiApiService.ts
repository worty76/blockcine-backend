import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// For Gemini API or similar
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_API_URL =
  process.env.AI_API_URL ||
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

interface FilmData {
  _id: string;
  name: string;
  genres: string[];
  description: string;
  releaseDate: Date;
}

interface AIRecommendationResponse {
  movieId: string;
  score: number;
  reasoning: string;
}

class AiApiService {
  async getRecommendations(
    userWatchedFilms: FilmData[],
    availableFilms: FilmData[]
  ): Promise<AIRecommendationResponse[]> {
    try {
      // Structure data for the AI to analyze
      const prompt = this.constructPrompt(userWatchedFilms, availableFilms);

      // Call the AI API (Gemini in this example)
      const response = await axios.post(
        `${AI_API_URL}?key=${AI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 32,
            topP: 1,
            maxOutputTokens: 4096,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Parse the AI response
      return this.parseAiResponse(response.data, availableFilms);
    } catch (error) {
      console.error("Error calling AI API:", error);
      throw new Error("Failed to get AI recommendations");
    }
  }

  private constructPrompt(
    userWatchedFilms: FilmData[],
    availableFilms: FilmData[]
  ): string {
    return `
You are a movie recommendation expert. Based on a user's watch history, recommend similar movies they might enjoy.

USER'S WATCH HISTORY:
${userWatchedFilms
  .map(
    (film) =>
      `- "${film.name}" (${film.genres.join(", ")}): ${film.description}`
  )
  .join("\n")}

AVAILABLE MOVIES TO RECOMMEND:
${availableFilms
  .map(
    (film, index) =>
      `[${index}] "${film.name}" (${film.genres.join(", ")}): ${
        film.description
      }`
  )
  .join("\n")}

Based on the user's watch history, recommend the most suitable movies from the available list.
For each recommendation, provide:
1. The movie index number
2. A score from 0-100 indicating how strongly you recommend it
3. A brief explanation of why you think they would enjoy it based on their watch history and genre preferences

Format your response as a valid JSON array with objects containing:
{
  "movieIndex": number,
  "score": number,
  "reasoning": "string"
}

Only include the JSON array in your response, with no other text or explanation.
`;
  }

  private parseAiResponse(
    response: any,
    availableFilms: FilmData[]
  ): AIRecommendationResponse[] {
    try {
      // Extract the text response from the AI
      const responseText = response.candidates[0].content.parts[0].text;
      console.log("AI Response:", responseText);

      // Remove Markdown code block formatting if present
      let cleanedResponse = responseText;

      // Check if the response is wrapped in a code block
      if (responseText.trim().startsWith("```")) {
        const codeBlockMatch = responseText.match(
          /```(?:json)?\s*([\s\S]*?)```/
        );
        if (codeBlockMatch && codeBlockMatch[1]) {
          cleanedResponse = codeBlockMatch[1].trim();
        } else {
          // If the regex doesn't match but we know it starts with ```, just remove that part
          cleanedResponse = responseText
            .replace(/```json\s*/, "")
            .replace(/```\s*$/, "")
            .trim();
        }
      }

      console.log("Cleaned response for parsing:", cleanedResponse);

      // Parse the JSON response
      const parsedResponse = JSON.parse(cleanedResponse);

      // Validate response structure before proceeding
      if (!Array.isArray(parsedResponse)) {
        throw new Error("AI response is not an array");
      }

      // Map the indexes to actual movie IDs, with bounds checking
      return parsedResponse.map((item: any) => {
        const index = typeof item.movieIndex === "number" ? item.movieIndex : 0;

        // Safety check to ensure the index is within bounds
        if (index < 0 || index >= availableFilms.length) {
          console.warn(`Movie index ${index} is out of bounds`);
          // Return first available movie with a note in the reasoning
          return {
            movieId: availableFilms[0]._id,
            score: item.score || 50,
            reasoning: `${
              item.reasoning || ""
            } (Note: Original movie index was out of bounds)`,
          };
        }

        return {
          movieId: availableFilms[index]._id,
          score: item.score || 50,
          reasoning:
            item.reasoning || "Recommended based on your viewing history",
        };
      });
    } catch (error) {
      console.error("Error parsing AI response:", error);

      // Fallback: if we can't parse the response, provide simple recommendations
      // based on genre matching as a backup strategy
      if (availableFilms.length > 0) {
        return availableFilms.slice(0, 5).map((film, index) => ({
          movieId: film._id,
          score: 100 - index * 10,
          reasoning: `This movie features genres you might enjoy based on your watch history.`,
        }));
      }

      return [];
    }
  }
}

export const aiApiService = new AiApiService();
