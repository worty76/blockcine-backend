import { Request, Response } from "express";
import { Film } from "../models/film";
import { Reservation } from "../models/reservation";
import mongoose from "mongoose";
import { uploadToCloudinary } from "../utils/imageUpload";
import formidable from "formidable";

// Define interfaces for enhanced Request types
interface MulterRequest extends Request {
  file: any;
}

interface AuthenticatedRequest extends Request {
  userId?: string; // Add userId property provided by authenticate middleware
}

const addFilm = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const files = await doSomethingWithNodeRequest(req);

    const poster = await uploadToCloudinary(files.img[0].filepath);

    // Use the userId from the authenticated request
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
        error: "UNAUTHORIZED",
      });
    }

    const newFilm = new Film({
      name: files.name[0],
      price: parseFloat(files.price[0]),
      seatQuantity: parseInt(files.seatQuantity[0]),
      img: poster,
      description: files.description[0],
      duration: parseInt(files.duration[0]),
      releaseDate: new Date(files.releaseDate[0]),
      genres: files.genres[0] ? JSON.parse(files.genres[0]) : [],
      author: req.userId,
    });

    await newFilm.save();

    res.status(201).json({
      message: "Film added successfully!",
      film: {
        _id: newFilm._id,
        name: newFilm.name,
      },
    });
  } catch (err) {
    console.error("Error in addFilm:", err);
    res.status(500).json({
      message: "An error occurred while adding the film",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

function doSomethingWithNodeRequest(req: Request): Promise<any> {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: true });
    form.parse(req, (error: any, fields: any, files: any) => {
      if (error) {
        reject(error);
        return;
      }
      // console.log("Parsed Fields: ", fields);
      // console.log("Parsed Files: ", files);
      resolve({ ...fields, ...files });
    });
  });
}

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

const updateFilm = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const { filmId } = req.params;

    // Validate filmId
    if (!filmId || !mongoose.Types.ObjectId.isValid(filmId)) {
      return res.status(400).json({
        message: "Invalid film ID provided",
        error: "INVALID_ID",
      });
    }

    // Check authentication
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
        error: "UNAUTHORIZED",
      });
    }

    // Find the film
    const film = await Film.findById(filmId);

    if (!film) {
      return res.status(404).json({
        message: "Film not found",
        error: "NOT_FOUND",
      });
    }

    // Check authorization (only author can edit)
    if (film.author.toString() !== req.userId) {
      return res.status(403).json({
        message: "You are not authorized to update this film",
        error: "FORBIDDEN",
      });
    }

    // Parse form data
    const files = await doSomethingWithNodeRequest(req);

    // Validate required fields
    const requiredFields = [
      "name",
      "price",
      "seatQuantity",
      "description",
      "duration",
      "releaseDate",
    ];
    const missingFields = requiredFields.filter(
      (field) => !files[field] || !files[field][0]
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Missing required fields",
        error: "VALIDATION_ERROR",
        fields: missingFields,
      });
    }

    // Handle potential upload of new image
    let imgUrl = film.img;
    if (files.img && files.img[0]) {
      imgUrl = await uploadToCloudinary(files.img[0].filepath);
    }

    // Update the film
    const updatedFilm = await Film.findByIdAndUpdate(
      filmId,
      {
        name: files.name[0],
        price: parseFloat(files.price[0]),
        seatQuantity: parseInt(files.seatQuantity[0]),
        img: imgUrl,
        description: files.description[0],
        duration: parseInt(files.duration[0]),
        releaseDate: new Date(files.releaseDate[0]),
        genres: files.genres[0] ? JSON.parse(files.genres[0]) : [],
      },
      { new: true } // Return updated document
    );

    res.status(200).json({
      message: "Film updated successfully!",
      film: {
        _id: updatedFilm?._id,
        name: updatedFilm?.name,
      },
    });
  } catch (err) {
    console.error("Error in updateFilm:", err);
    res.status(500).json({
      message: "An error occurred while updating the film",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

const deleteFilm = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const { filmId } = req.params;

    // Validate filmId
    if (!filmId || !mongoose.Types.ObjectId.isValid(filmId)) {
      return res.status(400).json({
        message: "Invalid film ID provided",
        error: "INVALID_ID",
      });
    }

    // Check authentication
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
        error: "UNAUTHORIZED",
      });
    }

    // Find the film
    const film = await Film.findById(filmId);

    if (!film) {
      return res.status(404).json({
        message: "Film not found",
        error: "NOT_FOUND",
      });
    }

    // Check authorization (only author can delete)
    if (film.author.toString() !== req.userId) {
      return res.status(403).json({
        message: "You are not authorized to delete this film",
        error: "FORBIDDEN",
      });
    }

    // Delete all reservations for this film first
    await Reservation.deleteMany({ filmId });

    // Delete the film
    await Film.findByIdAndDelete(filmId);

    res.status(200).json({
      message: "Film and all associated reservations deleted successfully",
    });
  } catch (err) {
    console.error("Error in deleteFilm:", err);
    res.status(500).json({
      message: "An error occurred while deleting the film",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

export default {
  getReservationsByUserId,
  getFilms,
  getFilmById,
  addFilm,
  updateFilm,
  deleteFilm,
  getBookedSeats,
};
