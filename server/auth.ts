import { Spotify } from "arctic";

export const spotify = new Spotify(
  process.env.SPOTIFY_CLIENT_ID!,
  process.env.SPOTIFY_CLIENT_SECRET!,
  "http://10.0.2.2:3000/auth/callback",
);
