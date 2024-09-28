import mongoose from "mongoose";
import { Schema, model, Types } from "mongoose";

let db: mongoose.Connection;

export async function connectToMongo() {
  console.log(process.env.MONGO_CONNECTION!);
  await mongoose.connect(process.env.MONGO_CONNECTION!, {
    serverApi: { version: "1", strict: true, deprecationErrors: true },
  });
  db = mongoose.connection;

  db.on("error", console.error.bind(console, "MongoDB connection error:"));
  db.once("open", () => {
    console.log("Connected to MongoDB");
  });
}

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
});

const playlists = new Schema({
  user: { type: Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  imgUrl: { type: String, required: true },
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

export const { disconnect } = mongoose;
