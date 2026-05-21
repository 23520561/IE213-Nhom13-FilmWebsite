import { gql } from "graphql-tag";
import { server } from "../../app.js";
import User from "../../models/user.js";
import Genre from "../../models/genres.js";
import Movie from "../../models/movie.js";
import { executeGraphQL } from "../helpers.js";
import { signToken } from "../../utils/auth.js";

describe("Input Validation", () => {
  let adminUser, adminToken, testGenre;

  beforeEach(async () => {
    adminUser = await User.create({
      username: "admin",
      email: "admin@test.com",
      password: "hashedpassword",
      role: "admin",
    });
    adminToken = signToken(adminUser._id, adminUser.role);

    testGenre = await Genre.create({
      name: "Action",
      slug: "action",
    });
  });

  describe("Email Validation", () => {
    test("should reject invalid email format", async () => {
      const mutation = gql`
        mutation Register(
          $username: String!
          $email: String!
          $password: String!
        ) {
          register(username: $username, email: $email, password: $password) {
            user {
              id
            }
            token
          }
        }
      `;

      const invalidEmails = [
        "notanemail",
        "missing@domain",
        "@nodomain.com",
        "spaces in@email.com",
        "double@@domain.com",
      ];

      for (const email of invalidEmails) {
        const result = await executeGraphQL(server, mutation, {
          username: "testuser",
          email,
          password: "ValidPass123",
        });

        expect(result.errors).toBeDefined();
        expect(result.errors[0].message).toContain("Invalid email");
      }
    });

    test("should accept valid email formats", async () => {
      const mutation = gql`
        mutation Register(
          $username: String!
          $email: String!
          $password: String!
        ) {
          register(username: $username, email: $email, password: $password) {
            user {
              id
              email
            }
            token
          }
        }
      `;

      const validEmails = [
        "user@example.com",
        "john.doe@company.co.uk",
        "test+tag@domain.org",
        "123@numbers.io",
      ];

      for (const email of validEmails) {
        const safeUsername = email
          .split("@")[0]
          .replace(/[^a-zA-Z0-9_-]/g, "_");
        const username = `user_${safeUsername}`;
        const result = await executeGraphQL(server, mutation, {
          username: username,
          email,
          password: "ValidPass123",
        });

        expect(result.errors).toBeUndefined();
        expect(result.data.register.user.email).toBe(email);
      }
    });
  });

  describe("Username Validation", () => {
    test("should reject username < 3 chars", async () => {
      const mutation = gql`
        mutation Register(
          $username: String!
          $email: String!
          $password: String!
        ) {
          register(username: $username, email: $email, password: $password) {
            user {
              id
            }
            token
          }
        }
      `;

      const result = await executeGraphQL(server, mutation, {
        username: "ab",
        email: "test@example.com",
        password: "ValidPass123",
      });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("Invalid username");
    });

    test("should reject username with special chars (except - and _)", async () => {
      const mutation = gql`
        mutation Register(
          $username: String!
          $email: String!
          $password: String!
        ) {
          register(username: $username, email: $email, password: $password) {
            user {
              id
            }
            token
          }
        }
      `;

      const invalidUsernames = [
        "user@name",
        "user!name",
        "user#name",
        "user name",
        "user.name",
      ];

      for (const username of invalidUsernames) {
        const result = await executeGraphQL(server, mutation, {
          username,
          email: `${username}@test.com`,
          password: "ValidPass123",
        });

        expect(result.errors).toBeDefined();
      }
    });

    test("should accept valid usernames", async () => {
      const mutation = gql`
        mutation Register(
          $username: String!
          $email: String!
          $password: String!
        ) {
          register(username: $username, email: $email, password: $password) {
            user {
              id
              username
            }
            token
          }
        }
      `;

      const validUsernames = [
        "user123",
        "test_user",
        "user-name",
        "user123_abc",
      ];

      for (let i = 0; i < validUsernames.length; i++) {
        const username = validUsernames[i];
        const result = await executeGraphQL(server, mutation, {
          username,
          email: `user${i}@example.com`,
          password: "ValidPass123",
        });

        expect(result.errors).toBeUndefined();
        expect(result.data.register.user.username).toBe(username);
      }
    });
  });

  describe("Password Validation", () => {
    test("should reject password < 8 chars", async () => {
      const mutation = gql`
        mutation Register(
          $username: String!
          $email: String!
          $password: String!
        ) {
          register(username: $username, email: $email, password: $password) {
            user {
              id
            }
            token
          }
        }
      `;

      const result = await executeGraphQL(server, mutation, {
        username: "testuser",
        email: "test@example.com",
        password: "Pass12",
      });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("8 chars");
    });

    test("should reject password without number", async () => {
      const mutation = gql`
        mutation Register(
          $username: String!
          $email: String!
          $password: String!
        ) {
          register(username: $username, email: $email, password: $password) {
            user {
              id
            }
            token
          }
        }
      `;

      const result = await executeGraphQL(server, mutation, {
        username: "testuser",
        email: "test@example.com",
        password: "PasswordNoNumber",
      });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("1 number");
    });

    test("should accept valid passwords", async () => {
      const mutation = gql`
        mutation Register(
          $username: String!
          $email: String!
          $password: String!
        ) {
          register(username: $username, email: $email, password: $password) {
            user {
              id
              username
            }
            token
          }
        }
      `;

      const validPasswords = ["Pass1234", "Test@Pass999", "12345678abcd"];

      for (let i = 0; i < validPasswords.length; i++) {
        const password = validPasswords[i];
        const result = await executeGraphQL(server, mutation, {
          username: `user${i}`,
          email: `user${i}@example.com`,
          password,
        });

        expect(result.errors).toBeUndefined();
        expect(result.data.register.user.id).toBeDefined();
      }
    });
  });

  describe("Rating Validation", () => {
    let testMovie;

    beforeEach(async () => {
      testMovie = await Movie.create({
        movielensId: "123",
        tmdbId: 456,
        title: "Test Movie",
        description: "Test",
        genres: [testGenre._id],
        releaseYear: 2024,
        poster: "js",
      });
    });

    test("should reject rating < 1", async () => {
      const mutation = gql`
        mutation CreateRating($movieId: ID!, $rating: Int!) {
          createRating(movieId: $movieId, rating: $rating) {
            id
            rating
          }
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        { movieId: testMovie._id.toString(), rating: 0 },
        adminToken,
      );

      expect(result.errors).toBeDefined();
    });

    test("should reject rating > 10", async () => {
      const mutation = gql`
        mutation CreateRating($movieId: ID!, $rating: Int!) {
          createRating(movieId: $movieId, rating: $rating) {
            id
            rating
          }
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        { movieId: testMovie._id.toString(), rating: 11 },
        adminToken,
      );

      expect(result.errors).toBeDefined();
    });

    test("should accept ratings 1-10", async () => {
      const mutation = gql`
        mutation CreateRating($movieId: ID!, $rating: Int!) {
          createRating(movieId: $movieId, rating: $rating) {
            id
            rating
          }
        }
      `;

      for (let rating = 1; rating <= 10; rating++) {
        const testUser = await User.create({
          username: `user${rating}`,
          email: `user${rating}@test.com`,
          password: "hashedpassword",
          role: "user",
        });
        const userToken = signToken(testUser._id, testUser.role);

        const result = await executeGraphQL(
          server,
          mutation,
          { movieId: testMovie._id.toString(), rating },
          userToken,
        );

        expect(result.errors).toBeUndefined();
        expect(result.data.createRating.rating).toBe(rating);
      }
    });
  });

  describe("Comment Content Validation", () => {
    let testMovie, userToken, testUser;

    beforeEach(async () => {
      testMovie = await Movie.create({
        movielensId: "123",
        tmdbId: 456,
        title: "Test Movie",
        description: "Test",
        genres: [testGenre._id],
        releaseYear: 2024,
        poster: "js",
      });

      testUser = await User.create({
        username: "commenter",
        email: "commenter@test.com",
        password: "hashedpassword",
        role: "user",
      });
      userToken = signToken(testUser._id, testUser.role);
    });

    test("should reject empty comment", async () => {
      const mutation = gql`
        mutation CreateComment($movieId: ID!, $content: String!) {
          createComment(movieId: $movieId, content: $content) {
            id
            content
          }
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        { movieId: testMovie._id.toString(), content: "" },
        userToken,
      );

      expect(result.errors).toBeDefined();
    });

    test("should reject comment with only whitespace", async () => {
      const mutation = gql`
        mutation CreateComment($movieId: ID!, $content: String!) {
          createComment(movieId: $movieId, content: $content) {
            id
            content
          }
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        { movieId: testMovie._id.toString(), content: "   " },
        userToken,
      );

      expect(result.errors).toBeDefined();
    });

    test("should reject comment > 1000 chars", async () => {
      const mutation = gql`
        mutation CreateComment($movieId: ID!, $content: String!) {
          createComment(movieId: $movieId, content: $content) {
            id
            content
          }
        }
      `;

      const longContent = "a".repeat(1001);

      const result = await executeGraphQL(
        server,
        mutation,
        { movieId: testMovie._id.toString(), content: longContent },
        userToken,
      );

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("1000 characters");
    });

    test("should accept valid comment lengths", async () => {
      const mutation = gql`
        mutation CreateComment($movieId: ID!, $content: String!) {
          createComment(movieId: $movieId, content: $content) {
            id
            content
          }
        }
      `;

      const validLengths = [1, 100, 500, 1000];

      for (let i = 0; i < validLengths.length; i++) {
        const content = "a".repeat(validLengths[i]);
        const testUser2 = await User.create({
          username: `user_comment_${i}`,
          email: `comment${i}@test.com`,
          password: "hashedpassword",
          role: "user",
        });
        const userToken2 = signToken(testUser2._id, testUser2.role);

        const result = await executeGraphQL(
          server,
          mutation,
          { movieId: testMovie._id.toString(), content },
          userToken2,
        );

        expect(result.errors).toBeUndefined();
        expect(result.data.createComment.content.length).toBe(validLengths[i]);
      }
    });
  });

  describe("Movie Input Validation", () => {
    test("should reject movie without title", async () => {
      const mutation = gql`
        mutation CreateMovie($input: CreateMovieInput!) {
          createMovie(input: $input) {
            id
            title
          }
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        {
          input: {
            title: "",
            description: "Description",
            genres: [testGenre._id.toString()],
          },
        },
        adminToken,
      );

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("required");
    });

    test("should reject movie without description", async () => {
      const mutation = gql`
        mutation CreateMovie($input: CreateMovieInput!) {
          createMovie(input: $input) {
            id
            title
          }
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        {
          input: {
            title: "Valid Title",
            description: "",
            genres: [testGenre._id.toString()],
          },
        },
        adminToken,
      );

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("required");
    });

    test("should reject movie without genres", async () => {
      const mutation = gql`
        mutation CreateMovie($input: CreateMovieInput!) {
          createMovie(input: $input) {
            id
            title
          }
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        {
          input: {
            title: "Valid Title",
            description: "Valid Description",
            genres: [],
          },
        },
        adminToken,
      );

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("genre");
    });

    test("should accept valid movie input", async () => {
      const mutation = gql`
        mutation CreateMovie($input: CreateMovieInput!) {
          createMovie(input: $input) {
            id
            title
            description
          }
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        {
          input: {
            title: "Valid Title",
            description: "Valid Description",
            genres: [testGenre._id.toString()],
            poster: "js",
          },
        },
        adminToken,
      );

      expect(result.errors).toBeUndefined();
      expect(result.data.createMovie.title).toBe("Valid Title");
      expect(result.data.createMovie.description).toBe("Valid Description");
    });
  });

  describe("Genre Input Validation", () => {
    test("should reject genre without name", async () => {
      const mutation = gql`
        mutation CreateGenre($input: CreateGenreInput!) {
          createGenre(input: $input) {
            id
            name
          }
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        { input: { name: "", slug: "test" } },
        adminToken,
      );

      expect(result.errors).toBeDefined();
    });

    test("should reject genre without slug", async () => {
      const mutation = gql`
        mutation CreateGenre($input: CreateGenreInput!) {
          createGenre(input: $input) {
            id
            slug
          }
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        { input: { name: "TestGenre", slug: "" } },
        adminToken,
      );

      expect(result.errors).toBeDefined();
    });

    test("should accept valid genre input", async () => {
      const mutation = gql`
        mutation CreateGenre($input: CreateGenreInput!) {
          createGenre(input: $input) {
            id
            name
            slug
          }
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        {
          input: {
            name: "NewGenre",
            slug: "new-genre",
            description: "New genre",
          },
        },
        adminToken,
      );

      expect(result.errors).toBeUndefined();
      expect(result.data.createGenre.name).toBe("NewGenre");
      expect(result.data.createGenre.slug).toBe("new-genre");
    });

    test("should reject duplicate genre name", async () => {
      const mutation = gql`
        mutation CreateGenre($input: CreateGenreInput!) {
          createGenre(input: $input) {
            id
            name
          }
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        {
          input: {
            name: "Action",
            slug: "action-duplicate",
          },
        },
        adminToken,
      );

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("already exists");
    });

    test("should reject duplicate genre slug", async () => {
      const mutation = gql`
        mutation CreateGenre($input: CreateGenreInput!) {
          createGenre(input: $input) {
            id
            slug
          }
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        {
          input: {
            name: "Action Duplicate",
            slug: "action",
          },
        },
        adminToken,
      );

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("already exists");
    });
  });
});
