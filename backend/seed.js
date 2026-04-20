import { connectDB } from "./db.js";

import User from "./models/user.js";
import Movie from "./models/movie.js";
import Category from "./models/category.js";
import Rating from "./models/rating.js";
import History from "./models/history.js";

async function seed() {
  try {
    await connectDB();

    console.log("🌱 Seeding database...");

    // साफ database (optional but useful for testing)
    await User.deleteMany();
    await Movie.deleteMany();
    await Category.deleteMany();
    await Rating.deleteMany();
    await History.deleteMany();

    // 1. Create users
    const user = await User.create({
      email: "test@gmail.com",
      password: "123456",
    });

    // 2. Create categories
    const action = await Category.create({ name: "Action" });
    const drama = await Category.create({ name: "Drama" });

    // 3. Create movies
    const movie1 = await Movie.create({
      title: "Inception",
      description: "A mind-bending thriller",
      categoryIds: [action._id],
    });

    const movie2 = await Movie.create({
      title: "The Dark Knight",
      description: "Batman vs Joker",
      categoryIds: [action._id, drama._id],
    });

    // 4. Create history
    await History.create({
      userId: user._id,
      movieId: movie1._id,
      watchTime: 120,
    });

    // 5. Create rating
    await Rating.create({
      userId: user._id,
      movieId: movie1._id,
      rating: 5,
    });

    console.log("✅ Done seeding!\n");

    console.log("👉 Use these IDs for testing:\n");
    console.log("User ID:", user._id.toString());
    console.log("Movie 1 ID:", movie1._id.toString());
    console.log("Movie 2 ID:", movie2._id.toString());

    process.exit();
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

seed();
