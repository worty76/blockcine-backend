import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = "secret_key"; // Should match the key used in authController

interface DecodedToken {
  userId: string;
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).send({ message: "Authorization header is required" });
    return;
  }

  const token = authHeader.split(" ")[1]; // Expecting "Bearer TOKEN_STRING"

  if (!token) {
    res.status(401).send({ message: "Authentication token is missing" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    (req as any).userId = decoded.userId; // Attach userId to request for use in controllers
    next();
  } catch (error) {
    res.status(401).send({ message: "Invalid or expired token" });
  }
};
