import request from "supertest";
import app from "../app.js";
import { connectDB } from "../db.js";
import mongoose from "mongoose";
import { getAdminToken } from "./helpers/authHelper.js";

import Category from "../models/category.js";

let token;
let authHeader;
let categoryId;

beforeAll(async () => {
  await connectDB();
  token = await getAdminToken();
  authHeader = `Bearer ${token}`;
  // clean categories before tests
  await Category.deleteMany();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Admin Category CRUD API", () => {
  //
  // CREATE
  //
  test("POST /api/admin/categories - create category", async () => {
    const res = await request(app)
      .post("/api/admin/categories")
      .set("Authorization", authHeader)
      .send({
        name: "Action",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe("Action");

    categoryId = res.body._id;
  });

  //
  // GET ALL
  //
  test("GET /api/admin/categories - get all categories", async () => {
    const res = await request(app)
      .get("/api/admin/categories")
      .set("Authorization", authHeader);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  //
  // GET ONE
  //
  test("GET /api/admin/categories/:id - get category", async () => {
    const res = await request(app)
      .get(`/api/admin/categories/${categoryId}`)
      .set("Authorization", authHeader);

    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(categoryId);
  });

  //
  // UPDATE
  //
  test("PUT /api/admin/categories/:id - update category", async () => {
    const res = await request(app)
      .put(`/api/admin/categories/${categoryId}`)
      .set("Authorization", authHeader)
      .send({
        name: "Action Updated",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Action Updated");
  });

  //
  // DELETE
  //
  test("DELETE /api/admin/categories/:id - delete category", async () => {
    const res = await request(app)
      .delete(`/api/admin/categories/${categoryId}`)
      .set("Authorization", authHeader);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Category deleted successfully");
  });
});
