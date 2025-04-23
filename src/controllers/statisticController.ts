import { Request, Response } from "express";
import { Film } from "../models/film";
import { Reservation } from "../models/reservation";
import { User } from "../models/user";
import mongoose from "mongoose";

// Get overview statistics for dashboard
const getOverviewStats = async (req: Request, res: Response) => {
  try {
    // Get counts of key entities
    const [filmsCount, usersCount, reservationsCount] = await Promise.all([
      Film.countDocuments(),
      User.countDocuments(),
      Reservation.countDocuments({ verified: true }),
    ]);

    // Calculate total revenue - assuming each reservation has the film's price
    const reservations = await Reservation.find({ verified: true }).populate(
      "filmId"
    );
    let totalRevenue = 0;

    reservations.forEach((reservation) => {
      const film = reservation.filmId as any;
      if (film && film.price) {
        totalRevenue += film.price;
      }
    });

    // Calculate monthly stats for growth trends
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const [lastMonthFilms, lastMonthUsers, lastMonthReservations] =
      await Promise.all([
        Film.countDocuments({ createdAt: { $gte: lastMonth } }),
        User.countDocuments({ createdAt: { $gte: lastMonth } }),
        Reservation.countDocuments({
          verified: true,
          createdAt: { $gte: lastMonth },
        }),
      ]);

    // Calculate growth percentages
    const filmGrowth =
      filmsCount > 0 ? ((lastMonthFilms / filmsCount) * 100).toFixed(1) : "0";
    const userGrowth =
      usersCount > 0 ? ((lastMonthUsers / usersCount) * 100).toFixed(1) : "0";
    const reservationGrowth =
      reservationsCount > 0
        ? ((lastMonthReservations / reservationsCount) * 100).toFixed(1)
        : "0";

    res.status(200).json({
      stats: {
        filmsCount,
        usersCount,
        reservationsCount,
        totalRevenue: totalRevenue.toFixed(2),
      },
      growth: {
        filmsGrowth: `+${filmGrowth}%`,
        usersGrowth: `+${userGrowth}%`,
        reservationsGrowth: `+${reservationGrowth}%`,
      },
    });
  } catch (error) {
    console.error("Error getting overview stats:", error);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
};

// Get top performing films
const getTopFilms = async (req: Request, res: Response) => {
  try {
    // Aggregate reservation data grouped by film
    const topFilms = await Reservation.aggregate([
      { $match: { verified: true } },
      {
        $group: {
          _id: "$filmId",
          reservationCount: { $sum: 1 },
        },
      },
      { $sort: { reservationCount: -1 } },
      { $limit: 5 },
    ]);

    // Populate film details
    const filmsWithDetails = await Promise.all(
      topFilms.map(async (item) => {
        const film = await Film.findById(item._id);
        if (!film) return null;

        // Calculate occupancy rate
        const occupancyRate = (
          (item.reservationCount / film.seatQuantity) *
          100
        ).toFixed(1);

        return {
          _id: film._id,
          name: film.name,
          reservationCount: item.reservationCount,
          totalSeats: film.seatQuantity,
          occupancyRate: `${occupancyRate}%`,
          img: film.img,
        };
      })
    );

    const validFilms = filmsWithDetails.filter((film) => film !== null);

    res.status(200).json(validFilms);
  } catch (error) {
    console.error("Error getting top films:", error);
    res.status(500).json({ message: "Failed to fetch top films" });
  }
};

// Get revenue data by day for the past week
const getRevenueData = async (req: Request, res: Response) => {
  try {
    const days = 7; // Past 7 days
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Create array of dates for the past 7 days
    const dateArray = [...Array(days)]
      .map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date;
      })
      .reverse();

    const revenueData = await Promise.all(
      dateArray.map(async (date) => {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Get all verified reservations for this day
        const dayReservations = await Reservation.find({
          verified: true,
          createdAt: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        }).populate("filmId");

        // Calculate day's revenue
        let dayRevenue = 0;
        dayReservations.forEach((reservation) => {
          const film = reservation.filmId as any;
          if (film && film.price) {
            dayRevenue += film.price;
          }
        });

        const dayOfWeek = dayLabels[date.getDay()];

        return {
          day: dayOfWeek,
          value: dayRevenue.toFixed(2),
          reservations: dayReservations.length,
          date: date.toISOString().split("T")[0],
        };
      })
    );

    res.status(200).json(revenueData);
  } catch (error) {
    console.error("Error getting revenue data:", error);
    res.status(500).json({ message: "Failed to fetch revenue data" });
  }
};

// Get recent activities
const getRecentActivities = async (req: Request, res: Response) => {
  try {
    // Get the 10 most recent reservations with user and film details
    const recentReservations = await Reservation.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "name email")
      .populate("filmId", "name");

    const activities = recentReservations.map((reservation) => {
      const user = reservation.userId as any;
      const film = reservation.filmId as any;

      const userName = user?.name || "Unknown User";
      const filmName = film?.name || "Unknown Film";

      return {
        id: reservation._id,
        user: userName,
        action: reservation.verified
          ? "purchased a ticket for"
          : "reserved a seat for",
        item: filmName,
        seatNumber: reservation.seatNumber,
        time: new Date(reservation.createdAt).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        date: reservation.createdAt,
      };
    });

    res.status(200).json(activities);
  } catch (error) {
    console.error("Error getting recent activities:", error);
    res.status(500).json({ message: "Failed to fetch recent activities" });
  }
};

export default {
  getOverviewStats,
  getTopFilms,
  getRevenueData,
  getRecentActivities,
};
