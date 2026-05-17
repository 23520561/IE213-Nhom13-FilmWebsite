import dotenv from "dotenv";
import { app, server } from "./app.js";
import cors from "cors";
import { expressMiddleware } from "@apollo/server/express4";
import { createLoaders } from "./graphql/loader/index.js";
import mongoose from "mongoose";
import * as models from "./models/index.js";
import express from "express";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to the database successfully");
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    process.exit(1); // Exit the application with an error code
  }
};
const connectDBWithMongoClient = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
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
  await server.start();

  app.use(
    "/graphql",
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        // You can add authentication logic here and pass the user info in the context
        return {
          loaders: createLoaders(),
          user: null, // Replace with actual user info after authentication
        };
      },
    }),
  );

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/graphql`);
  });
};
run();
