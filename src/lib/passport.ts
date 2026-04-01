import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "./prisma.js";
import dotenv from "dotenv";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "placeholder",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder",
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await prisma.user.findUnique({
          where: { googleId: profile.id },
        });

        if (!user) {
          // Check if email already exists
          const existingEmail = await prisma.user.findUnique({
            where: { email: profile.emails?.[0].value },
          });

          if (existingEmail) {
            // Link google to existing email
            user = await prisma.user.update({
              where: { email: profile.emails?.[0].value },
              data: { googleId: profile.id, avatarUrl: profile.photos?.[0].value },
            });
          } else {
            // Create new user
            user = await prisma.user.create({
              data: {
                googleId: profile.id,
                email: profile.emails?.[0].value || "",
                name: profile.displayName,
                avatarUrl: profile.photos?.[0].value,
                role: "client",
              },
            });
          }
        }
        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

export default passport;
