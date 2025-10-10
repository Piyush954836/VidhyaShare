import { supabase } from '../config/supabase.js';

// --- CREATE A NEW COURSE ---
export const createCourse = async (req, res) => {
    const { skill_id, title, description } = req.body;
    const teacher_id = req.user.id;

    if (!skill_id || !title) {
        return res.status(400).json({ error: 'Skill ID and title are required.' });
    }

    try {
        const { data, error } = await supabase
            .from('courses')
            .insert({ teacher_id, skill_id, title, description })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Handle unique constraint violation
                return res.status(409).json({ error: 'You have already created a course for this skill.' });
            }
            throw error;
        }
        res.status(201).json({ message: 'Course created. Now, please add your topics.', course: data });
    } catch (err) {
        console.error('[ERROR] Creating course:', err);
        res.status(500).json({ error: 'Failed to create course.' });
    }
};

// ADD THIS FUNCTION to controllers/courses.js

// --- GET ALL COURSES FOR THE LOGGED-IN TEACHER ---
export const getMyCourses = async (req, res) => {
    const teacher_id = req.user.id;

    try {
        const { data, error } = await supabase
            .from('courses')
            .select(`
                id,
                title,
                description,
                is_verified,
                skill:skills ( name )
            `)
            .eq('teacher_id', teacher_id);

        if (error) throw error;

        // The frontend expects the skill name nested like course.skill.name,
        // so we need to flatten the response from Supabase.
        const formattedData = data.map(course => ({
            ...course,
            skill: course.skills // This changes the key from 'skills' to 'skill'
        }));

        res.status(200).json(formattedData);
    } catch (err) {
        console.error('[ERROR] Fetching courses:', err);
        res.status(500).json({ error: 'Failed to fetch courses.' });
    }
};

// --- ADD A TOPIC TO A COURSE ---
export const addTopicToCourse = async (req, res) => {
    const { courseId } = req.params;
    const { title, topic_order } = req.body;
    const teacher_id = req.user.id;

    if (!title || topic_order === undefined) {
        return res.status(400).json({ error: 'Topic title and order are required.' });
    }

    try {
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('id')
            .eq('id', courseId)
            .eq('teacher_id', teacher_id)
            .single();

        if (courseError || !course) {
            return res.status(404).json({ error: 'Course not found or you do not have permission to edit it.' });
        }

        const { data, error } = await supabase
            .from('topics')
            .insert({ course_id: courseId, title, topic_order })
            .select()
            .single();
        
        if (error) throw error;
        res.status(201).json({ message: 'Topic added successfully.', topic: data });

    } catch (err) {
        console.error('[ERROR] Adding topic:', err);
        res.status(500).json({ error: 'Failed to add topic.' });
    }
};

// ADD THIS NEW FUNCTION to controllers/courses.js

// --- GET ALL TOPICS FOR A SPECIFIC COURSE ---
export const getTopicsForCourse = async (req, res) => {
    const { courseId } = req.params;
    const teacher_id = req.user.id;

    try {
        // First, get all topics for the course
        const { data: topics, error: topicsError } = await supabase
            .from('topics')
            .select('id, title, topic_order')
            .eq('course_id', courseId)
            .order('topic_order', { ascending: true });

        if (topicsError) throw topicsError;

        // Next, for each topic, check if a 'passed' verification exists for the teacher
        const topicsWithStatus = await Promise.all(topics.map(async (topic) => {
            const { data: verification, error } = await supabase
                .from('teacher_verifications')
                .select('id')
                .eq('teacher_id', teacher_id)
                .eq('topic_id', topic.id)
                .eq('passed', true)
                .limit(1);
            
            if (error) {
                console.error(`Error checking verification for topic ${topic.id}:`, error);
                return { ...topic, is_verified: false }; // Default to not verified on error
            }
            
            return { ...topic, is_verified: verification && verification.length > 0 };
        }));

        res.status(200).json(topicsWithStatus);

    } catch (err) {
        console.error('[ERROR] Fetching topics for course:', err);
        res.status(500).json({ error: 'Failed to fetch topics.' });
    }
};

// --- FINALIZE COURSE VERIFICATION ---
export const verifyCourse = async (req, res) => {
    const { courseId } = req.params;
    const teacher_id = req.user.id;

    try {
        const { data: topics, error: topicsError } = await supabase
            .from('topics')
            .select('id, title')
            .eq('course_id', courseId);

        if (topicsError) throw topicsError;
        if (!topics || topics.length === 0) {
            return res.status(400).json({ error: 'Cannot verify a course with no topics.' });
        }

        const unverifiedTopics = [];
        for (const topic of topics) {
            const { data: verification, error: verificationError } = await supabase
                .from('teacher_verifications')
                .select('id')
                .eq('teacher_id', teacher_id)
                .eq('topic_id', topic.id)
                .eq('passed', true)
                .limit(1);

            if (verificationError) throw verificationError;
            if (!verification || verification.length === 0) {
                unverifiedTopics.push(topic.title);
            }
        }
        
        if (unverifiedTopics.length > 0) {
            return res.status(400).json({ 
                error: 'Verification failed. You must pass a quiz for all topics.',
                unverified_topics: unverifiedTopics 
            });
        }
        
        const { error: courseUpdateError } = await supabase
            .from('courses')
            .update({ is_verified: true })
            .eq('id', courseId);
        if (courseUpdateError) throw courseUpdateError;

        const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({ role: 'teacher' })
            .eq('id', teacher_id);
        if (profileUpdateError) throw profileUpdateError;
        
        res.status(200).json({ message: 'Congratulations! Your course is now verified and you are approved as a teacher.' });

    } catch (err) {
        console.error('[ERROR] Verifying course:', err);
        res.status(500).json({ error: 'An error occurred during course verification.' });
    }
};

// ADD THIS NEW FUNCTION to controllers/courses.js

// ADD THESE NEW FUNCTIONS to controllers/courses.js

// --- GET DETAILS FOR A SINGLE COURSE ---
export const getCourseDetails = async (req, res) => {
    const { courseId } = req.params;
    const student_id = req.user.id;

    try {
        // 1. Fetch course details, teacher, skill, and topics
        const { data: course, error } = await supabase
            .from('courses')
            .select(`
                *,
                teacher:profiles (full_name, avatar_url),
                skill:skills (name, category),
                topics (id, title, topic_order)
            `)
            .eq('id', courseId)
            .single();

        if (error) throw error;
        if (!course) return res.status(404).json({ error: 'Course not found.' });

        // 2. Check if the current user is already enrolled
        const { data: enrollment, error: enrollError } = await supabase
            .from('course_enrollments')
            .select('id')
            .eq('course_id', courseId)
            .eq('student_id', student_id)
            .single();

        if (enrollError && enrollError.code !== 'PGRST116') throw enrollError; // Ignore "not found" error

        // 3. Add the enrollment status to the response
        const courseWithStatus = { ...course, is_enrolled: !!enrollment };

        res.status(200).json(courseWithStatus);
    } catch (err) {
        console.error('[ERROR] Getting course details:', err);
        res.status(500).json({ error: 'Failed to get course details.' });
    }
};

// --- ENROLL A STUDENT IN A COURSE ---
export const enrollInCourse = async (req, res) => {
    const { courseId } = req.params;
    const student_id = req.user.id;

    try {
        const { data: course } = await supabase.from('courses').select('teacher_id').eq('id', courseId).single();
        if (course && course.teacher_id === student_id) {
            return res.status(400).json({ error: "You cannot enroll in your own course." });
        }

        const { data, error } = await supabase
            .from('course_enrollments')
            // ✨ UPDATED: The status is now 'enrolled' by default, not 'requested'
            .insert({ course_id: courseId, student_id: student_id, status: 'enrolled' })
            .select()
            .single();
        
        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({ error: 'You are already enrolled in this course.' });
            }
            throw error;
        }
        res.status(201).json({ message: 'Successfully enrolled!', enrollment: data });
    } catch (err) {
        console.error('[ERROR] Enrolling in course:', err);
        res.status(500).json({ error: 'Failed to enroll in course.' });
    }
};

export const getSessionsForCourse = async (req, res) => {
    const { courseId } = req.params;
    try {
        const { data, error } = await supabase
            .from('live_sessions')
            .select('*') // Select all session details
            .eq('course_id', courseId)
            .order('scheduled_at', { ascending: true });

        if (error) throw error;
        res.status(200).json(data);
    } catch (err) {
        console.error('[ERROR] Fetching sessions for course:', err);
        res.status(500).json({ error: 'Failed to fetch sessions.' });
    }
};