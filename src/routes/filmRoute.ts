import express, { Router } from "express";
const router: Router = express.Router();
import filmControllers from "../controllers/filmController";
import { authenticate } from "../middlewares/authenticate";

router.get("/", filmControllers.getFilms);

router.get("/:filmId", filmControllers.getFilmById);

router.post("/", authenticate, filmControllers.addFilm);

router.put("/:filmId", authenticate, filmControllers.updateFilm);

router.delete("/:filmId", authenticate, filmControllers.deleteFilm);

export = router;
