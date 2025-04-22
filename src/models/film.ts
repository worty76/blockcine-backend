import mongoose from "mongoose";

const filmSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  seatQuantity: { type: Number, required: true },
  img: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true }, // Duration in minutes
  releaseDate: { type: Date, required: true },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  genres: {
    type: [String],
    required: true,
    enum: [
      "Action",
      "Fantasy",
      "Horror",
      "Thriller",
      "Drama",
      "Science Fiction",
      "Comedy",
      "Mystery",
      "Adventure",
      "Animated",
      "Crime",
      "Historical",
      "Film Noir",
      "Psychological Thriller",
      "Sports",
      "Comic Science Fiction",
      "Dark Comedy",
      "Dark Fantasy",
      "Disaster Film",
      "Documentary",
      "High Fantasy",
    ],
  },
  createdAt: { type: Date, default: Date.now },
});

export const Film = mongoose.model("Film", filmSchema);
