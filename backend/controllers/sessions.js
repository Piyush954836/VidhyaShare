import agora from "agora-access-token";
import { supabase } from "../config/supabase.js";
import { v4 as uuidv4 } from "uuid"; // Install uuid: npm install uuid
import axios from "axios";

const { RtcTokenBuilder, RtcRole } = agora;

const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

// --- TEACHER: Schedule a new live session ---
export const createSession = async (req, res) => {
  const teacher_id = req.user.id;
  const {
    title,
    course_id,
    topic_id,
    subtopics,
    description,
    session_type,
    scheduled_at,
    duration_minutes,
    max_students,
  } = req.body;

  // Safe log (exclude channel_name for now)
  console.log({
    teacher_id,
    title,
    course_id,
    topic_id,
    subtopics,
    description,
    session_type,
    scheduled_at,
    duration_minutes,
    max_students
    // channel_name will be generated below
  });

  // Validation: Require topic, subtopics, session type, scheduled time
  if (!topic_id || !subtopics || !session_type || !scheduled_at) {
    return res
      .status(400)
      .json({
        error:
          "Topic, subtopics, session type, and scheduled time are required.",
      });
  }

  try {
    const channel_name = uuidv4();
    // You can log channel_name here if needed
    // console.log('channel_name:', channel_name);
    const { data, error } = await supabase
      .from("live_sessions")
      .insert({
        teacher_id,
        title,
        course_id,
        topic_id,
        subtopics,
        description,
        session_type,
        scheduled_at,
        duration_minutes,
        max_students,
        channel_name,
      })
      .select()
      .single();

    if (error) throw error;
    res
      .status(201)
      .json({ message: "Live session scheduled successfully.", session: data });
  } catch (err) {
    console.error("[ERROR] Creating live session:", err);
    res.status(500).json({ error: "Failed to schedule session." });
  }
};


// --- STUDENT: Book a spot in a session ---
export const bookSession = async (req, res) => {
  const { sessionId } = req.params;
  const student_id = req.user.id;

  try {
    // TODO: Add logic to check if session is full before booking
    const { data, error } = await supabase
      .from("session_bookings")
      .insert({ session_id: sessionId, student_id })
      .select()
      .single();

    if (error) {
      if (error.code === "23505")
        return res
          .status(409)
          .json({ error: "You have already booked this session." });
      throw error;
    }
    res
      .status(201)
      .json({ message: "Session booked successfully.", booking: data });
  } catch (err) {
    console.error("[ERROR] Booking session:", err);
    res.status(500).json({ error: "Failed to book session." });
  }
};

// --- ANY USER: Get credentials to join a session ---
export const getJoinToken = async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.id;
  const expirationTimeInSeconds = 3600; // Token is valid for 1 hour
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
    return res.status(500).json({ error: "Agora credentials are not configured on the server." });
  }

  try {
    // Get the session, including teacher_id and course_id
    const { data: session, error } = await supabase
      .from("live_sessions")
      .select("channel_name, teacher_id, course_id")
      .eq("id", sessionId)
      .single();
    if (error || !session)
      return res.status(404).json({ error: "Session not found." });

    // Only the session's teacher OR an enrolled student can join
    if (session.teacher_id !== userId) {
      // Check if the user is enrolled in the course
      const { data: enrollment, error: enrollError } = await supabase
        .from("course_enrollments")
        .select("id")
        .eq("course_id", session.course_id)
        .eq("student_id", userId)
        .eq("status", "enrolled")
        .single();
      if (enrollError || !enrollment) {
        return res.status(403).json({ error: "Only enrolled students or the teacher can join this session." });
      }
    }

    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      session.channel_name,
      0,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    res.json({ token, channelName: session.channel_name, appId: AGORA_APP_ID });
  } catch (err) {
    console.error("[ERROR] Generating Agora token:", err);
    res.status(500).json({ error: "Could not get credentials to join session." });
  }
};


// --- HELPER: Get all available sessions for logged-in student ---
export const listSessions = async (req, res) => {
  const userId = req.user.id;

  try {
    // Step 1️⃣: Get enrolled course IDs
    const { data: enrollments, error: enrollError } = await supabase
      .from("course_enrollments")
      .select("course_id")
      .eq("student_id", userId)
      .eq("status", "enrolled");

    if (enrollError) throw enrollError;

    const courseIds = enrollments.map((e) => e.course_id);
    if (!courseIds.length) return res.json([]);

    // Step 2️⃣: Fetch all upcoming sessions from those courses
    const { data: sessions, error: sessionError } = await supabase
      .from("live_sessions")
      .select(
        `
                *,
                teacher:profiles(full_name, avatar_url),
                course:courses(id, title)
            `
      )
      .in("course_id", courseIds)
      .eq("status", "scheduled")
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true });

    if (sessionError) throw sessionError;

    res.json(sessions || []);
  } catch (err) {
    console.error("[ERROR] Listing sessions:", err);
    res.status(500).json({ error: "Failed to fetch sessions." });
  }
};

// GET /sessions?topic_id=...
export const listSessionsByTopic = async (req, res) => {
  const { topic_id } = req.query;
  try {
    const { data, error } = await supabase
      .from("live_sessions")
      .select("*")
      .eq("topic_id", topic_id)
      .order("scheduled_at", { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch topic sessions." });
  }
};

// --- REMOVE & BLOCK a user from a session ---
export const blockUserFromSession = async (req, res) => {
  const { channelName, uid } = req.body;
  const AGORA_APP_ID = process.env.AGORA_APP_ID;
  const AGORA_REST_KEY = process.env.AGORA_REST_KEY;
  const AGORA_REST_SECRET = process.env.AGORA_REST_SECRET;

  if (!channelName || uid == null)
    return res.status(400).json({ error: "channelName and uid required." });

  try {
    await axios.post(
      "https://api.agora.io/dev/v1/kicking-rule",
      {
        appid: AGORA_APP_ID,
        cname: channelName,
        uid: Number(uid),
        time_in_seconds: 86400,
        privileges: ["join_channel"]
      },
      {
        auth: {
          username: AGORA_REST_KEY,
          password: AGORA_REST_SECRET
        }
      }
    );
    res.json({ message: "User removed and blocked from session." });
  } catch (err) {
    console.error("[KICK/BAN ERROR]", err.message, err.response?.data);
    res.status(500).json({ error: "Failed to block/remove user." });
  }
};
