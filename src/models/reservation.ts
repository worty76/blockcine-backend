import mongoose, { Schema, Document } from "mongoose";

// Define the interface for Reservation
export interface IReservation extends Document {
  userId:
    | string
    | { _id: string; name?: string; avatar?: string; email?: string };
  filmId: string | { _id: string; name?: string; img?: string }; // Match film model structure
  seatNumber: number;
  verified: boolean;
  blockIndex?: number;
  createdAt: Date;
  expiresAt?: Date; // Make expiration timestamp optional
}

// Create the schema
const reservationSchema = new Schema<IReservation>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  filmId: {
    type: Schema.Types.ObjectId,
    ref: "Film", // Reference to Film model
    required: true,
  },
  seatNumber: { type: Number, required: true },
  verified: { type: Boolean, default: false },
  blockIndex: { type: Number },
  createdAt: { type: Date, default: Date.now },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 15 * 60 * 1000),
    required: false, // Make it optional
  }, // 15 minutes from now
});

// Create a compound index to ensure uniqueness of filmId + seatNumber combination
reservationSchema.index({ filmId: 1, seatNumber: 1 }, { unique: true });

// Export the model
export const Reservation = mongoose.model<IReservation>(
  "Reservation",
  reservationSchema
);
