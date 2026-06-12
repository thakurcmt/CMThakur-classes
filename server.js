const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'cmthakurclasses_secret_key_2026_production';

app.use(cors());
// Set JSON payload size limit slightly higher for PDF base64 file uploads
app.use(express.json({ limit: '15mb' }));

// Serve static assets from the parent directory
app.use(express.static(path.join(__dirname, '..')));

// Middleware to authenticate JWT tokens
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = decodedUser;
        next();
    });
};

// Helper: Format database user row to frontend JSON user object
function formatUser(row) {
    if (!row) return null;
    const user = { ...row };
    delete user.password_hash;
    try { user.preferences = row.preferences ? JSON.parse(row.preferences) : null; } catch(e) { user.preferences = null; }
    try { user.enrolledClasses = row.enrolledClasses ? JSON.parse(row.enrolledClasses) : []; } catch(e) { user.enrolledClasses = []; }
    try { user.purchasedSets = row.purchasedSets ? JSON.parse(row.purchasedSets) : []; } catch(e) { user.purchasedSets = []; }
    try { user.testScores = row.testScores ? JSON.parse(row.testScores) : {}; } catch(e) { user.testScores = {}; }
    return user;
}

// ---------------- AUTH API ENDPOINTS ----------------

// Register a new user
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Missing required signup fields' });
    }

    try {
        const existing = await db.get("SELECT id FROM users WHERE LOWER(email) = ?", [email.toLowerCase()]);
        if (existing) {
            return res.status(400).json({ error: 'An account with this email already exists' });
        }

        const id = (role === 'student' ? 'std_' : 'tea_') + Date.now();
        const passHash = bcrypt.hashSync(password, 10);
        const grade = role === 'student' ? '6th Grade' : null;
        const goals = role === 'student' ? 'Complete outstanding course curriculum and achieve top test scores.' : null;
        const preferences = role === 'student' ? JSON.stringify({ emailAlerts: true, classReminders: true, weeklyReport: false }) : null;
        
        await db.run(`
            INSERT INTO users (id, email, password_hash, name, role, grade, goals, preferences, enrolledClasses, purchasedSets, testScores)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id, 
            email.toLowerCase(), 
            passHash, 
            name, 
            role, 
            grade, 
            goals, 
            preferences, 
            JSON.stringify([]), 
            JSON.stringify([]), 
            JSON.stringify({})
        ]);

        const newUser = await db.get("SELECT * FROM users WHERE id = ?", [id]);
        const formatted = formatUser(newUser);
        const token = jwt.sign(formatted, JWT_SECRET, { expiresIn: '7d' });
        
        res.status(201).json({ token, user: formatted });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error during registration' });
    }
});

// Login credentials validation
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        const userRow = await db.get("SELECT * FROM users WHERE LOWER(email) = ?", [email.toLowerCase()]);
        if (!userRow) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isValid = bcrypt.compareSync(password, userRow.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const formatted = formatUser(userRow);
        const token = jwt.sign(formatted, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({ token, user: formatted });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error during login' });
    }
});

// Get currently logged-in user profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const userRow = await db.get("SELECT * FROM users WHERE id = ?", [req.user.id]);
        if (!userRow) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(formatUser(userRow));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update profile details
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
    const { name, email, grade, goals, preferences } = req.body;
    try {
        const userRow = await db.get("SELECT * FROM users WHERE id = ?", [req.user.id]);
        if (!userRow) {
            return res.status(404).json({ error: 'User not found' });
        }

        const updatedName = name || userRow.name;
        const updatedEmail = email || userRow.email;
        const updatedGrade = grade !== undefined ? grade : userRow.grade;
        const updatedGoals = goals !== undefined ? goals : userRow.goals;
        const updatedPref = preferences ? JSON.stringify(preferences) : userRow.preferences;

        await db.run(`
            UPDATE users 
            SET name = ?, email = ?, grade = ?, goals = ?, preferences = ?
            WHERE id = ?
        `, [updatedName, updatedEmail.toLowerCase(), updatedGrade, updatedGoals, updatedPref, req.user.id]);

        const updatedUser = await db.get("SELECT * FROM users WHERE id = ?", [req.user.id]);
        res.json(formatUser(updatedUser));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error updating profile' });
    }
});


// ---------------- BATCH / CLASS API ENDPOINTS ----------------

// Get all classes
app.get('/api/classes', async (req, res) => {
    try {
        const rows = await db.all("SELECT * FROM classes ORDER BY time ASC");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching classes' });
    }
});

// Create new batch (Teacher only)
app.post('/api/classes', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Unauthorized: Teacher role required' });
    }

    const { title, subject, time, displayTime, duration, meetingUrl, image } = req.body;
    if (!title || !subject || !time || !displayTime || !duration) {
        return res.status(400).json({ error: 'Missing batch details' });
    }

    const id = 'cls_' + Date.now();
    const instructor = req.user.name;

    try {
        await db.run(`
            INSERT INTO classes (id, title, instructor, subject, time, displayTime, duration, meetingUrl, image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, title, instructor, subject, time, displayTime, duration, meetingUrl || 'https://meet.google.com/mock-class-room', image || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=600']);

        res.status(201).json({ success: true, classId: id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creating batch' });
    }
});

// Remove student from batch (Teacher only)
app.post('/api/classes/remove-student', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Unauthorized: Teacher role required' });
    }

    const { studentId, classId } = req.body;
    if (!studentId || !classId) {
        return res.status(400).json({ error: 'studentId and classId required' });
    }

    try {
        const studentRow = await db.get("SELECT * FROM users WHERE id = ?", [studentId]);
        if (!studentRow) {
            return res.status(404).json({ error: 'Student not found' });
        }

        let enrolled = [];
        try { enrolled = JSON.parse(studentRow.enrolledClasses) || []; } catch(e) {}
        enrolled = enrolled.filter(id => id !== classId);

        await db.run("UPDATE users SET enrolledClasses = ? WHERE id = ?", [JSON.stringify(enrolled), studentId]);
        
        // Mark any pending or approved join requests as rejected/deleted
        await db.run("DELETE FROM join_requests WHERE studentId = ? AND classId = ?", [studentId, classId]);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error removing student' });
    }
});

// Toggle document access (Teacher only)
app.post('/api/users/toggle-set-access', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Unauthorized: Teacher role required' });
    }
    
    const { userId, setId, grant } = req.body;
    if (!userId || !setId) {
        return res.status(400).json({ error: 'userId and setId required' });
    }

    try {
        const userRow = await db.get("SELECT * FROM users WHERE id = ?", [userId]);
        if (!userRow) {
            return res.status(404).json({ error: 'User not found' });
        }

        let purchased = [];
        try { purchased = JSON.parse(userRow.purchasedSets) || []; } catch(e) {}
        const hasSet = purchased.includes(setId);

        if (grant && !hasSet) {
            purchased.push(setId);
        } else if (!grant && hasSet) {
            purchased = purchased.filter(id => id !== setId);
        }

        await db.run("UPDATE users SET purchasedSets = ? WHERE id = ?", [JSON.stringify(purchased), userId]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error toggling access' });
    }
});

// List all users (Teacher only, for student activity maps)
app.get('/api/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Unauthorized: Teacher role required' });
    }

    try {
        const rows = await db.all("SELECT id, email, name, role, grade, goals, preferences, enrolledClasses, purchasedSets, testScores FROM users");
        const formatted = rows.map(r => formatUser(r));
        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching users' });
    }
});


// ---------------- JOIN REQUESTS API ENDPOINTS ----------------

// Get pending enrollment requests (Teacher only)
app.get('/api/classes/requests', authenticateToken, async (req, res) => {
    try {
        const rows = await db.all("SELECT * FROM join_requests ORDER BY createdAt DESC");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching join requests' });
    }
});

// Create join request (Student only)
app.post('/api/classes/requests', authenticateToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Unauthorized: Student role required' });
    }

    const { classId } = req.body;
    if (!classId) {
        return res.status(400).json({ error: 'classId required' });
    }

    try {
        const targetClass = await db.get("SELECT * FROM classes WHERE id = ?", [classId]);
        if (!targetClass) {
            return res.status(404).json({ error: 'Batch class not found' });
        }

        const id = 'req_' + Date.now();
        await db.run(`
            INSERT INTO join_requests (id, studentId, studentName, studentEmail, classId, classTitle, teacherName, status, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id, 
            req.user.id, 
            req.user.name, 
            req.user.email, 
            classId, 
            targetClass.title, 
            targetClass.instructor, 
            'pending', 
            new Date().toISOString()
        ]);

        res.status(201).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error sending join request' });
    }
});

// Approve / Reject join request (Teacher only)
app.put('/api/classes/requests/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Unauthorized: Teacher role required' });
    }

    const requestId = req.params.id;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!status || (status !== 'approved' && status !== 'rejected')) {
        return res.status(400).json({ error: 'Valid status required' });
    }

    try {
        const requestRow = await db.get("SELECT * FROM join_requests WHERE id = ?", [requestId]);
        if (!requestRow) {
            return res.status(404).json({ error: 'Enrollment request not found' });
        }

        await db.run("UPDATE join_requests SET status = ? WHERE id = ?", [status, requestId]);

        if (status === 'approved') {
            // Add batch ID to student's enrolledClasses array
            const studentRow = await db.get("SELECT * FROM users WHERE id = ?", [requestRow.studentId]);
            if (studentRow) {
                let enrolled = [];
                try { enrolled = JSON.parse(studentRow.enrolledClasses) || []; } catch(e) {}
                if (!enrolled.includes(requestRow.classId)) {
                    enrolled.push(requestRow.classId);
                }
                await db.run("UPDATE users SET enrolledClasses = ? WHERE id = ?", [JSON.stringify(enrolled), requestRow.studentId]);
            }
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating enrollment request' });
    }
});


// ---------------- LECTURE API ENDPOINTS ----------------

// Get all recorded lectures
app.get('/api/lectures', async (req, res) => {
    try {
        const rows = await db.all("SELECT * FROM lectures ORDER BY date DESC");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching lectures' });
    }
});

// Add newly recorded lecture (Teacher only)
app.post('/api/lectures', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Unauthorized: Teacher role required' });
    }

    const { id, title, subject, instructor, date, duration, thumbnail, videoUrl } = req.body;
    if (!title || !subject || !duration) {
        return res.status(400).json({ error: 'Missing lecture parameters' });
    }

    const lectureId = id || 'lec_' + Date.now();
    const recordDate = date || new Date().toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });

    try {
        await db.run(`
            INSERT INTO lectures (id, title, subject, instructor, date, duration, thumbnail, videoUrl)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            lectureId, 
            title, 
            subject, 
            instructor || req.user.name, 
            recordDate, 
            duration, 
            thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=256', 
            videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4'
        ]);

        res.status(201).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error saving recorded lecture' });
    }
});

// Rename lecture (Teacher only)
app.put('/api/lectures/rename', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Unauthorized: Teacher role required' });
    }

    const { lectureId, newName } = req.body;
    if (!lectureId || !newName) {
        return res.status(400).json({ error: 'lectureId and newName required' });
    }

    try {
        await db.run("UPDATE lectures SET title = ? WHERE id = ?", [newName, lectureId]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error renaming lecture' });
    }
});


// ---------------- TESTS / QUIZZES API ENDPOINTS ----------------

// Get all tests
app.get('/api/tests', async (req, res) => {
    try {
        const rows = await db.all("SELECT * FROM tests");
        const formatted = rows.map(r => {
            try { r.questions = JSON.parse(r.questions); } catch(e) { r.questions = []; }
            return r;
        });
        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching tests' });
    }
});

// Create new test assessment (Teacher only)
app.post('/api/tests', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Unauthorized: Teacher role required' });
    }

    const { title, subject, questionsCount, duration, dueDate, questions } = req.body;
    if (!title || !subject || !duration || !dueDate) {
        return res.status(400).json({ error: 'Missing quiz parameters' });
    }

    const id = 'tst_' + Date.now();

    try {
        await db.run(`
            INSERT INTO tests (id, title, subject, questionsCount, duration, status, dueDate, questions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id, 
            title, 
            subject, 
            parseInt(questionsCount, 10) || 10, 
            duration, 
            'active', 
            dueDate, 
            JSON.stringify(questions || [])
        ]);

        res.status(201).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creating test' });
    }
});

// Submit a quiz test score (Student only)
app.post('/api/tests/score', authenticateToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Unauthorized: Student role required' });
    }

    const { testId, score } = req.body;
    if (!testId || score === undefined) {
        return res.status(400).json({ error: 'testId and score required' });
    }

    try {
        const studentRow = await db.get("SELECT * FROM users WHERE id = ?", [req.user.id]);
        if (!studentRow) {
            return res.status(404).json({ error: 'Student not found' });
        }

        let testScores = {};
        try { testScores = JSON.parse(studentRow.testScores) || {}; } catch(e) {}
        
        const completedDate = new Date().toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });
        testScores[testId] = {
            score: parseInt(score, 10),
            completedDate: completedDate
        };

        // Update student users table JSON
        await db.run("UPDATE users SET testScores = ? WHERE id = ?", [JSON.stringify(testScores), req.user.id]);

        // Log score to separate test_scores table for easy teacher reporting
        const rowId = 'tsc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        await db.run(`
            INSERT INTO test_scores (id, studentId, testId, score, completedDate)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(studentId, testId) DO UPDATE SET score = excluded.score, completedDate = excluded.completedDate
        `, [rowId, req.user.id, testId, parseInt(score, 10), completedDate]);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error submitting quiz score' });
    }
});

// Rename test (Teacher only)
app.put('/api/tests/rename', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Unauthorized: Teacher role required' });
    }

    const { testId, newName } = req.body;
    if (!testId || !newName) {
        return res.status(400).json({ error: 'testId and newName required' });
    }

    try {
        await db.run("UPDATE tests SET title = ? WHERE id = ?", [newName, testId]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error renaming test' });
    }
});


// ---------------- HOMEWORK API ENDPOINTS ----------------

// Get homework assignments list
app.get('/api/homework', authenticateToken, async (req, res) => {
    try {
        let rows = [];
        if (req.user.role === 'teacher') {
            rows = await db.all("SELECT * FROM homework ORDER BY submittedAt DESC");
        } else {
            rows = await db.all("SELECT * FROM homework WHERE studentId = ?", [req.user.id]);
        }
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching homework list' });
    }
});

// Submit/Save homework PDF (Supports creating virtual homework slot or updating)
app.post('/api/homework', authenticateToken, async (req, res) => {
    const { homeworkId, fileName, fileSize, studentId, title, subject, fileDataUrl } = req.body;

    try {
        let hwRecord = null;
        if (homeworkId) {
            hwRecord = await db.get("SELECT * FROM homework WHERE id = ?", [homeworkId]);
        }

        const submitTime = new Date().toISOString();
        const activeStudentId = studentId || req.user.id;
        const studentRow = await db.get("SELECT name FROM users WHERE id = ?", [activeStudentId]);
        const activeStudentName = studentRow ? studentRow.name : 'Student';

        if (!hwRecord && activeStudentId && title) {
            // Create a brand new submission record
            const id = homeworkId || 'hw_' + Date.now();
            await db.run(`
                INSERT INTO homework (id, studentId, studentName, name, title, subject, submittedAt, status, fileName, fileSize, fileDataUrl, grade, score, feedback)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                id, 
                activeStudentId, 
                activeStudentName, 
                activeStudentName, 
                title, 
                subject || 'General', 
                submitTime, 
                'submitted', 
                fileName, 
                fileSize, 
                fileDataUrl, 
                null, 
                null, 
                null
            ]);
        } else if (hwRecord) {
            // Update existing pending homework
            await db.run(`
                UPDATE homework 
                SET status = ?, submittedAt = ?, fileName = ?, fileSize = ?, fileDataUrl = ?
                WHERE id = ?
            `, ['submitted', submitTime, fileName, fileSize, fileDataUrl, homeworkId]);
        } else {
            return res.status(400).json({ error: 'Unable to process submission without homeworkId or title' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error saving homework submission' });
    }
});

// Add new homework assignment for all students (Teacher only)
app.post('/api/homework/assignments', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Unauthorized: Teacher role required' });
    }

    const { title, subject } = req.body;
    if (!title || !subject) {
        return res.status(400).json({ error: 'title and subject required' });
    }

    try {
        const students = await db.all("SELECT id, name FROM users WHERE role = 'student'");
        for (const st of students) {
            const exists = await db.get("SELECT id FROM homework WHERE studentId = ? AND title = ?", [st.id, title]);
            if (!exists) {
                const id = 'hw_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
                await db.run(`
                    INSERT INTO homework (id, studentId, studentName, name, title, subject, submittedAt, status, fileName, fileSize, fileDataUrl, grade, score, feedback)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [id, st.id, st.name, st.name, title, subject, null, 'pending', null, null, null, null, null, null]);
            }
        }
        res.status(201).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creating homework assignments' });
    }
});

// Grade submitted homework (Teacher only)
app.put('/api/homework/grade', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Unauthorized: Teacher role required' });
    }

    const { homeworkId, grade, score, feedback } = req.body;
    if (!homeworkId || !grade || score === undefined) {
        return res.status(400).json({ error: 'homeworkId, grade, and score required' });
    }

    try {
        await db.run(`
            UPDATE homework 
            SET status = ?, grade = ?, score = ?, feedback = ?
            WHERE id = ?
        `, ['graded', grade, parseInt(score, 10), feedback || '', homeworkId]);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error grading homework' });
    }
});


// ---------------- ATTENDANCE API ENDPOINTS ----------------

// Get today's attendance sheets
app.get('/api/attendance', authenticateToken, async (req, res) => {
    try {
        const rows = await db.all("SELECT * FROM attendance");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching attendance logs' });
    }
});

// Save today's attendance checklist (Teacher only)
app.post('/api/attendance', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Unauthorized: Teacher role required' });
    }

    const { attendanceList } = req.body; // Array of { studentId, studentName, status }
    if (!attendanceList || !Array.isArray(attendanceList)) {
        return res.status(400).json({ error: 'attendanceList array required' });
    }

    const todayDateStr = new Date().toISOString().split('T')[0];

    try {
        for (const record of attendanceList) {
            const exists = await db.get("SELECT id FROM attendance WHERE date = ? AND studentId = ?", [todayDateStr, record.studentId]);
            if (exists) {
                await db.run(`
                    UPDATE attendance 
                    SET status = ? 
                    WHERE date = ? AND studentId = ?
                `, [record.status, todayDateStr, record.studentId]);
            } else {
                const id = 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                await db.run(`
                    INSERT INTO attendance (id, date, studentId, studentName, status, staySeconds, stayTimeStr)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [id, todayDateStr, record.studentId, record.studentName || record.name, record.status, 0, '0 secs']);
            }
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error saving attendance sheet' });
    }
});

// Student stay tracker heartbeat log
app.post('/api/attendance/stay', authenticateToken, async (req, res) => {
    const { staySeconds, stayTimeStr } = req.body;
    if (staySeconds === undefined || !stayTimeStr) {
        return res.status(400).json({ error: 'staySeconds and stayTimeStr required' });
    }

    const todayDateStr = new Date().toISOString().split('T')[0];

    try {
        const exists = await db.get("SELECT id, staySeconds FROM attendance WHERE date = ? AND studentId = ?", [todayDateStr, req.user.id]);
        if (exists) {
            await db.run(`
                UPDATE attendance 
                SET staySeconds = ?, stayTimeStr = ?, status = 'present'
                WHERE id = ?
            `, [parseInt(staySeconds, 10), stayTimeStr, exists.id]);
        } else {
            const id = 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            await db.run(`
                INSERT INTO attendance (id, date, studentId, studentName, status, staySeconds, stayTimeStr)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [id, todayDateStr, req.user.id, req.user.name, 'present', parseInt(staySeconds, 10), stayTimeStr]);
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error tracking stay heartbeat' });
    }
});


// ---------------- DOCUMENT SETS API ENDPOINTS ----------------

// Get all document sets
app.get('/api/document-sets', async (req, res) => {
    try {
        const rows = await db.all("SELECT * FROM document_sets");
        const formatted = rows.map(r => {
            try { r.content = r.content ? JSON.parse(r.content) : []; } catch(e) { r.content = []; }
            return r;
        });
        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching document sets' });
    }
});

// Create new document set (Teacher only)
app.post('/api/document-sets', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Unauthorized: Teacher role required' });
    }

    const { id, title, subject, pages, size, type, price, pdfDataUrl, content } = req.body;
    if (!title || !subject || !type) {
        return res.status(400).json({ error: 'Missing required document set details' });
    }

    const setId = id || 'set_' + Date.now();

    try {
        await db.run(`
            INSERT INTO document_sets (id, title, subject, pages, size, type, price, pdfDataUrl, content)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            setId,
            title,
            subject,
            parseInt(pages, 10) || 1,
            size || '0 KB',
            type,
            parseFloat(price) || 0,
            pdfDataUrl || null,
            JSON.stringify(content || [])
        ]);

        res.status(201).json({ success: true, setId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creating document set' });
    }
});


// Fallback wildcard to serve index.html for frontend routing
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Start server listener
app.listen(PORT, () => {
    console.log(`========================================================`);
    console.log(`  cmthakurclasses API Server running on port ${PORT}`);
    console.log(`  SQLite database seeded and connected successfully.`);
    console.log(`========================================================`);
});
