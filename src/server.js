import express from "express";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import cors from "cors";
import listEndpoints from "express-list-endpoints";
import usersRouter from "./apis/users/index.js";
import {
  badRequestHandler,
  forbiddenHandler,
  genericErrorHAndler,
  notFoundHandler,
  unauthorizedHandler,
} from "./errorHandlers.js";
import cookieParser from "cookie-parser";
import moviesRouter from "./apis/movies/index.js";

const server = express();

const port = process.env.PORT || 3001;

//middlewares

const whitelist = [process.env.FE_PROD_URL, process.env.FE_DEV_URL];

const corsOpts = {
  origin: (origin, corsNext) => {
    console.log("CURRENT ORIGIN", origin);
    if (!origin || whitelist.indexOf(origin) !== -1) {
      corsNext(null, true);
    } else {
      corsNext(
        createHttpError(400, `Origin ${origin} is not in the whitelist`)
      );
    }
  },
  credentials: true,
};

server.use(cors(corsOpts));
server.use(express.json());
server.use(cookieParser());

//endpoints

server.use("/users", usersRouter);
server.use("/movies", moviesRouter);

server.get("/omdb/:imdbId", async (req, res, next) => {
  try {
    const imdbId = req.params.imdbId;
    const omdbApiKey = process.env.OMDB_API_KEY;
    const response = await fetch(
      `http://www.omdbapi.com/?i=${imdbId}&type=movie&plot=full&apikey=${omdbApiKey}`
    );
    const result = await response.json();
    res.send(result);
  } catch (error) {
    console.log("cannot fetch from omdb api");
    next(error);
  }
});

// server.get("/omdb/queriedMovie", async (req, res, next) => {
//   try {

//     const omdbApiKey = process.env.OMDB_API_KEY;
//     const response = await fetch(
//       `https://www.omdbapi.com/?s=${query}&type=movie&apikey=${omdbApiKey}`
//     );
//     const movie = await response.json();

//     if (movie.Search.length < 10) {
//       res.send(movie.Search);
//     } else {
//       res.send(movie.Search.slice(0, 10));
//     }
//   } catch (error) {
//     console.log("cannot fetch from omdb api by query");
//     next(error);
//   }
// });

//error handlers

server.use(badRequestHandler);
server.use(unauthorizedHandler);
server.use(forbiddenHandler);
server.use(notFoundHandler);
server.use(genericErrorHAndler);

mongoose.connect(process.env.MONGO_URL);

mongoose.connection.on("connected", () => {
  console.log("Connected to Mongo!");
  server.listen(port, () => {
    console.table(listEndpoints(server));
    console.log(`Server is running on port: ${port}`);
  });
});
