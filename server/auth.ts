import { Spotify } from "arctic";

export const spotify = new Spotify(
  process.env.SPOTIFY_CLIENT_ID!,
  process.env.SPOTIFY_CLIENT_SECRET!,
  "http://localhost:3000/auth/callback",
);
