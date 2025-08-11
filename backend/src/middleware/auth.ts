import dotenv from "dotenv";
dotenv.config(); // Ensure this runs before reading env vars

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { IUser, User } from "../models/User";
import { JwtPayload } from "jsonwebtoken";

console.log("JWT_SECRET from env:", process.env.JWT_SECRET); // DEBUG: should NOT be undefined


declare module "express-serve-static-core" {
  interface Request {
    user?: IUser;
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("Authorization header received:", req.headers.authorization);
    const token = req.header("Authorization")?.replace("Bearer ", "").trim();
if (!token) {
    return res.status(401).json({ message: "Authentication required" });
}


    const decoded = jwt.verify(
  token,
  process.env.JWT_SECRET as string
) as JwtPayload;


    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid authentication token" });
  }
};
