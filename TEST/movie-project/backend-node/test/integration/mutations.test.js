import { gql } from "graphql-tag";
import { server } from "../../app.js";
import User from "../../models/user.js";
import Genre from "../../models/genres.js";
import Movie from "../../models/movie.js";
import Rating from "../../models/ratings.js";
import Comment from "../../models/comments.js";
import { executeGraphQL } from "../helpers.js";
import { signToken } from "../../utils/auth.js";

describe("Mutations - CRUD Operations", () => {
  let adminUser, regularUser, adminToken, userToken, testGenre, testMovie;

  beforeEach(async () => {
    // Create admin user
    adminUser = await User.create({
      username: "admin",
      email: "admin@test.com",
      password: "hashedpassword",
      role: "admin",
    });
    adminToken = signToken(adminUser._id, adminUser.role);

    // Create regular user
    regularUser = await User.create({
      username: "regularuser",
      email: "user@test.com",
      password: "hashedpassword",
      role: "user",
    });
    userToken = signToken(regularUser._id, regularUser.role);

    // Create test genre
    testGenre = await Genre.create({
      name: "Action",
      slug: "action",
      description: "Action movies",
    });

    // Create test movie
    testMovie = await Movie.create({
      movielensId: "123",
      tmdbId: 456,
      title: "Test Movie",
      description: "Test description",
      genres: [testGenre._id],
      releaseYear: 2024,
      poster: "js",
    });
  });

  describe("Genre Mutations", () => {
    test("admin should create genre", async () => {
      const mutation = gql`
        mutation CreateGenre($input: CreateGenreInput!) {
          createGenre(input: $input) {
            id
            name
            slug
            description
          }
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        {
          input: {
            name: "Drama",
            slug: "drama",
            description: "Drama films",
          },
        },
        adminToken,
      );

      expect(result.errors).toBeUndefined();
      expect(result.data.createGenre.name).toBe("Drama");
      expect(result.data.createGenre.slug).toBe("drama");
    });

    test("non-admin should not create genre", async () => {
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
          input: { name: "Comedy", slug: "comedy" },
        },
        userToken,
      );

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("admin");
    });

    test("admin should update genre", async () => {
      const mutation = gql`
        mutation UpdateGenre($id: ID!, $input: UpdateGenreInput!) {
          updateGenre(id: $id, input: $input) {
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
          id: testGenre._id.toString(),
          input: { name: "Updated Action" },
        },
        adminToken,
      );

      expect(result.errors).toBeUndefined();
      expect(result.data.updateGenre.name).toBe("Updated Action");
    });

    test("admin should delete genre", async () => {
      const mutation = gql`
        mutation DeleteGenre($id: ID!) {
          deleteGenre(id: $id)
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        { id: testGenre._id.toString() },
        adminToken,
      );

      expect(result.errors).toBeUndefined();
      expect(result.data.deleteGenre).toBe(true);

      // Verify deleted
      const genre = await Genre.findById(testGenre._id);
      expect(genre).toBeNull();
    });
  });

  describe("Movie Mutations", () => {
    test("admin should create movie", async () => {
      const mutation = gql`
        mutation CreateMovie($input: CreateMovieInput!) {
          createMovie(input: $input) {
            id
            title
            description
            genres {
              id
              name
            }
          }
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        {
          input: {
            title: "New Movie",
            description: "A new movie",
            genres: [testGenre._id.toString()],
            duration: 120,
            isPremium: false,
            poster: "jf",
          },
        },
        adminToken,
      );

      expect(result.errors).toBeUndefined();
      expect(result.data.createMovie.title).toBe("New Movie");
      expect(result.data.createMovie.genres[0].name).toBe("Action");
    });

    test("non-admin should not create movie", async () => {
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
            title: "Unauthorized Movie",
            description: "Should fail",
            genres: [testGenre._id.toString()],
          },
        },
        userToken,
      );

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("admin");
    });

    test("should fail creating movie without title", async () => {
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
            description: "No title",
            genres: [testGenre._id.toString()],
          },
        },
        adminToken,
      );

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("required");
    });

    test("admin should update movie", async () => {
      const mutation = gql`
        mutation UpdateMovie($id: ID!, $input: UpdateMovieInput!) {
          updateMovie(id: $id, input: $input) {
            id
            title
            isFeatured
          }
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        {
          id: testMovie._id.toString(),
          input: { title: "Updated Title", isFeatured: true },
        },
        adminToken,
      );

      expect(result.errors).toBeUndefined();
      expect(result.data.updateMovie.title).toBe("Updated Title");
      expect(result.data.updateMovie.isFeatured).toBe(true);
    });

    test("admin should delete movie", async () => {
      const mutation = gql`
        mutation DeleteMovie($id: ID!) {
          deleteMovie(id: $id)
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        { id: testMovie._id.toString() },
        adminToken,
      );

      expect(result.errors).toBeUndefined();
      expect(result.data.deleteMovie).toBe(true);

      const movie = await Movie.findById(testMovie._id);
      expect(movie).toBeNull();
    });
  });

  describe("Rating Mutations", () => {
    test("user should create rating", async () => {
      const mutation = gql`
        mutation CreateRating($movieId: ID!, $rating: Int!) {
          createRating(movieId: $movieId, rating: $rating) {
            id
            rating
            user {
              id
              username
            }
            movie {
              id
              title
            }
          }
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        {
          movieId: testMovie._id.toString(),
          rating: 8,
        },
        userToken,
      );

      expect(result.errors).toBeUndefined();
      expect(result.data.createRating.rating).toBe(8);
      expect(result.data.createRating.user.username).toBe("regularuser");
      expect(result.data.createRating.movie.title).toBe("Test Movie");
    });

    test("should fail creating duplicate rating", async () => {
      // Create first rating
      await Rating.create({
        user: regularUser._id,
        movie: testMovie._id,
        rating: 8,
      });

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
        {
          movieId: testMovie._id.toString(),
          rating: 9,
        },
        userToken,
      );

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("already rated");
    });

    test("should fail with invalid rating (out of range)", async () => {
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
        {
          movieId: testMovie._id.toString(),
          rating: 11,
        },
        userToken,
      );

      expect(result.errors).toBeDefined();
    });

    test("user should update own rating", async () => {
      const rating = await Rating.create({
        user: regularUser._id,
        movie: testMovie._id,
        rating: 7,
      });

      const mutation = gql`
        mutation UpdateRating($ratingId: ID!, $rating: Int!) {
          updateRating(ratingId: $ratingId, rating: $rating) {
            id
            rating
          }
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        {
          ratingId: rating._id.toString(),
          rating: 9,
        },
        userToken,
      );

      expect(result.errors).toBeUndefined();
      expect(result.data.updateRating.rating).toBe(9);
    });

    test("user should delete own rating", async () => {
      const rating = await Rating.create({
        user: regularUser._id,
        movie: testMovie._id,
        rating: 8,
      });

      const mutation = gql`
        mutation DeleteRating($ratingId: ID!) {
          deleteRating(ratingId: $ratingId)
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        { ratingId: rating._id.toString() },
        userToken,
      );

      expect(result.errors).toBeUndefined();
      expect(result.data.deleteRating).toBe(true);

      const deleted = await Rating.findById(rating._id);
      expect(deleted).toBeNull();
    });

    test("unauthenticated user should not create rating", async () => {
      const mutation = gql`
        mutation CreateRating($movieId: ID!, $rating: Int!) {
          createRating(movieId: $movieId, rating: $rating) {
            id
            rating
          }
        }
      `;

      const result = await executeGraphQL(server, mutation, {
        movieId: testMovie._id.toString(),
        rating: 8,
      });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("Unauthorized");
    });
  });

  describe("Comment Mutations", () => {
    test("user should create comment", async () => {
      const mutation = gql`
        mutation CreateComment($movieId: ID!, $content: String!) {
          createComment(movieId: $movieId, content: $content) {
            id
            content
            user {
              id
              username
            }
            movie {
              id
              title
            }
            createdAt
          }
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        {
          movieId: testMovie._id.toString(),
          content: "Great movie!",
        },
        userToken,
      );

      expect(result.errors).toBeUndefined();
      expect(result.data.createComment.content).toBe("Great movie!");
      expect(result.data.createComment.user.username).toBe("regularuser");
      expect(result.data.createComment.createdAt).toBeDefined();
    });

    test("should fail creating comment with empty content", async () => {
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
        {
          movieId: testMovie._id.toString(),
          content: "",
        },
        userToken,
      );

      expect(result.errors).toBeDefined();
    });

    test("should fail creating comment with content > 1000 chars", async () => {
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
        {
          movieId: testMovie._id.toString(),
          content: longContent,
        },
        userToken,
      );

      expect(result.errors).toBeDefined();
    });

    test("user should update own comment", async () => {
      const comment = await Comment.create({
        user: regularUser._id,
        movie: testMovie._id,
        content: "Original comment",
      });

      const mutation = gql`
        mutation UpdateComment($commentId: ID!, $content: String!) {
          updateComment(commentId: $commentId, content: $content) {
            id
            content
            updatedAt
          }
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        {
          commentId: comment._id.toString(),
          content: "Updated comment",
        },
        userToken,
      );

      expect(result.errors).toBeUndefined();
      expect(result.data.updateComment.content).toBe("Updated comment");
      expect(result.data.updateComment.updatedAt).toBeDefined();
    });

    test("user should delete own comment", async () => {
      const comment = await Comment.create({
        user: regularUser._id,
        movie: testMovie._id,
        content: "To be deleted",
      });

      const mutation = gql`
        mutation DeleteComment($commentId: ID!) {
          deleteComment(commentId: $commentId)
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        { commentId: comment._id.toString() },
        userToken,
      );

      expect(result.errors).toBeUndefined();
      expect(result.data.deleteComment).toBe(true);

      const deleted = await Comment.findById(comment._id);
      expect(deleted).toBeNull();
    });

    test("other user cannot update comment", async () => {
      const comment = await Comment.create({
        user: regularUser._id,
        movie: testMovie._id,
        content: "Original",
      });

      const anotherUser = await User.create({
        username: "anotheruser",
        email: "another@test.com",
        password: "hashedpassword",
        role: "user",
      });
      const anotherToken = signToken(anotherUser._id, anotherUser.role);

      const mutation = gql`
        mutation UpdateComment($commentId: ID!, $content: String!) {
          updateComment(commentId: $commentId, content: $content) {
            id
            content
          }
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        {
          commentId: comment._id.toString(),
          content: "Hacked!",
        },
        anotherToken,
      );

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("Forbidden");
    });

    test("unauthenticated user should not create comment", async () => {
      const mutation = gql`
        mutation CreateComment($movieId: ID!, $content: String!) {
          createComment(movieId: $movieId, content: $content) {
            id
            content
          }
        }
      `;

      const result = await executeGraphQL(server, mutation, {
        movieId: testMovie._id.toString(),
        content: "Unauthorized comment",
      });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("Unauthorized");
    });
  });
});
