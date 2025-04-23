import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "../models/user";
import { uploadToCloudinary } from "../utils/imageUpload";
import { Reservation } from "../models/reservation";
import mongoose from "mongoose";

// Interface for authenticated requests
interface AuthenticatedRequest extends Request {
  userId?: string; // Added by authenticate middleware
}

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
      const avatar: string = user.avatar || "";
      res.status(200).send({ token, userId, isAdmin, avatar });
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

const getAllUsers = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Check if user is admin
    const admin = await User.findById(req.userId);
    if (!admin?.isAdmin) {
      res.status(403).send({ message: "Access denied: Admin rights required" });
      return;
    }

    // Find all users, excluding password field
    const users = await User.find().select("-password");

    res.status(200).send(users);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "An error occurred fetching users" });
  }
};

const getUserDetails = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Check if user is admin
    const admin = await User.findById(req.userId);
    if (!admin?.isAdmin) {
      res.status(403).send({ message: "Access denied: Admin rights required" });
      return;
    }

    const { userId } = req.params;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).send({ message: "Invalid user ID format" });
      return;
    }

    // Find user by ID, excluding password
    const user = await User.findById(userId).select("-password");

    if (!user) {
      res.status(404).send({ message: "User not found" });
      return;
    }

    // Get user reservations
    const reservations = await Reservation.find({ userId })
      .populate("filmId", "name img releaseDate")
      .sort({ createdAt: -1 });

    res.status(200).send({
      user,
      reservations,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send({ message: "An error occurred fetching user details" });
  }
};

const updateUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Check if user is admin
    const admin = await User.findById(req.userId);
    if (!admin?.isAdmin) {
      res.status(403).send({ message: "Access denied: Admin rights required" });
      return;
    }

    const { userId } = req.params;
    const { name, email, isAdmin } = req.body;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).send({ message: "Invalid user ID format" });
      return;
    }

    // Validate inputs
    if (!name || !email) {
      res.status(400).send({ message: "Name and email are required" });
      return;
    }

    // Check if another user already has this email
    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      res
        .status(409)
        .send({ message: "Email is already in use by another user" });
      return;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, isAdmin: Boolean(isAdmin) },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      res.status(404).send({ message: "User not found" });
      return;
    }

    res.status(200).send({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "An error occurred updating the user" });
  }
};

// Delete a user
const deleteUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Check if user is admin
    const admin = await User.findById(req.userId);
    if (!admin?.isAdmin) {
      res.status(403).send({ message: "Access denied: Admin rights required" });
      return;
    }

    const { userId } = req.params;

    // Prevent deleting yourself
    if (userId === req.userId) {
      res.status(400).send({ message: "You cannot delete your own account" });
      return;
    }

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).send({ message: "Invalid user ID format" });
      return;
    }

    // First, delete all user reservations
    await Reservation.deleteMany({ userId });

    // Then delete the user
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      res.status(404).send({ message: "User not found" });
      return;
    }

    res.status(200).send({
      message: "User and all associated reservations deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "An error occurred deleting the user" });
  }
};

export default {
  login,
  register,
  getUserProfile,
  updateAvatar,
  updatePassword,
  getAllUsers,
  getUserDetails,
  updateUser,
  deleteUser,
};
