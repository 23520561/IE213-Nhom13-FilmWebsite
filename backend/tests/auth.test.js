import request from "supertest";
import app from "../app.js";
import { connectDB } from "../db.js";
import mongoose from "mongoose";
import User from "../models/user.js";

let token;

beforeAll(async () => {
  await connectDB();
  await User.deleteMany();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Auth Service", () => {
  //
  // REGISTER
  //
  test("POST /api/auth/register", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "admin@gmail.com",
      password: "123456",
      role: "admin",
    });

    expect(res.statusCode).toBe(201);
  });

  //
  // LOGIN
  //
  test("POST /api/auth/login", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "admin@gmail.com",
      password: "123456",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();

    token = res.body.token;
  });
});
