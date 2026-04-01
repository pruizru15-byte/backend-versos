import express from "express";
import cors from "cors";
import poemRoutes from "./routes/poems.js";
import categoryRoutes from "./routes/categories.js";
import statsRoutes from "./routes/stats.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import contactRoutes from "./routes/contact.js";
import adminCommentsRoutes from "./routes/admin_comments.js";
import passport from "./lib/passport.js";
import path from "path";

const app = express();

app.use(cors({
  origin: ["https://verse-vault-amber.vercel.app", "http://localhost:5173"],
  credentials: true
}));
app.use(express.json());
app.use(passport.initialize());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/poems", poemRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin/comments", adminCommentsRoutes);

export default app;
