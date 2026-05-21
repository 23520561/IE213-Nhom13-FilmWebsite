import { gql } from "graphql-tag";
import { server } from "../../app.js";
import User from "../../models/user.js";
import Movie from "../../models/movie.js";
import Genre from "../../models/genres.js";
import Comment from "../../models/comments.js";
import Rating from "../../models/ratings.js";
import { executeGraphQL } from "../helpers.js";
import { signToken } from "../../utils/auth.js";

describe("Authorization - Role-Based Access Control", () => {
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
      poster: "fj",
    });
  });

  describe("Movie Admin-Only Access", () => {
    test("admin can create movies", async () => {
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
            title: "Admin Movie",
            description: "Created by admin",
            genres: [testGenre._id.toString()],
            poster: "jk",
          },
        },
        adminToken,
      );

      expect(result.errors).toBeUndefined();
      expect(result.data.createMovie.title).toBe("Admin Movie");
    });

    test("non-admin user cannot create movies", async () => {
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
            title: "Hacker Movie",
            description: "Trying to create",
            genres: [testGenre._id.toString()],
          },
        },
        userToken,
      );

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("admin");
    });

    test("non-admin user cannot update movies", async () => {
      const mutation = gql`
        mutation UpdateMovie($id: ID!, $input: UpdateMovieInput!) {
          updateMovie(id: $id, input: $input) {
            id
            title
          }
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        {
          id: testMovie._id.toString(),
          input: { title: "Hacked" },
        },
        userToken,
      );

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("admin");
    });

    test("non-admin user cannot delete movies", async () => {
      const mutation = gql`
        mutation DeleteMovie($id: ID!) {
          deleteMovie(id: $id)
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        { id: testMovie._id.toString() },
        userToken,
      );

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("admin");
    });
  });

  describe("Genre Admin-Only Access", () => {
    test("admin can create genres", async () => {
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
        adminToken,
      );

      expect(result.errors).toBeUndefined();
      expect(result.data.createGenre.name).toBe("Comedy");
    });

    test("non-admin user cannot create genres", async () => {
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
          input: { name: "Drama", slug: "drama" },
        },
        userToken,
      );

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("admin");
    });

    test("non-admin user cannot update genres", async () => {
      const mutation = gql`
        mutation UpdateGenre($id: ID!, $input: UpdateGenreInput!) {
          updateGenre(id: $id, input: $input) {
            id
            name
          }
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        {
          id: testGenre._id.toString(),
          input: { name: "Modified" },
        },
        userToken,
      );

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("admin");
    });

    test("non-admin user cannot delete genres", async () => {
      const mutation = gql`
        mutation DeleteGenre($id: ID!) {
          deleteGenre(id: $id)
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        { id: testGenre._id.toString() },
        userToken,
      );

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("admin");
    });
  });

  describe("Rating Ownership Access", () => {
    test("user can only update their own rating", async () => {
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
        { ratingId: rating._id.toString(), rating: 9 },
        userToken,
      );

      expect(result.errors).toBeUndefined();
      expect(result.data.updateRating.rating).toBe(9);
    });

    test("user cannot update other user's rating", async () => {
      const otherUser = await User.create({
        username: "otheruser",
        email: "other@test.com",
        password: "hashedpassword",
        role: "user",
      });

      const rating = await Rating.create({
        user: otherUser._id,
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
        { ratingId: rating._id.toString(), rating: 1 },
        userToken,
      );

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("Forbidden");
    });

    test("admin can update any user's rating", async () => {
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
        { ratingId: rating._id.toString(), rating: 2 },
        adminToken,
      );

      expect(result.errors).toBeUndefined();
      expect(result.data.updateRating.rating).toBe(2);
    });
  });

  describe("Comment Ownership Access", () => {
    test("user can only update their own comment", async () => {
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
          }
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        { commentId: comment._id.toString(), content: "Updated" },
        userToken,
      );

      expect(result.errors).toBeUndefined();
      expect(result.data.updateComment.content).toBe("Updated");
    });

    test("user cannot update other user's comment", async () => {
      const otherUser = await User.create({
        username: "otheruser",
        email: "other@test.com",
        password: "hashedpassword",
        role: "user",
      });

      const comment = await Comment.create({
        user: otherUser._id,
        movie: testMovie._id,
        content: "Other user's comment",
      });

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
        { commentId: comment._id.toString(), content: "Hacked!" },
        userToken,
      );

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("Forbidden");
    });

    test("admin can update any user's comment", async () => {
      const comment = await Comment.create({
        user: regularUser._id,
        movie: testMovie._id,
        content: "User comment",
      });

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
        { commentId: comment._id.toString(), content: "Modified by admin" },
        adminToken,
      );

      expect(result.errors).toBeUndefined();
      expect(result.data.updateComment.content).toBe("Modified by admin");
    });

    test("user can only delete their own comment", async () => {
      const comment = await Comment.create({
        user: regularUser._id,
        movie: testMovie._id,
        content: "To delete",
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
    });

    test("user cannot delete other user's comment", async () => {
      const otherUser = await User.create({
        username: "otheruser",
        email: "other@test.com",
        password: "hashedpassword",
        role: "user",
      });

      const comment = await Comment.create({
        user: otherUser._id,
        movie: testMovie._id,
        content: "Other user's comment",
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

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("Forbidden");
    });
  });

  describe("Unauthenticated Access", () => {
    test("unauthenticated user cannot create rating", async () => {
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
        rating: 5,
      });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("Unauthorized");
    });

    test("unauthenticated user cannot create comment", async () => {
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
        content: "Comment",
      });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("Unauthorized");
    });

    test("unauthenticated user cannot create movie", async () => {
      const mutation = gql`
        mutation CreateMovie($input: CreateMovieInput!) {
          createMovie(input: $input) {
            id
            title
          }
        }
      `;

      const result = await executeGraphQL(server, mutation, {
        input: {
          title: "Movie",
          description: "Desc",
          genres: [testGenre._id.toString()],
        },
      });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("Unauthorized");
    });

    test("unauthenticated user cannot create genre", async () => {
      const mutation = gql`
        mutation CreateGenre($input: CreateGenreInput!) {
          createGenre(input: $input) {
            id
            name
          }
        }
      `;

      const result = await executeGraphQL(server, mutation, {
        input: { name: "Genre", slug: "genre" },
      });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("Unauthorized");
    });
  });

  describe("User Role Escalation Prevention", () => {
    test("non-admin user cannot change their own role to admin", async () => {
      const mutation = gql`
        mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
          updateUser(id: $id, input: $input) {
            id
            role
          }
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        {
          id: regularUser._id.toString(),
          input: { role: "admin" },
        },
        userToken,
      );

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("admin");
    });

    test("admin can change user's role", async () => {
      const mutation = gql`
        mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
          updateUser(id: $id, input: $input) {
            id
            role
          }
        }
      `;

      const result = await executeGraphQL(
        server,
        mutation,
        {
          id: regularUser._id.toString(),
          input: { role: "admin" },
        },
        adminToken,
      );

      expect(result.errors).toBeUndefined();
      expect(result.data.updateUser.role).toBe("admin");
    });
  });
});
