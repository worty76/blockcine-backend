import { Request, Response } from "express";
import { Film } from "../models/film";
import { Reservation } from "../models/reservation";
import mongoose from "mongoose";

interface MulterRequest extends Request {
  file: any;
}

const addFilm = async (req: Request, res: Response): Promise<any> => {
  const {
    name,
    price,
    seatQuantity,
    description,
    duration,
    releaseDate,
    genres,
  } = req.body;
  const img = (req as MulterRequest).file;

  try {
    const newFilm = new Film({
      name,
      price,
      seatQuantity,
      img: img.filename,
      description,
      duration,
      releaseDate,
      genres,
    });

    await newFilm.save();

    res.send({
      message: "successful !",
    });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .send({ message: "An error occurred while adding the film" });
  }
};

const getFilmById = async (req: Request, res: Response): Promise<any> => {
  const { filmId } = req.params;

  // Validate filmId before querying
  if (!filmId || filmId === "undefined" || filmId === "null") {
    return res.status(400).json({
      message: "Invalid film ID provided",
      error: "INVALID_ID",
    });
  }

  try {
    // Check if filmId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(filmId)) {
      return res.status(400).json({
        message: "Invalid film ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    const film = await Film.findById(filmId);

    if (!film) {
      return res.status(404).json({
        message: "Film not found",
        error: "NOT_FOUND",
      });
    }

    // Return detailed film info
    const filmDetail = {
      _id: film._id,
      name: film.name,
      price: film.price,
      seatQuantity: film.seatQuantity,
      img: film.img,
      description: film.description,
      duration: film.duration,
      releaseDate: film.releaseDate,
      genres: film.genres,
    };

    // Get reservations for this film
    const reservations = await Reservation.find({ filmId });

    const formattedReservations = reservations.map((r) => ({
      _id: r._id,
      userId: r.userId,
      filmId: r.filmId,
      seatNumber: r.seatNumber,
    }));

    res.json({
      ...filmDetail,
      reservations: formattedReservations,
    });
  } catch (err) {
    console.error("Error fetching film by ID:", err);
    res.status(500).json({
      message: "An error occurred while retrieving film details",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

const getFilms = async (req: Request, res: Response): Promise<any> => {
  try {
    const films = await Film.find();
    res.send(films);
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "An error occurred" });
  }
};

const getReservationsByUserId = async (req: Request, res: Response) => {
  const userId = req.params.userId;

  try {
    // Using Mongoose population to get film data in a single query
    const reservations = await Reservation.find({ userId }).populate(
      "filmId",
      "name img"
    );

    const populatedReservations = reservations.map((reservation) => {
      const film = reservation.filmId as any;
      return {
        ...reservation.toObject(),
        filmId: reservation.filmId,
        filmName: film ? film.name : "Unknown",
        filmImg: film ? film.img : null,
      };
    });

    res.send({
      reservations: populatedReservations,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "An error occurred" });
  }
};

const getBookedSeats = async (req: Request, res: Response): Promise<any> => {
  const { filmId } = req.params;

  // Validate filmId
  if (!filmId || filmId === "undefined" || filmId === "null") {
    return res.status(400).json({
      message: "Invalid film ID provided",
      error: "INVALID_ID",
    });
  }

  try {
    // Check if filmId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(filmId)) {
      return res.status(400).json({
        message: "Invalid film ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    // Find all reservations for this film
    const reservations = await Reservation.find({ filmId });

    // Extract seat numbers
    const bookedSeats = reservations.map((r) => r.seatNumber);

    res.json({
      filmId,
      bookedSeats,
      count: bookedSeats.length,
    });
  } catch (err) {
    console.error("Error fetching booked seats:", err);
    res.status(500).json({
      message: "An error occurred while retrieving booked seats",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

export default {
  getReservationsByUserId,
  getFilms,
  getFilmById,
  addFilm,
  getBookedSeats, // Add the new controller function
};
