import express, { Router } from "express";
const router: Router = express.Router();
import filmControllers from "../controllers/filmController";

router.get("/", filmControllers.getFilms);

router.get("/:filmId", filmControllers.getFilmById);

router.post("/", filmControllers.addFilm);

export = router;
