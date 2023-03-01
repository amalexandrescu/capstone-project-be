import express from "express";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import cors from "cors";
import listEndpoints from "express-list-endpoints";
import usersRouter from "./apis/users/index.js";

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
};
server.use(cors(corsOpts));
server.use(express.json());

//endpoints

server.use("/users", usersRouter);

//error handlers

mongoose.connect(process.env.MONGO_URL);

mongoose.connection.on("connected", () => {
  console.log("Connected to Mongo!");
  server.listen(port, () => {
    console.table(listEndpoints(server));
    console.log(`Server is running on port: ${port}`);
  });
});
