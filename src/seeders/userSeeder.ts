import mongoose from "mongoose";
import { User } from "../models/user";
import bcrypt from "bcryptjs";

export const seedUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({});

    // Create hashed password for sample users
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Sample user data
    const users = [
      {
        name: "John Doe",
        email: "john@example.com",
        password: hashedPassword,
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        password: hashedPassword,
      },
      {
        name: "Bob Johnson",
        email: "bob@example.com",
        password: hashedPassword,
      },
      {
        name: "Sarah Williams",
        email: "sarah@example.com",
        password: hashedPassword,
      },
      {
        name: "Mike Brown",
        email: "mike@example.com",
        password: hashedPassword,
      },
    ];

    // Insert users
    await User.insertMany(users);
    console.log("Users seeded successfully");

    // Return the created users for reference in other seeders
    return await User.find();
  } catch (error) {
    console.error("Error seeding users:", error);
    throw error;
  }
};
