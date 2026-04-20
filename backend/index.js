import { connectDB } from "./db.js";
import app from "./app.js";
import dotenv from "dotenv";
dotenv.config();
const PORT = process.env.PORT;
async function run() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

run();
