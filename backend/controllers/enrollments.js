import { supabase } from '../config/supabase.js';

// --- GET ALL COURSES A STUDENT IS ENROLLED IN ---
export const getMyLearning = async (req, res) => {
    const student_id = req.user.id;

    try {
        const { data, error } = await supabase
            .from('course_enrollments')
            .select(`
                status,
                enrolled_at,
                course:courses (
                    id,
                    title,
                    skill:skills (name),
                    teacher:profiles (full_name, avatar_url),
                    topics (
                    id,
                    title,
                    live_sessions (
                        id,
                        title,
                        scheduled_at,
                        status
                    )
                    )
                )
                `)
            .eq('student_id', student_id)
            .order('enrolled_at', { ascending: false });

        if (error) throw error;

        const formatted = data.map(item => {
            const sessions = item.course.live_sessions || [];
            const upcomingOrLive = sessions.find(
                s => ['live', 'scheduled'].includes(s.status)
            );
            return {
                ...item,
                course: {
                    ...item.course,
                    nextSession: upcomingOrLive || null
                }
            };
        });

        res.status(200).json(formatted);
    } catch (err) {
        console.error('[ERROR] Fetching "My Learning" courses:', err);
        res.status(500).json({ error: 'Failed to fetch your enrolled courses.' });
    }
};


// --- GET INCOMING ENROLLMENT REQUESTS FOR THE LOGGED-IN TEACHER ---
export const getStudentEnrollments = async (req, res) => {
    const userId = req.user.id;
    try {
        const { data, error } = await supabase
            .from('course_enrollments')
            .select(`
                id,
                status,
                enrolled_at, 
                course:courses (
                    id,
                    title
                ),
                student:profiles (
                    id,
                    full_name,
                    avatar_url
                )
            `)
            .eq('courses.teacher_id', userId)
            .order('enrolled_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (err) {
        console.error('[ERROR] Fetching enrollment requests:', err);
        res.status(500).json({ error: 'Failed to fetch enrollment requests.' });
    }
};

// --- UPDATE THE STATUS OF AN ENROLLMENT REQUEST (ACCEPT/REJECT) ---
export const updateEnrollmentStatus = async (req, res) => {
    const { enrollmentId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!status || !['enrolled', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid status provided." });
    }

    try {
        const { data: enrollment } = await supabase
            .from('course_enrollments')
            .select('course:courses(teacher_id)')
            .eq('id', enrollmentId)
            .single();

        if (!enrollment || enrollment.course.teacher_id !== userId) {
            return res.status(403).json({ error: 'Permission denied.' });
        }

        const { data, error } = await supabase
            .from('course_enrollments')
            .update({ status })
            .eq('id', enrollmentId)
            .select()
            .single();
        
        if (error) throw error;
        res.status(200).json({ message: `Enrollment successfully ${status}.`, data });
    } catch (err) {
        console.error('[ERROR] Updating enrollment status:', err);
        res.status(500).json({ error: 'Failed to update enrollment status.' });
    }
};