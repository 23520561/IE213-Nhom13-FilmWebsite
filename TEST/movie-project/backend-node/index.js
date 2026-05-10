import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";
import * as models from "./models/index.js";
import express from "express";

dotenv.config();
const app = express();
app.use(express.json());
const connectDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    await client.connect();
    console.log("Connected to the database successfully");
    return client;
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    process.exit(1); // Exit the application with an error code
  }
};

const PORT = process.env.PORT || 3000;

const run = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};
run();
