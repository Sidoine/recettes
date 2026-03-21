import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-in-production";
const COOKIE_NAME = "recettes_token";

// Augment Express Request with user payload
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export type JwtPayload = {
  userId: string;
  role: "ADMIN" | "USER";
};

export function createToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function setAuthCookie(response: Response, token: string): void {
  response.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
    path: "/",
  });
}

export function clearAuthCookie(response: Response): void {
  response.clearCookie(COOKIE_NAME, { path: "/" });
}

export function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const token = (request.cookies as Record<string, string | undefined>)?.[
    COOKIE_NAME
  ];

  if (!token) {
    response.status(401).json({ message: "Vous devez être connecté." });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    request.user = payload;
    next();
  } catch {
    response
      .status(401)
      .json({ message: "Session expirée, reconnectez-vous." });
  }
}

export function requireAdmin(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  requireAuth(request, response, () => {
    if (request.user?.role !== "ADMIN") {
      response
        .status(403)
        .json({ message: "Accès réservé à l'administrateur." });
      return;
    }
    next();
  });
}
