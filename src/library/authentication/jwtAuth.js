import createHttpError from "http-errors";
import { verifyAccessToken } from "./jwtTools.js";

export const JWTAuthMiddleware = async (req, res, next) => {
  if (!req.headers.authorization) {
    next(createHttpError(401, "Please provide Bearer Token"));
  } else {
    try {
      const accessToken = req.headers.authorization.replace("Bearer ", "");
      const payload = await verifyAccessToken(accessToken);
      console.log(payload);
      req.user = {
        _id: payload._id,
      };
      next();
    } catch (error) {
      console.log(error);
      next(createHttpError(401, "Token is no bueno!"));
    }
  }
};
