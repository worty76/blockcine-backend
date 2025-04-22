import mongoose from "mongoose";
import { seedUsers } from "./userSeeder";
import { seedFilms } from "./filmSeeder";
import { seedReservations } from "./reservationSeeder";
import { seedPayments } from "./paymentSeeder";
import dotenv from "dotenv";

dotenv.config();

// MongoDB connection URI
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/bookapp";

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Run seeders in sequence
    const users = await seedUsers();
    const films = await seedFilms();
    const reservations = await seedReservations(users, films);
    await seedPayments(reservations);

    console.log("All data seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

// Run the seeder
seedDatabase();
