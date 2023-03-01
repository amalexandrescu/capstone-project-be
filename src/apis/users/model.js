import mongoose from "mongoose";

const { Schema, model } = mongoose;

const usersSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, require: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    //if I want to implement google OAuth, then the password won't be required
    //because google doesn't share the password with us when performing OAuth
  },
  {
    timestamps: true,
  }
);

export default model("User", usersSchema);
