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
import quizRoutes from "./routes/quizRoutes.js";
import courseRoutes from "./routes/courses.js";
import testRoutes from "./routes/tests.js";
import sessionRoutes from "./routes/sessions.js";
import enrollmentRoutes from "./routes/enrollments.js";
import chatRoutes from "./routes/chat.js";
import { initializeScheduledJobs } from "./utils/scheduler.js";

dotenv.config();

const app = express();

// ✅ Serve static uploads folder
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ✅ Configure CORS securely
const allowedOrigins = [
  process.env.CLIENT_URL || "https://vidhya-share.vercel.app", // Frontend on Vercel
  "http://localhost:5173", // Local frontend (Vite)
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like Postman, mobile apps, or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`❌ CORS blocked for origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// ✅ Parse incoming JSON
app.use(express.json());

// ✅ API Routes
app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/skills", skillsRoutes);
app.use("/user-skills", userSkillsRoutes);
app.use("/explore", exploreRoutes);
app.use("/request", requestRoutes);
app.use("/quiz", quizRoutes);
app.use("/courses", courseRoutes);
app.use("/enrollments", enrollmentRoutes);
app.use("/sessions", sessionRoutes);
app.use("/chat", chatRoutes);
app.use("/tests", testRoutes);

// ✅ Root route for health check / testing
app.get("/", (req, res) => {
  res.status(200).send("✅ VidhyaShare Backend is running successfully!");
});

// ✅ Initialize background/scheduled jobs
initializeScheduledJobs();

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(", ")}`);
});
