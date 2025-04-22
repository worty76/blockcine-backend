import express from "express";
import reservationController from "../controllers/reservationController";

const router = express.Router();

// Create a new reservation
router.post("/", reservationController.createReservation);

// Get all reservations for a film
router.get("/film/:filmId", reservationController.getReservationsByFilm);

// Verify a ticket
router.get(
  "/verify/:filmId/:userId/:seatNumber",
  reservationController.verifyTicket
);

// Get all reservations for a user
router.get("/:userId", reservationController.getReservationsByUser);

// Process payment for a reservation
router.post("/payment/:reservationId", reservationController.processPayment);

// Manually trigger cleanup of expired reservations
router.post("/cleanup", reservationController.triggerCleanup);

export default router;
