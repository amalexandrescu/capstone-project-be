import express from "express";
import UsersModel from "./model.js";
import createHttpError from "http-errors";

const usersRouter = express.Router();

usersRouter.post("/", async (req, res, next) => {
  try {
    const newUser = new UsersModel(req.body);
    await newUser.save();
    res.status(201).send({ user: newUser });
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/me/profile", (req, res, next) => {
  try {
    const user = req.body._id;
    if (user) {
      res.send(user);
    } else {
      next(createHttpError(404, `User with provided id not found`));
    }
  } catch (error) {
    next(error);
  }
});

export default usersRouter;
