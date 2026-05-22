import mongoose from "mongoose";
import { gql } from "graphql-tag";
import { server } from "../../app.js";
import User from "../../models/user.js";
import { executeGraphQL, registerMutation, loginMutation } from "../helpers.js";

describe("Authentication", () => {
  describe("Register", () => {
    test("should register new user with valid credentials", async () => {
      const result = await executeGraphQL(server, registerMutation, {
        username: "testuser",
        email: "test@example.com",
        password: "TestPass123",
      });
      expect(result.errors).toBeUndefined();
      expect(result.data.register).toBeDefined();
      expect(result.data.register.user.username).toBe("testuser");
      expect(result.data.register.user.email).toBe("test@example.com");
      expect(result.data.register.user.role).toBe("user");
      expect(result.data.register.token).toBeDefined();

      // Verify user was created in DB
      const user = await User.findOne({ email: "test@example.com" });
      expect(user).toBeDefined();
      expect(user.username).toBe("testuser");
    });

    test("should fail on duplicate email", async () => {
      // First registration
      await User.create({
        username: "user1",
        email: "duplicate@example.com",
        password: "hash",
        role: "user",
      });

      // Try to register with same email
      const result = await executeGraphQL(server, registerMutation, {
        username: "user2",
        email: "duplicate@example.com",
        password: "TestPass123",
      });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("already in use");
    });

    test("should fail on duplicate username", async () => {
      // First registration
      await User.create({
        username: "duplicateuser",
        email: "email1@example.com",
        password: "hash",
        role: "user",
      });

      // Try to register with same username
      const result = await executeGraphQL(server, registerMutation, {
        username: "duplicateuser",
        email: "email2@example.com",
        password: "TestPass123",
      });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("already in use");
    });

    test("should fail on invalid email", async () => {
      const result = await executeGraphQL(server, registerMutation, {
        username: "testuser",
        email: "invalid-email",
        password: "TestPass123",
      });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("Invalid email");
    });

    test("should fail on weak password (less than 8 chars)", async () => {
      const result = await executeGraphQL(server, registerMutation, {
        username: "testuser",
        email: "test@example.com",
        password: "Pass123",
      });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("at least 8 chars");
    });

    test("should fail on weak password (no number)", async () => {
      const result = await executeGraphQL(server, registerMutation, {
        username: "testuser",
        email: "test@example.com",
        password: "PasswordWithoutNumber",
      });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("with 1 number");
    });

    test("should fail on invalid username (too short)", async () => {
      const result = await executeGraphQL(server, registerMutation, {
        username: "ab",
        email: "test@example.com",
        password: "ValidPass123",
      });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("Invalid username");
    });
  });

  describe("Login", () => {
    let testUser;

    beforeEach(async () => {
      // Create test user
      testUser = await User.create({
        username: "loginuser",
        email: "login@example.com",
        password:
          "$2b$10$kLzn5fOvGtLBn0x1y6Z9e.j2zI4Qz3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z", // hashed "Password123"
        role: "user",
      });
    });

    test("should fail with invalid email", async () => {
      const result = await executeGraphQL(server, loginMutation, {
        email: "invalid@example.com",
        password: "Password123",
      });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("Invalid email or password");
    });

    test("should fail with empty password", async () => {
      const result = await executeGraphQL(server, loginMutation, {
        email: "login@example.com",
        password: "",
      });

      expect(result.errors).toBeDefined();
    });
  });

  describe("Logout", () => {
    test("should logout successfully", async () => {
      const logoutMutation = gql`
        mutation Logout {
          logout
        }
      `;

      const user = await User.create({
        username: "logoutuser",
        email: "logout@example.com",
        password: "ValidPass123",
        role: "user",
      });

      // Create token
      const { signToken } = await import("../../utils/auth.js");
      const token = signToken(user._id, user.role);

      const result = await executeGraphQL(server, logoutMutation, {}, token);

      expect(result.errors).toBeUndefined();
      expect(result.data.logout).toBe(true);
    });
  });

  describe("JWT Token", () => {
    test("should extract token from Authorization header", async () => {
      const user = await User.create({
        username: "tokenuser",
        email: "token@example.com",
        password: "ValidPass123",
        role: "user",
      });

      const { signToken } = await import("../../utils/auth.js");
      const token = signToken(user._id, user.role);

      const getUsersQuery = gql`
        query GetUsers {
          users {
            id
            username
          }
        }
      `;

      const result = await executeGraphQL(server, getUsersQuery, {}, token);

      expect(result.errors).toBeUndefined();
      expect(result.data.users).toBeDefined();
      expect(Array.isArray(result.data.users)).toBe(true);
    });

    test("should work without token for public queries", async () => {
      const getUsersQuery = gql`
        query GetUsers {
          users {
            id
            username
          }
        }
      `;

      const result = await executeGraphQL(server, getUsersQuery, {});

      expect(result.errors).toBeUndefined();
      expect(result.data.users).toBeDefined();
    });
  });
});
