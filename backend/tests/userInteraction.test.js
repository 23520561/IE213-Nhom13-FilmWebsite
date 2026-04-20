import request from "supertest";
import app from "../app.js";
import { connectDB } from "../db.js";
import mongoose from "mongoose";

import User from "../models/user.js";
import Movie from "../models/movie.js";
import Category from "../models/category.js";

let user, movie;

beforeAll(async () => {
  await connectDB();

  await User.deleteMany();
  await Movie.deleteMany();
  await Category.deleteMany();

  user = await User.create({
    email: "test@gmail.com",
    password: "123456",
  });

  const category = await Category.create({ name: "Action" });

  movie = await Movie.create({
    title: "Inception",
    categoryIds: [category._id],
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("User Interaction API", () => {
  test("POST /api/history", async () => {
    const res = await request(app).post("/api/history").send({
      userId: user._id,
      movieId: movie._id,
      watchTime: 120,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("_id");
  });

  test("POST /api/rating", async () => {
    const res = await request(app).post("/api/rating").send({
      userId: user._id,
      movieId: movie._id,
      rating: 5,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.rating).toBe(5);
  });

  test("GET /api/user/:id/activity", async () => {
    const res = await request(app).get(`/api/user/${user._id}/activity`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("history");
    expect(res.body).toHaveProperty("ratings");
  });
});
