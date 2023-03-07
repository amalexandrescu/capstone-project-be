import express from "express";
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

moviesRouter.post("/", async (req, res, next) => {
  try {
    const newMovie = new MoviesModel(req.body);
    await newMovie.save();
    res.status(201).send({ movie: newMovie });
  } catch (error) {
    next(error);
  }
});

export default moviesRouter;
