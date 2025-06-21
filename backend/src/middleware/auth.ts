// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// This makes it so we can add a 'user' property to the request
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// This is our Guard!
export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  // Check if they have a key
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No key provided. Access denied.' });
  }

  const token = authHeader.split(' ')[1]; // The key is the part after "Bearer "

  try {
    // Check if the key is real and not expired
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; email: string };

    // If the key is good, attach the user's info to the request
    req.user = { id: payload.userId, email: payload.email };

    // Let them pass through the door
    next();
  } catch (error) {
    // If the key is fake or broken, send them away
    return res.status(401).json({ message: 'Your key is invalid. Access denied.' });
  }
};