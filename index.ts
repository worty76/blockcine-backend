import express, { Express, Request, Response, Application } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import fs from "fs";
import path from "path";
import filmRoute from "./src/routes/filmRoute";
import authRoute from "./src/routes/authRoute";
import reservationRoute from "./src/routes/reservationRoute";
import recommendationRoute from "./src/routes/recommendationRoute";
import statsRoute from "./src/routes/statisticRoute";

dotenv.config();

const app: Application = express();
const port = process.env.PORT || 8000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI as string)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/film", filmRoute);
app.use("/api/auth", authRoute);
app.use("/api/reservations", reservationRoute);
app.use("/api/recommendations", recommendationRoute);
app.use("/api/statistics", statsRoute);

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to Express & TypeScript Server");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
