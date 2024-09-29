import mongoose from "mongoose";
import { Schema, model, Types } from "mongoose";
import { spotify } from "./auth";

process.on("SIGINT", async () => {
  console.log("ctrl-c detected, disconnecting from mongoose...");
  await mongoose.disconnect();
  process.exit();
});

const users = new mongoose.Schema({
  display_name: { type: String, required: true },
  spotify_id: { type: String, required: true },
  spotify_token: { type: String, required: true },
  spotify_refresh_token: { type: String, required: true },
  spotify_token_iat: { type: Date, required: true },
  _id: { type: String, required: true },
});

const session = new Schema(
  {
    _id: { type: String, required: true },
    user_id: {
      type: String,
      required: true,
    },
    expires_at: {
      type: Date,
      required: true,
    },
  },
  { _id: false }
);

const playlists = new Schema({
  user: { type: String, ref: "User", required: true },
  name: { type: String, required: true },
  imgUrl: { type: String, required: true },
  trackList: {type: Object, required: true}
});

const songs = new Schema({
  spotify_id: { type: String, required: true, unique: true },
  youtube_id: { type: String, unique: true },
  song_url: { type: String, unique: true },
  playlist: { type: Types.ObjectId, ref: "Playlist" },
});

export const Users = model("User", users);
export const Playlists = model("Playlist", playlists);
export const Songs = model("Song", songs);
export const Sessions = model("Sessions", session);

export const { disconnect } = mongoose;
