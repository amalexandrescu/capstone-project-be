import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema, model } = mongoose;

const usersSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "" },
    cover: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    movies: [
      {
        watchedMovie: { type: Schema.Types.ObjectId, ref: "Movie" },
        userRating: { type: Number, default: -1, min: -1, max: 10 },
      },
      { timestamps: true },
    ],
    friends: [
      {
        friend: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
    //if I want to implement google OAuth, then the password won't be required
    //because google doesn't share the password with us when performing OAuth
  },
  {
    timestamps: true,
  }
);

usersSchema.pre("save", async function (next) {
  const currentUser = this;
  if (currentUser.isModified("password")) {
    const plainPassword = currentUser.password;
    currentUser.password = await bcrypt.hash(plainPassword, 10);
  }

  next();
});

usersSchema.methods.toJSON = function () {
  const usersMongoDoc = this;
  const user = usersMongoDoc.toObject();
  delete user.password;
  delete user.__v;
  delete user.createdAt;
  delete user.updatedAt;
  return user;
};

usersSchema.static("checkCredentials", async function (email, password) {
  const user = await this.findOne({ email });

  if (user) {
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (passwordMatch) {
      return user;
    } else {
      return null;
    }
  } else {
    return null;
  }
});

export default model("User", usersSchema);
