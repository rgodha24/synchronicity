import { MongodbAdapter } from "@lucia-auth/adapter-mongodb";
import { createCookie } from "@remix-run/node";
import { Spotify } from "arctic";
import { Lucia } from "lucia";
import mongoose from "mongoose";

export const spotify = new Spotify(
  process.env.SPOTIFY_CLIENT_ID!,
  process.env.SPOTIFY_CLIENT_SECRET!,
  process.env.NODE_ENV === "production"
    ? "https://synchronicity.vercel.app/auth/callback"
    : "http://localhost:5173/auth/callback"
);

const adapter = new MongodbAdapter(
  mongoose.connection.collection("sessions"),
  mongoose.connection.collection("users")
);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      // set to `true` when using HTTPS
      secure: process.env.NODE_ENV === "production",
    },
  },
});
