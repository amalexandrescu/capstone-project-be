import mongoose from "mongoose";

const { model, Schema } = mongoose;

const moviesSchema = new Schema(
  {
    title: { type: String, required: true },
    actors: { type: String, required: true },
    genre: { type: String, required: true },
    plot: { type: String, required: true },
    poster: { type: String, required: true },
    released: { type: String, required: true },
    runtime: { type: String, required: true },
    imdbID: { type: String, required: true },
    imdbRating: { type: String, required: true },
  },
  { timestamps: true }
);

export default model("Movie", moviesSchema);
