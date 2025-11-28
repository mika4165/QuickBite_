import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import sessionMemory from "memorystore";
import { storage } from "./storage";
import crypto from "crypto";

const hashPassword = (password: string): string => {
  return crypto.pbkdf2Sync(password, "salt", 1000, 64, "sha512").toString("hex");
};

const verifyPassword = (password: string, hash: string): boolean => {
  return crypto.pbkdf2Sync(password, "salt", 1000, 64, "sha512").toString("hex") === hash;
};

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Create MemoryStore with session
  const MemoryStore = sessionMemory(session);
  const memoryStore = new MemoryStore({
    checkPeriod: 86400000, // prune expired entries every 24h
  });

  return session({
    secret: process.env.SESSION_SECRET!,
    store: memoryStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email: string, password: string, done: (err: any, user?: any, info?: any) => void) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !user.password) {
            return done(null, false, { message: "Invalid email or password" });
          }
          
          if (!verifyPassword(password, user.password)) {
            return done(null, false, { message: "Invalid email or password" });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, cb) => {
    cb(null, user.id);
  });

  passport.deserializeUser(async (id: string, cb) => {
    try {
      const user = await storage.getUser(id);
      cb(null, user);
    } catch (error) {
      cb(error);
    }
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export { hashPassword };
