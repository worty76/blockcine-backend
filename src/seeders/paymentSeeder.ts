import { Payment } from "../models/payment";
import { Film } from "../models/film";

export const seedPayments = async (reservations: any[]) => {
  try {
    // Clear existing payments
    await Payment.deleteMany({});

    const payments = [];

    // Create a payment for each reservation
    for (const reservation of reservations) {
      // Get the film to retrieve its price
      const film = await Film.findById(reservation.filmId);

      if (!film) continue;

      // Generate random payment method
      const paymentMethods = ["Credit Card", "PayPal", "Bank Transfer"];
      const randomMethod =
        paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

      // Generate random status with higher probability of success
      const statuses = ["Success", "Success", "Success", "Failed", "Pending"];
      const randomStatus =
        statuses[Math.floor(Math.random() * statuses.length)];

      // Generate a random transaction ID
      const transactionId =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

      payments.push({
        ticketId: reservation._id,
        userId: reservation.userId,
        amount: film.price,
        paymentMethod: randomMethod,
        status: randomStatus,
        transactionId: transactionId,
      });
    }

    // Insert payments
    await Payment.insertMany(payments);
    console.log("Payments seeded successfully");
  } catch (error) {
    console.error("Error seeding payments:", error);
    throw error;
  }
};
