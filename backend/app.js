import express from "express";
import cors from "cors";
import userInteractionRoutes from "./routes/userInteraction.routes.js";
import adminMovieRoutes from "./routes/adminMovie.routes.js";
import adminCategoryRoutes from "./routes/adminCategory.routes.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

// routes
app.use("/api", userInteractionRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/admin", adminCategoryRoutes);

app.use("/api/admin", adminMovieRoutes);

export default app;
