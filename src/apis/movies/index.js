import express from "express";
import createHttpError from "http-errors";
import { JWTAuthMiddleware } from "../../library/authentication/jwtAuth.js";
import MoviesModel from "./model.js";

const moviesRouter = express.Router();

moviesRouter.get("/", async (req, res, next) => {
  try {
    const movies = await MoviesModel.find();
    res.send(movies);
  } catch (error) {
    next(error);
  }
});

moviesRouter.post("/", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const movies = await MoviesModel.find();
    const newMovie = new MoviesModel(req.body);
    const index = movies.findIndex((movie) => movie.imdbID === newMovie.imdbID);
    if (index === -1) {
      // res.cookie("accessToken", accessToken, { httpOnly: true });
      await newMovie.save();
      res.status(201).send({ movie: newMovie });
    } else {
      res.status(204).send();
      // next(createHttpError(400, "Movie already in the db"));
    }
  } catch (error) {
    next(error);
  }
});

export default moviesRouter;
