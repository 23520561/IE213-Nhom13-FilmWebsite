import request from "supertest";
import app from "../app.js";
import { connectDB } from "../db.js";
import mongoose from "mongoose";

import Movie from "../models/movie.js";
import Category from "../models/category.js";
import { getAdminToken } from "./helpers/authHelper.js";

let token;
let authHeader;
let category;
let movieId;

beforeAll(async () => {
  await connectDB();
  token = await getAdminToken();
  authHeader = `Bearer ${token}`;
  // clean DB
  await Movie.deleteMany();
  await Category.deleteMany();

  // seed category
  category = await Category.create({ name: "Action" });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Admin Movie CRUD API", () => {
  //
  // CREATE
  //
  test("POST /api/admin/movies - create movie", async () => {
    const res = await request(app)
      .post("/api/admin/movies")
      .set("Authorization", authHeader)
      .send({
        title: "Inception",
        description: "Dream world",
        categoryIds: [category._id],
        thumbnail: "test.jpg",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe("Inception");

    movieId = res.body._id;
  });

  //
  // GET ALL
  //
  test("GET /api/admin/movies - get all movies", async () => {
    const res = await request(app)
      .get("/api/admin/movies")
      .set("Authorization", authHeader);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  //
  // GET ONE
  //
  test("GET /api/admin/movies/:id - get movie by id", async () => {
    const res = await request(app)
      .get(`/api/admin/movies/${movieId}`)
      .set("Authorization", authHeader);

    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(movieId);
  });

  //
  // UPDATE
  //
  test("PUT /api/admin/movies/:id - update movie", async () => {
    const res = await request(app)
      .put(`/api/admin/movies/${movieId}`)
      .set("Authorization", authHeader)
      .send({
        title: "Inception Updated",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe("Inception Updated");
  });

  //
  // DELETE
  //
  test("DELETE /api/admin/movies/:id - delete movie", async () => {
    const res = await request(app)
      .delete(`/api/admin/movies/${movieId}`)
      .set("Authorization", authHeader);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Movie deleted successfully");
  });
});
