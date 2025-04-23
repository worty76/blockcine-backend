import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "../models/user";
import { uploadToCloudinary } from "../utils/imageUpload";

const JWT_SECRET = "secret_key"; // Better to move to environment variables

const createToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET);
};

const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;
  try {
    // Check if user exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(409).send({
        message: "Email is already in use",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).send({
      message: "Registration successful",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "An error occurred during registration" });
  }
};

const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).send({
        message: "Email not registered",
      });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      const token: string = createToken(user._id.toString());
      const userId: string = user._id.toString();
      const isAdmin: boolean = user.isAdmin || false;
      res.status(200).send({ token, userId, isAdmin });
    } else {
      res.status(401).send({
        message: "Incorrect password",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "An error occurred during login" });
  }
};

// Get user profile details
const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user ID from token (assuming middleware has verified the token)
    const userId = req.params.userId || (req as any).userId;

    if (!userId) {
      res.status(401).send({ message: "Authentication required" });
      return;
    }

    // Find user by ID but exclude the password field
    const user = await User.findById(userId).select("-password");

    if (!user) {
      res.status(404).send({ message: "User not found" });
      return;
    }

    res.status(200).send({ user });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send({ message: "An error occurred fetching user profile" });
  }
};

// Update user's avatar
const updateAvatar = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;

    if (!req.file) {
      res.status(400).send({ message: "No image file provided" });
      return;
    }

    // Upload to Cloudinary
    const avatarUrl = await uploadToCloudinary(req.file.path);

    // Find and update the user's avatar
    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true } // Return the updated document
    ).select("-password");

    if (!user) {
      res.status(404).send({ message: "User not found" });
      return;
    }

    res.status(200).send({
      message: "Avatar updated successfully",
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "An error occurred updating the avatar" });
  }
};

// Update user password
const updatePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const { currentPassword, newPassword } = req.body;

    // Input validation
    if (!currentPassword || !newPassword) {
      res
        .status(400)
        .send({ message: "Current password and new password are required" });
      return;
    }

    // Password strength validation
    if (newPassword.length < 6) {
      res
        .status(400)
        .send({ message: "New password must be at least 6 characters long" });
      return;
    }

    // Find the user with password
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).send({ message: "User not found" });
      return;
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      res.status(401).send({ message: "Current password is incorrect" });
      return;
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update with new password
    await User.findByIdAndUpdate(userId, { password: hashedNewPassword });

    res.status(200).send({
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send({ message: "An error occurred updating the password" });
  }
};

export default {
  login,
  register,
  getUserProfile,
  updateAvatar,
  updatePassword,
};
