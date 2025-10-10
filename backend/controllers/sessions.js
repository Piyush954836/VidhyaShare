import agora from 'agora-access-token';
import { supabase } from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid'; // Install uuid: npm install uuid

const { RtcTokenBuilder, RtcRole } = agora;

const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

// --- TEACHER: Schedule a new live session ---
export const createSession = async (req, res) => {
    const teacher_id = req.user.id;
    const { course_id, title, description, session_type, scheduled_at, duration_minutes, max_students } = req.body;

    if (!title || !session_type || !scheduled_at) {
        return res.status(400).json({ error: 'Title, session type, and scheduled time are required.' });
    }

    try {
        const channel_name = uuidv4(); // Generate a unique channel name
        const { data, error } = await supabase
            .from('live_sessions')
            .insert({ teacher_id, course_id, title, description, session_type, scheduled_at, duration_minutes, max_students, channel_name })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ message: 'Live session scheduled successfully.', session: data });
    } catch (err) {
        console.error('[ERROR] Creating live session:', err);
        res.status(500).json({ error: 'Failed to schedule session.' });
    }
};

// --- STUDENT: Book a spot in a session ---
export const bookSession = async (req, res) => {
    const { sessionId } = req.params;
    const student_id = req.user.id;

    try {
        // TODO: Add logic to check if session is full before booking
        const { data, error } = await supabase
            .from('session_bookings')
            .insert({ session_id: sessionId, student_id })
            .select()
            .single();
        
        if (error) {
             if (error.code === '23505') return res.status(409).json({ error: 'You have already booked this session.' });
             throw error;
        }
        res.status(201).json({ message: 'Session booked successfully.', booking: data });
    } catch (err) {
        console.error('[ERROR] Booking session:', err);
        res.status(500).json({ error: 'Failed to book session.' });
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
        return res.status(500).json({ error: 'Agora credentials are not configured on the server.' });
    }

    try {
        const { data: session, error } = await supabase.from('live_sessions').select('channel_name, teacher_id').eq('id', sessionId).single();
        if (error || !session) return res.status(404).json({ error: 'Session not found.' });
        
        // TODO: Add robust logic to verify this user is the teacher or has a booking
        
        const token = RtcTokenBuilder.buildTokenWithUid(
            AGORA_APP_ID, AGORA_APP_CERTIFICATE, session.channel_name, 0,
            RtcRole.PUBLISHER, privilegeExpiredTs
        );

        res.json({ token, channelName: session.channel_name, appId: AGORA_APP_ID });

    } catch (err) {
        console.error('[ERROR] Generating Agora token:', err);
        res.status(500).json({ error: 'Could not get credentials to join session.' });
    }
};

// --- HELPER: Get all available sessions ---
export const listSessions = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('live_sessions')
            .select(`*, teacher:profiles(full_name, avatar_url)`)
            .eq('status', 'scheduled')
            .order('scheduled_at', { ascending: true });
        
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('[ERROR] Listing sessions:', err);
        res.status(500).json({ error: 'Failed to fetch sessions.' });
    }
};