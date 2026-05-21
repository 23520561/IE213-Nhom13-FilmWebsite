import { jest } from "@jest/globals";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env.test") });

// Global test setup
beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error(".env.test MONGODB_URI not set");
  }

  try {
    await mongoose.connect(mongoUri);
    console.log(`Connected to test database: ${mongoUri}`);
  } catch (error) {
    console.error("Failed to connect to test database:", error);
    throw error;
  }
});

// Clear database before each test file
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.disconnect();
  console.log("Disconnected from test database");
});

// Suppress console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};
