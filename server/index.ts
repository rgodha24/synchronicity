import { Hono } from "hono";
import { connectToMongo } from "./db";

await connectToMongo();

const app = new Hono();

app.get("/", (c) => c.text("Hono!"));

export default app;

