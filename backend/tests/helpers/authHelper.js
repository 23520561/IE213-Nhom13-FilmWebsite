import request from "supertest";
import app from "../../app.js";

export const getAdminToken = async () => {
  await request(app).post("/api/auth/register").send({
    email: "admin@gmail.com",
    password: "123456",
    role: "admin",
  });

  const res = await request(app).post("/api/auth/login").send({
    email: "admin@gmail.com",
    password: "123456",
  });

  return res.body.token;
};
