import { Reservation } from "../models/reservation";

export const seedReservations = async (users: any[], films: any[]) => {
  try {
    // Clear existing reservations
    await Reservation.deleteMany({});

    // Create sample reservations
    const reservations = [];

    // For each user, create 1-2 random reservations
    for (const user of users) {
      const numReservations = Math.floor(Math.random() * 2) + 1;

      for (let i = 0; i < numReservations; i++) {
        // Randomly select a film
        const randomFilm = films[Math.floor(Math.random() * films.length)];

        // Generate a random seat number
        const seatNumber =
          Math.floor(Math.random() * randomFilm.seatQuantity) + 1;

        reservations.push({
          filmId: randomFilm._id,
          userId: user._id.toString(),
          seatNumber: seatNumber,
        });
      }
    }

    // Insert reservations
    await Reservation.insertMany(reservations);
    console.log("Reservations seeded successfully");

    // Return the created reservations for reference in other seeders
    return await Reservation.find();
  } catch (error) {
    console.error("Error seeding reservations:", error);
    throw error;
  }
};
