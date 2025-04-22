import { Request, Response } from "express";
import { Reservation, IReservation } from "../models/reservation";
import { Block } from "../models/blockchain";
import ethereumService from "../services/ethereumService";

// Create a new reservation
const createReservation = async (req: Request, res: Response) => {
  try {
    const { userId, filmId, seatNumber, blockchainVerified } = req.body;

    // Check if seat is already reserved
    const existingReservation = await Reservation.findOne({
      filmId,
      seatNumber,
      // Only consider verified reservations or non-expired pending ones
      $or: [{ verified: true }, { expiresAt: { $gt: new Date() } }],
    });

    if (existingReservation) {
      return res.status(400).json({
        message: "This seat is already reserved",
      });
    }

    // Create reservation with 15 minutes expiration time if not verified
    const expiresAt = blockchainVerified
      ? undefined
      : new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    const reservation = new Reservation({
      userId,
      filmId,
      seatNumber,
      verified: blockchainVerified || false,
      expiresAt: expiresAt,
    });

    // If this reservation was already verified on blockchain, record it
    if (blockchainVerified) {
      reservation.verified = true;
    }

    await reservation.save();

    // Return the saved reservation
    res.status(201).json(reservation);
  } catch (error) {
    console.error("Error creating reservation:", error);
    res.status(500).json({ message: "Failed to create reservation" });
  }
};

// Get all reservations for a film
const getReservationsByFilm = async (req: Request, res: Response) => {
  try {
    const { filmId } = req.params;
    const reservations = await Reservation.find({ filmId });
    res.status(200).json(reservations);
  } catch (error) {
    console.error("Error fetching reservations:", error);
    res.status(500).json({ message: "Failed to fetch reservations" });
  }
};

// Verify a ticket on the blockchain
const verifyTicket = async (req: Request, res: Response) => {
  try {
    const { filmId, userId, seatNumber } = req.params;
    console.log(
      `Verifying ticket - Film: ${filmId}, User: ${userId}, Seat: ${seatNumber}`
    );

    // First check if the reservation exists in our database
    const reservation = await Reservation.findOne({
      filmId,
      userId,
      seatNumber: Number(seatNumber),
    });

    if (!reservation) {
      console.log("Reservation not found in database");
      return res.status(404).json({
        verified: false,
        message: "Reservation not found",
      });
    }

    // If already verified in our database, return success
    if (reservation.verified) {
      console.log("Reservation already verified in database");
      return res.status(200).json({ verified: true });
    }

    let verified = false;

    // Try to verify through the blockchain
    try {
      // Get the latest block that might contain our reservation
      const latestBlocks = await Block.find().sort({ index: -1 }).limit(10);

      // Check if this transaction is recorded in any recent block
      for (const block of latestBlocks) {
        const transaction = block.transactions.find(
          (tx) =>
            tx.filmId === filmId &&
            tx.userId === userId &&
            tx.seatNumber === Number(seatNumber)
        );

        if (transaction) {
          // Transaction found in our blockchain
          verified = true;
          // Save the block index for reference
          reservation.blockIndex = block.index;
          break;
        }
      }

      // If not found in our blockchain, try Ethereum verification
      if (!verified && ethereumService) {
        try {
          console.log("Attempting Ethereum verification");
          verified = await ethereumService.verifyReservation(
            filmId,
            userId,
            Number(seatNumber)
          );
          console.log(`Ethereum verification result: ${verified}`);
        } catch (ethError) {
          console.error("Ethereum verification error:", ethError);
        }
      }
    } catch (blockchainError) {
      console.error("Blockchain verification error:", blockchainError);
    }

    // Update reservation if it's verified
    if (verified) {
      reservation.verified = true;
      await reservation.save();
    }

    res.status(200).json({ verified });
  } catch (error) {
    console.error("Error verifying ticket:", error);
    res.status(500).json({
      verified: false,
      message: "Failed to verify ticket",
    });
  }
};

// Get all reservations for a user
const getReservationsByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Clean up expired reservations first
    await cleanupExpiredReservations();

    // Get all user's reservations (including expired ones for history)
    const reservations = await Reservation.find({ userId: userId })
      .populate("filmId", "name img") // Populate film details with name instead of title
      .sort({ createdAt: -1 });

    // Map to include film name in response
    const enhancedReservations = reservations.map((reservation) => {
      // Safely extract film name if populated
      const film = reservation.filmId as any;
      const filmTitle =
        film && typeof film === "object" && film.name ? film.name : undefined;

      return {
        ...reservation.toObject(),
        filmTitle, // We'll keep the property name as filmTitle for consistency in frontend
      };
    });

    res.status(200).json(enhancedReservations);
  } catch (error) {
    console.error("Error fetching user reservations:", error);
    res.status(500).json({ message: "Failed to fetch reservations" });
  }
};

// Process payment and verify a reservation
const processPayment = async (req: Request, res: Response) => {
  try {
    const { reservationId } = req.params;
    const { paymentDetails } = req.body;

    // Find the reservation
    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // Check if reservation is already expired
    if (reservation.expiresAt && new Date(reservation.expiresAt) < new Date()) {
      return res.status(400).json({
        message: "This reservation has expired. Please make a new reservation.",
      });
    }

    // Check if already verified
    if (reservation.verified) {
      return res.status(200).json({
        message: "This reservation is already verified",
        reservation,
      });
    }

    // Simulate payment processing
    // In a real app, you would integrate with a payment gateway here
    // const paymentSuccessful = await paymentGateway.processPayment(paymentDetails);

    // For demo purposes, we'll assume payment was successful
    const paymentSuccessful = true;

    if (paymentSuccessful) {
      // Update reservation
      reservation.verified = true;
      reservation.expiresAt = null as any; // Set to null instead of undefined, with type assertion

      // Save updated reservation
      await reservation.save();

      // Return success
      return res.status(200).json({
        success: true,
        message: "Payment successful and ticket verified",
        reservation,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Payment processing failed",
      });
    }
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ message: "Failed to process payment" });
  }
};

// Utility function to clean up expired reservations
const cleanupExpiredReservations = async () => {
  try {
    // Find all expired and unverified reservations
    const result = await Reservation.deleteMany({
      verified: false,
      expiresAt: { $lt: new Date() },
    });

    console.log(`Cleaned up ${result.deletedCount} expired reservations`);
  } catch (error) {
    console.error("Error cleaning up expired reservations:", error);
  }
};

// Endpoint to manually trigger cleanup (could be used by an admin or cron job)
const triggerCleanup = async (req: Request, res: Response) => {
  try {
    await cleanupExpiredReservations();
    res.status(200).json({ message: "Cleanup completed successfully" });
  } catch (error) {
    console.error("Error triggering cleanup:", error);
    res.status(500).json({ message: "Failed to trigger cleanup" });
  }
};

export default {
  createReservation,
  getReservationsByFilm,
  verifyTicket,
  getReservationsByUser,
  processPayment,
  triggerCleanup,
};
