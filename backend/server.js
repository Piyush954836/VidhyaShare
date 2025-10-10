import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import skillsRoutes from "./routes/skillsRoutes.js";
import userSkillsRoutes from "./routes/userSkillsRoutes.js";
import exploreRoutes from "./routes/exploreRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import quizRoutes from "./routes/quizRoutes.js"; // <-- 1. IMPORT a NEW ROUTE
import courseRoutes from "./routes/courses.js"; 
import testRoutes from './routes/tests.js';
import sessionRoutes from "./routes/sessions.js";
import enrollmentRoutes from "./routes/enrollments.js";
import chatRoutes from "./routes/chat.js";
import { initializeScheduledJobs } from './utils/scheduler.js';

dotenv.config();
const app = express();

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use(cors());
app.use(express.json());


// Routes
app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/skills", skillsRoutes);
app.use("/user-skills", userSkillsRoutes);
app.use("/explore", exploreRoutes);
app.use("/request", requestRoutes);
app.use("/quiz", quizRoutes); // <-- 2. USE THE NEW ROUTE (prefixed with /api)
app.use("/courses", courseRoutes);
app.use("/enrollments", enrollmentRoutes);
app.use("/sessions", sessionRoutes);
app.use("/chat", chatRoutes);
app.use('/tests', testRoutes);

initializeScheduledJobs();

app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});
