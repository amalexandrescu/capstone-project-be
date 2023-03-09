import express from "express";
import UsersModel from "./model.js";
import createHttpError from "http-errors";
import { JWTAuthMiddleware } from "../../library/authentication/jwtAuth.js";
import { createAccessToken } from "../../library/authentication/jwtTools.js";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import MoviesModel from "../movies/model.js";
import { fetchMovieByImdbId } from "../../library/movieHelpers/movieFetch.js";
import mongoose from "mongoose";
import { ObjectId } from "bson";

const cloudinaryUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      format: "jpeg",
      folder: "capstone-project",
    },
  }),
}).single("avatar");

const usersRouter = express.Router();

usersRouter.post("/register", async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    const emailAlreadyRegistered = await UsersModel.findOne({ email: email });
    if (emailAlreadyRegistered) {
      return next(
        createHttpError(400, `User with provided email already exists`)
      );
    }
    const newUser = new UsersModel(req.body);
    await newUser.save();
    if (
      (newUser && email && password && firstName && lastName) ||
      (newUser && email && password && firstName && lastName && avatar)
    ) {
      const payload = { _id: newUser._id, role: newUser.role };

      const accessToken = await createAccessToken(payload);
      res.cookie("accessToken", accessToken, { httpOnly: true });
      res.status(201).send({ user: newUser });
      // res.status(201).send();
    }
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await UsersModel.checkCredentials(email, password);
    if (user) {
      const payload = { _id: user._id };
      const accessToken = await createAccessToken(payload);
      res.cookie("accessToken", accessToken, { httpOnly: true });
      res.send({ accessToken });
    } else {
      next(createHttpError(401, "Credentials are not OK!"));
    }
  } catch (error) {
    console.log("Error during log in");
    next(error);
  }
});

usersRouter.get("/", async (req, res, next) => {
  try {
    const users = await UsersModel.find();

    res.send(users);
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/me/profile", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.user._id).populate({
      path: "movies",
      select: "imdbID title",
    });
    // console.log({ user });
    if (user) {
      res.send(user);
    } else {
      next(createHttpError(404, `User with provided id not found`));
    }
  } catch (error) {
    next(error);
  }
});

usersRouter.post(
  "/me/avatar",
  JWTAuthMiddleware,
  cloudinaryUploader,
  async (req, res, next) => {
    try {
      //we get from req.body the picture we want to upload
      console.log("ID: ", req.user._id);
      const url = req.file.path;
      console.log("URL", url);
      const updatedUser = await UsersModel.findByIdAndUpdate(
        req.user._id,
        { avatar: url },
        { new: true, runValidators: true }
      );
      console.log(updatedUser);
      if (updatedUser) {
        res.status(200).send(updatedUser);
      } else {
        next(createHttpError(404, `User with id ${req.user._id} not found`));
      }
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.get("/:userId", async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.params.userId);
    if (user) {
      res.send(user);
    } else {
      next(createHttpError(404, `User with provided id not found`));
    }
  } catch (error) {
    next(error);
  }
});

usersRouter.put("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.user._id);
    if (user) {
      const updatedUser = await UsersModel.findByIdAndUpdate(
        req.user._id,
        req.body,
        { new: true, runValidators: true }
      );
      res.status(200).send(updatedUser);
    } else {
      next(createHttpError(404, `User with the provided id not found`));
    }
  } catch (error) {
    next(error);
  }
});

//http://localhost:3001/users/me/movies

usersRouter.get("/me/movies", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.user._id).populate({
      path: "movies.watchedMovie",
    });
    if (user) {
      console.log(user.movies);
      res.send(user.movies);
    } else {
      next(createHttpError(404, `User with the provided id not found`));
    }
  } catch (error) {
    next(error);
  }
});

//I am sending in req.body the movie imdbID
//check if the movie is already in movies array from db
//if not, then, create the movie in the db and add it to the user.movies too (the mongo id)
//if the movie is in movies array from db, get the movie form there with all the data
//check if the user.movies has the movie in there (you can use mongo id from above or imdbID from req.body)
//if it's not there, add the movie in user.movies array (add the mongo id)

//I am sending the mongoId of the movie in the req.body
//add this movie to watchedMovies of a user if it is not there
usersRouter.post("/me/movies", JWTAuthMiddleware, async (req, res, next) => {
  try {
    console.log(req.body);
    const { movieId } = req.body;
    const user = await UsersModel.findById(req.user._id)
      .populate({ path: "movies" })
      .populate({ path: "movies.watchedMovie" });

    if (user) {
      console.log(user);
      const movies = user.movies;
      const index = movies.findIndex(
        (movie) => movie.watchedMovie._id.toString() === movieId
      );
      console.log(index);
      if (index === -1) {
        const updatedUser = await UsersModel.findByIdAndUpdate(
          req.user._id,
          { $push: { movies: { watchedMovie: movieId } } },
          { new: true, runValidators: true }
        ).populate({ path: "movies.watchedMovie", select: "imdbID title" });
        if (updatedUser) {
          res.status(200).send(updatedUser);
        } else {
          next(createHttpError(404, `User with id ${req.user._id} not found`));
        }
      } else {
        res.status(204).send();
      }
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//I am sending the imdbID in the req.body
//endpoint for removing a movie from a user movies array
usersRouter.put("/me/movies", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const { imdbID } = req.body;
    const user = await UsersModel.findById(req.user._id)
      .populate({ path: "movies" })
      .populate({ path: "movies.watchedMovie" });

    if (user) {
      const index = user.movies.findIndex(
        (m) => m.watchedMovie.imdbID === imdbID
      );
      if (index !== -1) {
        const filteredArray = user.movies.filter(
          (m) => m.watchedMovie.imdbID !== imdbID
        );

        const updatedUser = await UsersModel.findByIdAndUpdate(
          req.user._id,
          { movies: filteredArray },
          { new: true }
        )
          .populate({ path: "movies" })
          .populate({ path: "movies.watchedMovie" });

        res.send(updatedUser);
      } else {
        // res.status(204).send();
        next(createHttpError(400, "there is no such a movie for this user"));
      }
    } else {
      next(createHttpError(404, `User with id ${req.user._id} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

//endpoint for changing the rate of a movie for the logged in user

usersRouter.put(
  "/me/movies/rating",
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      const { mongoId } = req.body;
      const { newRating } = req.body;
      console.log("___________", newRating);
      const user = await UsersModel.findById({
        _id: req.user._id,
      }).populate("movies");

      if (user) {
        const index = user.movies.findIndex(
          (m) => m.watchedMovie.toString() === mongoId
        );
        if (index !== -1) {
          //so the movie is there
          const movies = user.movies;

          movies[index].userRating = newRating;

          // const updatedRating = user.movies.map((m) => {
          //   if (m.watchedMovie.toString() === mongoId) {
          //     m.userRating = newRating;
          //   }
          // });

          const updatedUser = await UsersModel.findByIdAndUpdate(
            req.user._id,
            { movies: movies },
            { new: true }
          ).populate({ path: "movies" });
          res.send(updatedUser);
        } else {
          console.log("movie is not added yet");
        }

        // res.send({ index });
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

export default usersRouter;
