import mongoose from "mongoose";

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
