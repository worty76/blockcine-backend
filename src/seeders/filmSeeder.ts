import { Film } from "../models/film";
import mongoose from "mongoose";

export const seedFilms = async () => {
  try {
    // Clear existing films
    await Film.deleteMany({});
    console.log("Deleted existing films");

    // Create a default author ID (you would typically use a real user ID)
    const defaultAuthorId = new mongoose.Types.ObjectId();

    // Sample film data
    const films = [
      {
        name: "Avengers: Endgame",
        price: 12.99,
        seatQuantity: 100,
        img: "https://example.com/images/avengers.jpg",
        description:
          "After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more to reverse Thanos' actions and restore balance to the universe.",
        duration: 181, // 3 hours and 1 minute
        releaseDate: new Date("2019-04-26"),
        author: defaultAuthorId,
        genres: ["Action", "Adventure", "Science Fiction"],
      },
      {
        name: "Joker",
        price: 10.99,
        seatQuantity: 80,
        img: "https://example.com/images/joker.jpg",
        description:
          "In Gotham City, mentally troubled comedian Arthur Fleck is disregarded and mistreated by society. He then embarks on a downward spiral of revolution and bloody crime. This path brings him face-to-face with his alter-ego: the Joker.",
        duration: 122, // 2 hours and 2 minutes
        releaseDate: new Date("2019-10-04"),
        author: defaultAuthorId,
        genres: ["Crime", "Drama", "Thriller"],
      },
      {
        name: "Parasite",
        price: 11.5,
        seatQuantity: 60,
        img: "https://example.com/images/parasite.jpg",
        description:
          "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
        duration: 132, // 2 hours and 12 minutes
        releaseDate: new Date("2019-05-30"),
        author: defaultAuthorId,
        genres: ["Drama", "Thriller", "Comedy"],
      },
      {
        name: "The Dark Knight",
        price: 9.99,
        seatQuantity: 120,
        img: "https://example.com/images/darkknight.jpg",
        description:
          "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
        duration: 152, // 2 hours and 32 minutes
        releaseDate: new Date("2008-07-18"),
        author: defaultAuthorId,
        genres: ["Action", "Crime", "Drama"],
      },
      {
        name: "Inception",
        price: 10.5,
        seatQuantity: 90,
        img: "https://example.com/images/inception.jpg",
        description:
          "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
        duration: 148, // 2 hours and 28 minutes
        releaseDate: new Date("2010-07-16"),
        author: defaultAuthorId,
        genres: ["Action", "Adventure", "Science Fiction"],
      },
    ];

    // Insert films
    await Film.insertMany(films);
    console.log("Films seeded successfully");

    // Return the created films for reference in other seeders
    return await Film.find();
  } catch (error) {
    console.error("Error seeding films:", error);
    throw error;
  }
};
