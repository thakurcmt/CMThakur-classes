// Ensure our global namespace exists
window.EduApp = window.EduApp || {};

// Backend Connection Config Toggle
EduApp.USE_SERVER_BACKEND = true;
EduApp.API_BASE = (window.location.protocol === 'file:') ? 'http://localhost:3000' : '';

// Database and State Manager
EduApp.db = {
    // Local storage keys
    KEYS: {
        USERS: 'edu_platform_users',
        CURRENT_USER: 'edu_platform_current_user',
        CLASSES: 'edu_platform_classes',
        LECTURES: 'edu_platform_lectures',
        TESTS: 'edu_platform_tests',
        DOCUMENT_SETS: 'edu_platform_document_sets',
        HOMEWORK: 'edu_platform_homework',
        ATTENDANCE: 'edu_platform_attendance',
        ACCESS_CONTROL: 'edu_platform_access_control',
        LIVE_CLASS_STATE: 'edu_live_class_state'
    },

    // Initialize mock database
    init() {
        // Force database re-seeding for clean production mode
        try {
            const currentDbVersion = localStorage.getItem('edu_platform_db_version');
            if (currentDbVersion !== 'production_v3') {
                console.log("Upgrading database to production version 3 (clean slate). Wiping localStorage...");
                
                // Collect keys to delete
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (key.startsWith('edu_') || key.startsWith('edu')) && key !== 'edu_platform_db_version') {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
                localStorage.setItem('edu_platform_db_version', 'production_v3');
            }
        } catch (e) {
            console.error("Error running database migration check:", e);
        }

        // 1. Seed Users (1 Teacher, 2 Students)
        if (!localStorage.getItem(this.KEYS.USERS)) {
            const initialUsers = [
                {
                    id: 'std_001',
                    email: 'student1@edu.com',
                    password: 'password',
                    name: 'Student One',
                    role: 'student',
                    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=StudentOne',
                    grade: '6th Grade',
                    goals: 'Master Class 6 Math concepts and prepare for exams.',
                    preferences: {
                        emailAlerts: true,
                        classReminders: true,
                        weeklyReport: false
                    },
                    purchasedSets: [],
                    enrolledClasses: [],
                    xp: 0,
                    level: 1,
                    badges: [],
                    xpHistory: []
                },
                {
                    id: 'std_002',
                    email: 'student2@edu.com',
                    password: 'password',
                    name: 'Student Two',
                    role: 'student',
                    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=StudentTwo',
                    grade: '6th Grade',
                    goals: 'Improve algebraic thinking and geometric visualization.',
                    preferences: {
                        emailAlerts: true,
                        classReminders: true,
                        weeklyReport: true
                    },
                    purchasedSets: [],
                    enrolledClasses: [],
                    xp: 0,
                    level: 1,
                    badges: [],
                    xpHistory: []
                },
                {
                    id: 'tea_001',
                    email: 'teacher@edu.com',
                    password: 'password',
                    name: 'Primary Educator',
                    role: 'teacher',
                    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Teacher',
                    purchasedSets: []
                }
            ];
            localStorage.setItem(this.KEYS.USERS, JSON.stringify(initialUsers));
        }

        // 2. Seed Classes (Initially Empty for Teacher creation)
        if (!localStorage.getItem(this.KEYS.CLASSES)) {
            localStorage.setItem(this.KEYS.CLASSES, JSON.stringify([]));
        }

        // 3. Seed Lectures (Initially Empty)
        if (!localStorage.getItem(this.KEYS.LECTURES)) {
            localStorage.setItem(this.KEYS.LECTURES, JSON.stringify([]));
        }

        // 4. Seed Tests (Initially Empty for Teacher draft/publish creation)
        if (!localStorage.getItem(this.KEYS.TESTS)) {
            localStorage.setItem(this.KEYS.TESTS, JSON.stringify([]));
        }

        // 5. Seed Document Sets (Catalog remains for student usage)
        if (!localStorage.getItem(this.KEYS.DOCUMENT_SETS)) {
            const initialSets = [
                {
                    id: 'set_001',
                    title: 'Fractions and Decimals Practice Set',
                    subject: 'Mathematics',
                    pages: 5,
                    size: '1.2 MB',
                    type: 'trial', // trial / premium
                    price: 0,
                    content: [
                        "Page 1: Visualizing Fractions. A fraction represents a part of a whole. The numerator (top) is the number of parts we have, and the denominator (bottom) is the total number of equal parts. Example: 3/4 of a pizza means 3 out of 4 equal slices.",
                        "Page 2: Proper vs Improper Fractions. Proper fractions have a numerator smaller than the denominator (e.g., 2/3). Improper fractions have a numerator equal to or larger than the denominator (e.g., 7/4). Mixed numbers combine a whole number and a fraction (e.g., 1 3/4).",
                        "Page 3: Equivalent Fractions. Fractions that have the same value even though they look different. To find equivalent fractions, multiply or divide the numerator and the denominator by the same non-zero number. E.g., 1/2 = 2/4 = 4/8.",
                        "Page 4: Converting Fractions to Decimals. Divide the numerator by the denominator. For example, to convert 3/5 to a decimal, perform 3 / 5 = 0.6. For 1/4, 1 / 4 = 0.25. Terminating vs repeating decimals.",
                        "Page 5: Practice Problems. 1. Simplify 12/18 to its lowest terms. 2. Convert 7/2 into a mixed number. 3. Find three equivalent fractions for 3/5. 4. Convert 4/5 into a decimal."
                    ]
                },
                {
                    id: 'set_002',
                    title: 'Integers & Number Line Study Sheet',
                    subject: 'Mathematics',
                    pages: 5,
                    size: '850 KB',
                    type: 'trial',
                    price: 0,
                    content: [
                        "Page 1: Introduction to Integers. Integers are the set of whole numbers and their opposites. They include positive numbers (1, 2, 3...), negative numbers (-1, -2, -3...), and zero. Zero is neither positive nor negative.",
                        "Page 2: The Number Line. Positive numbers are to the right of zero, and negative numbers are to the left of zero. As you move right, numbers get larger. As you move left, numbers get smaller. E.g., -5 is less than -2.",
                        "Page 3: Adding & Subtracting Integers. Rule 1: To add numbers with the same sign, add their absolute values and keep the common sign. Rule 2: To add numbers with different signs, subtract the smaller absolute value from the larger, and use the sign of the larger absolute value. E.g., (-5) + 8 = 3.",
                        "Page 4: Comparing and Ordering Integers. Use the symbols < (less than) and > (greater than). For example, -10 < -2 because -2 is further to the right on the number line. Absolute value |x| represents the distance of x from zero.",
                        "Page 5: Practice Problems. 1. Order these integers from least to greatest: -3, 5, -8, 0, 2. 2. Calculate (-7) + 12. 3. Find the value of | -15 |. 4. Calculate (-4) - (-6)."
                    ]
                },
                {
                    id: 'set_003',
                    title: 'Factors, LCM & HCF Practice Sheet',
                    subject: 'Mathematics',
                    pages: 5,
                    size: '720 KB',
                    type: 'trial',
                    price: 0,
                    content: [
                        "Page 1: Factors and Multiples. A factor is a number that divides another number evenly without leaving a remainder. A multiple is the product of a given number and any integer. E.g., factors of 12 are 1, 2, 3, 4, 6, 12; multiples of 3 are 3, 6, 9, 12...",
                        "Page 2: Prime vs Composite Numbers. A prime number has exactly two factors: 1 and itself (e.g., 2, 3, 5, 7, 11...). 1 is neither prime nor composite. A composite number has more than two factors (e.g., 4, 6, 8, 9...).",
                        "Page 3: Highest Common Factor (HCF / GCD). The greatest number that is a factor of two or more numbers. E.g., factors of 12 are {1,2,3,4,6,12} and factors of 18 are {1,2,3,6,9,18}. The common factors are {1,2,3,6}, so HCF is 6.",
                        "Page 4: Least Common Multiple (LCM). The smallest positive number that is a multiple of two or more numbers. E.g., multiples of 4 are {4,8,12,16,20,24...} and multiples of 6 are {6,12,18,24...}. The common multiples are {12,24...}, so LCM is 12.",
                        "Page 5: Practice Problems. 1. Find all the factors of 24. 2. Do prime factorization of 36 using a factor tree. 3. Find the HCF of 15 and 25. 4. Find the LCM of 8 and 12."
                    ]
                },
                {
                    id: 'set_004',
                    title: 'Geometry & Mensuration Formula Sheet',
                    subject: 'Mathematics',
                    pages: 5,
                    size: '1.5 MB',
                    type: 'trial',
                    price: 0,
                    content: [
                        "Page 1: Points, Lines, Segments, Rays. A point marks a position and has no size. A line is straight, extends infinitely in both directions. A line segment has two endpoints. A ray starts at one endpoint and extends infinitely in one direction.",
                        "Page 2: Angles & Classifications. An angle is formed by two rays sharing a common vertex. Types: Acute (< 90°), Right (= 90°), Obtuse (> 90° and < 180°), Straight (= 180°), Reflex (> 180° and < 360°).",
                        "Page 3: Polygons & Triangles. A polygon is a closed 2D shape made of straight line segments. Triangles are classified by sides (Equilateral, Isosceles, Scalene) or by angles (Acute-angled, Right-angled, Obtuse-angled).",
                        "Page 4: Perimeter & Area. Perimeter is the distance around a 2D shape. Perimeter of rectangle = 2 * (length + width). Perimeter of square = 4 * side. Area is the space inside. Area of rectangle = length * width. Area of square = side * side.",
                        "Page 5: Practice Problems. 1. Find the perimeter of a rectangle with length 8cm and width 5cm. 2. A square has a perimeter of 24cm. What is the length of its side? 3. Identify if an angle of 115° is acute, right, or obtuse. 4. Find the area of a square with side 6cm."
                    ]
                },
                {
                    id: 'set_005',
                    title: 'Algebra & Variables Practice Worksheets',
                    subject: 'Mathematics',
                    pages: 4,
                    size: '620 KB',
                    type: 'trial',
                    price: 0,
                    content: [
                        "Page 1: Introduction to Algebra. Algebra uses letters (like x, y, a, b) to represent unknown numbers. These letters are called variables. Constants are fixed numbers (e.g. 5, -3).",
                        "Page 2: Writing Algebraic Expressions. Translating word statements into math expressions. E.g., '5 more than x' is written as x + 5. '3 times y' is written as 3y. '8 subtracted from z' is written as z - 8.",
                        "Page 3: Evaluating Expressions. Substitute the given values of variables into the expression. E.g., evaluate 3x + 4 when x = 5: 3(5) + 4 = 15 + 4 = 19.",
                        "Page 4: Simple One-Step Equations. An equation is a statement that two expressions are equal (e.g., x + 3 = 10). To solve for the variable, perform the inverse operation. E.g., subtract 3 from both sides: x = 7."
                    ]
                },
                {
                    id: 'set_006',
                    title: '6th Grade Math Ultimate Exam Prep Pack',
                    subject: 'Mathematics',
                    pages: 5,
                    size: '4.8 MB',
                    type: 'premium',
                    price: 9.99,
                    content: [
                        "Page 1: Course Summary. Comprehensive summary notes covering numbers, fractions, integers, basic geometry, mensuration (perimeter and area), and introductory algebra.",
                        "Page 2: Chapter 1: Number Systems. Knowing our numbers, Roman numerals, estimation, place value charts (Indian and International systems), and playing with numbers (HCF/LCM rules).",
                        "Page 3: Chapter 2: Fractions and Decimals. Adding, subtracting, comparing, and visual models. Decimals representations, place values (tenths, hundredths), and conversion methods.",
                        "Page 4: Chapter 3: Geometry & Mensuration. Main formulas for perimeters and areas of rectangles, squares, and compound shapes. Lines, angles, curves, polygons, and 3D shapes intro.",
                        "Page 5: Full Mock Exam. Solve: 1. Find the LCM of 12, 15, and 20. 2. Simplify 3/5 + 1/10. 3. Find the cost of fencing a square park of side 70m at $2 per meter."
                    ]
                },
                {
                    id: 'set_007',
                    title: 'Mensuration, Area & Perimeter Solved Pack',
                    subject: 'Mathematics',
                    pages: 5,
                    size: '3.6 MB',
                    type: 'premium',
                    price: 14.99,
                    content: [
                        "Page 1: Introduction to Mensuration. Understanding units of length (mm, cm, m, km) and units of area (sq. cm, sq. m). Basic definitions of perimeter and area.",
                        "Page 2: Rectangle Solved Problems. Step-by-step solutions for finding perimeter when length and width are given, finding width when area and length are given, and cost of tiling/fencing.",
                        "Page 3: Square Solved Problems. Detailed solutions for side length calculations, perimeter, and area. E.g. Finding area of square whose perimeter is 40cm.",
                        "Page 4: Compound Shapes. Calculating perimeter and area of composite figures (shapes made of multiple rectangles/squares) by splitting them into simpler rectangles.",
                        "Page 5: Solved Word Problems. 1. A table-top measures 2m 25cm by 1m 50cm. What is its perimeter? 2. A room is 4m long and 3m 50cm wide. How many square meters of carpet are needed to cover the floor?"
                    ]
                },
                {
                    id: 'set_008',
                    title: 'Factors & Multiples Solved Question Series',
                    subject: 'Mathematics',
                    pages: 5,
                    size: '4.2 MB',
                    type: 'premium',
                    price: 12.50,
                    content: [
                        "Page 1: Divisibility Tests. Rules to quickly check if a number is divisible by 2, 3, 4, 5, 6, 8, 9, 10, or 11. Useful for prime factorization.",
                        "Page 2: Prime Factorization Problems. Solved examples of representing composite numbers as products of prime factors. Methods: factor tree and division method.",
                        "Page 3: HCF Word Problems. Understanding keywords like 'maximum length', 'greatest capacity', 'largest size' to apply HCF. 5 fully solved word problems.",
                        "Page 4: LCM Word Problems. Understanding keywords like 'together again', 'toll at intervals', 'minimum distance' to apply LCM. 5 fully solved word problems.",
                        "Page 5: Combined LCM & HCF Problems. Relationship: Product of two numbers = HCF * LCM. Solved questions verifying this relationship for various pairs of numbers."
                    ]
                }
            ];
            localStorage.setItem(this.KEYS.DOCUMENT_SETS, JSON.stringify(initialSets));
        }

        // 6. Seed Homework Logs (Initially Empty)
        if (!localStorage.getItem(this.KEYS.HOMEWORK)) {
            localStorage.setItem(this.KEYS.HOMEWORK, JSON.stringify([]));
        }

        // 7. Seed Attendance Logs (Initially Empty)
        if (!localStorage.getItem(this.KEYS.ATTENDANCE)) {
            const initialAttendance = {
                today: [],
                history: []
            };
            localStorage.setItem(this.KEYS.ATTENDANCE, JSON.stringify(initialAttendance));
        }

        // 8. Seed Access Control List (Initially Empty)
        if (!localStorage.getItem(this.KEYS.ACCESS_CONTROL)) {
            const initialAccess = {
                std_001: [],
                std_002: []
            };
            localStorage.setItem(this.KEYS.ACCESS_CONTROL, JSON.stringify(initialAccess));
        }

        // Ensure all existing student users have gamification properties in local storage
        try {
            const users = JSON.parse(localStorage.getItem(this.KEYS.USERS)) || [];
            let updated = false;
            users.forEach(u => {
                if (u.role === 'student') {
                    if (u.xp === undefined) { u.xp = 0; updated = true; }
                    if (u.level === undefined) { u.level = 1; updated = true; }
                    if (u.badges === undefined) { u.badges = []; updated = true; }
                    if (u.xpHistory === undefined) { u.xpHistory = []; updated = true; }
                }
            });
            if (updated) {
                localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
                // Sync current user session
                const curr = JSON.parse(sessionStorage.getItem(this.KEYS.CURRENT_USER));
                if (curr && curr.role === 'student') {
                    const matched = users.find(u => u.id === curr.id);
                    if (matched) {
                        sessionStorage.setItem(this.KEYS.CURRENT_USER, JSON.stringify(matched));
                    }
                }
            }
        } catch(e) {
            console.error("Error upgrading user objects: ", e);
        }
    },

    // Get all registered users
    getUsers() {
        return JSON.parse(localStorage.getItem(this.KEYS.USERS)) || [];
    },

    // Save a user profile update
    saveUser(updatedUser) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
            users[index] = updatedUser;
            localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
            // If current user is updated, update current session as well
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.id === updatedUser.id) {
                this.setCurrentUser(updatedUser);
            }

            // Sync with backend server
            if (EduApp.USE_SERVER_BACKEND) {
                const token = sessionStorage.getItem('edu_platform_auth_token');
                if (token) {
                    fetch(`${EduApp.API_BASE}/api/auth/profile`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            name: updatedUser.name,
                            email: updatedUser.email,
                            grade: updatedUser.grade,
                            goals: updatedUser.goals,
                            preferences: updatedUser.preferences
                        })
                    }).catch(err => console.warn("Background profile update sync failed:", err.message));
                }
            }
        }
    },

    // Get currently logged-in user
    getCurrentUser() {
        return JSON.parse(sessionStorage.getItem(this.KEYS.CURRENT_USER));
    },

    // Set currently logged-in user
    setCurrentUser(user) {
        if (user) {
            sessionStorage.setItem(this.KEYS.CURRENT_USER, JSON.stringify(user));
        } else {
            sessionStorage.removeItem(this.KEYS.CURRENT_USER);
            sessionStorage.removeItem('edu_platform_auth_token');
        }
    },

    // Get all classes
    getClasses() {
        return JSON.parse(localStorage.getItem(this.KEYS.CLASSES)) || [];
    },

    // Get all past recorded lectures
    getLectures() {
        return JSON.parse(localStorage.getItem(this.KEYS.LECTURES)) || [];
    },

    // Add a newly recorded lecture
    addLecture(lecture) {
        const lectures = this.getLectures();
        lectures.push(lecture);
        localStorage.setItem(this.KEYS.LECTURES, JSON.stringify(lectures));

        // Sync with backend server
        if (EduApp.USE_SERVER_BACKEND) {
            const token = sessionStorage.getItem('edu_platform_auth_token');
            if (token) {
                fetch(`${EduApp.API_BASE}/api/lectures`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(lecture)
                }).catch(err => console.warn("Background addLecture sync failed:", err.message));
            }
        }
        return true;
    },

    // Get all tests
    getTests() {
        return JSON.parse(localStorage.getItem(this.KEYS.TESTS)) || [];
    },

    // Update test details (e.g. mark a test as completed)
    submitTestScore(testId, score) {
        const tests = this.getTests();
        const testObj = tests.find(t => t.id === testId);
        const testTitle = testObj ? testObj.title : 'Assessment';
        
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.role === 'student') {
            const completedDate = new Date().toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });
            
            // Save to student profile
            currentUser.testScores = currentUser.testScores || {};
            currentUser.testScores[testId] = {
                score: score,
                completedDate: completedDate
            };
            this.saveUser(currentUser);

            // Award XP!
            this.awardXP(currentUser.id, 150, `Completed Test: ${testTitle}`);
            if (score === 100) {
                this.awardBadge(currentUser.id, 'Perfect Score');
            }

            // Sync with backend server
            if (EduApp.USE_SERVER_BACKEND) {
                const token = sessionStorage.getItem('edu_platform_auth_token');
                if (token) {
                    fetch(`${EduApp.API_BASE}/api/tests/score`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ testId, score })
                    }).catch(err => console.warn("Background test score sync failed:", err.message));
                }
            }
            return true;
        }
        return false;
    },

    // Gamification: Award XP to a student
    awardXP(studentId, xpVal, reason) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === studentId);
        if (index !== -1) {
            const user = users[index];
            if (user.role !== 'student') return false;

            user.xp = (user.xp || 0) + xpVal;
            user.xpHistory = user.xpHistory || [];
            user.xpHistory.push({
                xp: xpVal,
                reason: reason,
                date: new Date().toISOString()
            });

            // Calculate Level: Level = Math.floor(user.xp / 500) + 1
            const newLevel = Math.floor(user.xp / 500) + 1;
            const oldLevel = user.level || 1;
            user.level = newLevel;

            users[index] = user;
            localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));

            // Sync current user session
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.id === studentId) {
                this.setCurrentUser(user);
            }

            // Show a custom toast using global toast system
            if (window.EduApp && window.EduApp.toast) {
                let lvlMsg = "";
                if (newLevel > oldLevel) {
                    lvlMsg = ` 🎉 LEVEL UP to Level ${newLevel}!`;
                }
                window.EduApp.toast.show(`+${xpVal} XP: ${reason}${lvlMsg}`);
            }

            // Push profile updates (which include XP) to server
            if (EduApp.USE_SERVER_BACKEND) {
                const token = sessionStorage.getItem('edu_platform_auth_token');
                if (token) {
                    fetch(`${EduApp.API_BASE}/api/auth/profile`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(user)
                    }).catch(err => console.warn("Background XP sync failed:", err.message));
                }
            }
            return true;
        }
        return false;
    },

    // Gamification: Award a Badge to a student
    awardBadge(studentId, badgeName) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === studentId);
        if (index !== -1) {
            const user = users[index];
            if (user.role !== 'student') return false;

            user.badges = user.badges || [];
            if (!user.badges.includes(badgeName)) {
                user.badges.push(badgeName);
                users[index] = user;
                localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));

                // Sync current user session
                const currentUser = this.getCurrentUser();
                if (currentUser && currentUser.id === studentId) {
                    this.setCurrentUser(user);
                }

                if (window.EduApp && window.EduApp.toast) {
                    window.EduApp.toast.show(`🏆 Badge Unlocked: ${badgeName}!`);
                }

                // Push badge profile update to server
                if (EduApp.USE_SERVER_BACKEND) {
                    const token = sessionStorage.getItem('edu_platform_auth_token');
                    if (token) {
                        fetch(`${EduApp.API_BASE}/api/auth/profile`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify(user)
                        }).catch(err => console.warn("Background Badge sync failed:", err.message));
                    }
                }
                return true;
            }
        }
        return false;
    },

    // Add a new user (Sign Up)
    async registerUser(name, email, password, role) {
        if (EduApp.USE_SERVER_BACKEND) {
            try {
                const res = await fetch(`${EduApp.API_BASE}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, role })
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Registration failed');
                }
                const data = await res.json();
                sessionStorage.setItem('edu_platform_auth_token', data.token);
                this.setCurrentUser(data.user);
                
                // Mirror locally
                const users = this.getUsers();
                if (!users.some(u => u.id === data.user.id)) {
                    users.push(data.user);
                    localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
                }
                return data.user;
            } catch (err) {
                console.error("Auth register failed on server:", err.message);
                throw err;
            }
        }

        // Fallback Local Storage logic
        const users = this.getUsers();
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            throw new Error('An account with this email already exists.');
        }

        const newUser = {
            id: (role === 'student' ? 'std_' : 'tea_') + Date.now(),
            email: email,
            password: password,
            name: name,
            role: role,
            avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
            grade: role === 'student' ? '12th Grade' : null,
            goals: role === 'student' ? 'Complete outstanding course curriculum and achieve top test scores.' : null,
            preferences: role === 'student' ? {
                emailAlerts: true,
                classReminders: true,
                weeklyReport: false
            } : null,
            purchasedSets: [],
            enrolledClasses: role === 'student' ? [] : null
        };

        users.push(newUser);
        localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
        return newUser;
    },

    // Validate login credentials
    async authenticate(email, password) {
        if (EduApp.USE_SERVER_BACKEND) {
            try {
                const res = await fetch(`${EduApp.API_BASE}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Invalid credentials');
                }
                const data = await res.json();
                sessionStorage.setItem('edu_platform_auth_token', data.token);
                this.setCurrentUser(data.user);
                
                // Synchronize client cache on login
                await this.syncCache();
                return data.user;
            } catch (err) {
                console.error("Auth login failed on server, falling back to local:", err.message);
                throw err;
            }
        }

        // Fallback Local Storage logic
        const users = this.getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        if (user) {
            this.setCurrentUser(user);
            return user;
        }
        return null;
    },

    // Get all document sets
    getDocumentSets() {
        return JSON.parse(localStorage.getItem(this.KEYS.DOCUMENT_SETS)) || [];
    },

    // Add a newly uploaded document set
    async addDocumentSet(title, subject, type, price, fileName, fileSize, pdfDataUrl) {
        const id = 'set_' + Date.now();
        const newSet = {
            id,
            title,
            subject,
            pages: 1, // Placeholder since we render direct PDF
            size: fileSize,
            type,
            price: type === 'trial' ? 0 : parseFloat(price),
            pdfDataUrl,
            content: ["This is a preview of the uploaded PDF file. Click Open Full Document to read."]
        };

        const sets = this.getDocumentSets();
        sets.push(newSet);
        try {
            localStorage.setItem(this.KEYS.DOCUMENT_SETS, JSON.stringify(sets));
        } catch (e) {
            console.error("Local storage save failed:", e);
            throw new Error("Local Storage quota exceeded. Try uploading a smaller PDF file.");
        }

        // Sync with backend server
        if (EduApp.USE_SERVER_BACKEND) {
            const token = sessionStorage.getItem('edu_platform_auth_token');
            if (token) {
                const res = await fetch(`${EduApp.API_BASE}/api/document-sets`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(newSet)
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Failed to upload document set to server');
                }
            }
        }
        return true;
    },

    // Purchase a premium set for a student user
    purchaseSet(userId, setId) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            const user = users[index];
            user.purchasedSets = user.purchasedSets || [];
            if (!user.purchasedSets.includes(setId)) {
                user.purchasedSets.push(setId);
                users[index] = user;
                localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
                // Update current user session
                this.setCurrentUser(user);

                // Sync with server
                if (EduApp.USE_SERVER_BACKEND) {
                    const token = sessionStorage.getItem('edu_platform_auth_token');
                    if (token) {
                        fetch(`${EduApp.API_BASE}/api/users/toggle-set-access`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ userId, setId, grant: true })
                        }).catch(err => console.warn("Background purchaseSet sync failed:", err.message));
                    }
                }
                return true;
            }
        }
        return false;
    },

    // Create a new batch (class)
    createBatch(title, subject, time, duration) {
        const classes = this.getClasses();
        const date = new Date(time);
        const now = new Date();
        
        const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isToday = date.toDateString() === now.toDateString();
        
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        const isTomorrow = date.toDateString() === tomorrow.toDateString();
        
        const durationStr = (typeof duration === 'string' && duration.includes('min')) ? duration : `${duration} mins`;
        
        let displayTime = '';
        if (isToday) {
            displayTime = `Today at ${timeString} (${durationStr})`;
        } else if (isTomorrow) {
            displayTime = `Tomorrow at ${timeString} (${durationStr})`;
        } else {
            const dateString = date.toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });
            displayTime = `${dateString} at ${timeString} (${durationStr})`;
        }
        
        const currentUser = this.getCurrentUser();
        const instructorName = (currentUser && currentUser.role === 'teacher') ? currentUser.name : 'Dr. Clara Oswald';
        
        const newClass = {
            id: 'cls_' + Date.now(),
            title: title,
            instructor: instructorName,
            subject: subject,
            time: date.toISOString(),
            displayTime: displayTime,
            duration: durationStr,
            meetingUrl: 'https://meet.google.com/mock-class-room',
            image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=600'
        };
        
        classes.push(newClass);
        localStorage.setItem(this.KEYS.CLASSES, JSON.stringify(classes));

        // Sync with backend server
        if (EduApp.USE_SERVER_BACKEND) {
            const token = sessionStorage.getItem('edu_platform_auth_token');
            if (token) {
                fetch(`${EduApp.API_BASE}/api/classes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(newClass)
                }).catch(err => console.warn("Background createBatch sync failed:", err.message));
            }
        }
        return true;
    },

    // Create a new test
    createTest(title, subject, questionsCount, duration, dueDate, questions = []) {
        const tests = this.getTests();
        const durationStr = (typeof duration === 'string' && duration.includes('min')) ? duration : `${duration} mins`;
        
        let dueDateStr = dueDate;
        if (dueDate instanceof Date) {
            dueDateStr = dueDate.toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });
        } else if (typeof dueDate === 'string') {
            const parsed = new Date(dueDate);
            if (!isNaN(parsed.getTime())) {
                dueDateStr = parsed.toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });
            }
        }
        
        const newTest = {
            id: 'tst_' + Date.now(),
            title: title,
            subject: subject,
            questionsCount: parseInt(questionsCount, 10) || 10,
            duration: durationStr,
            status: 'active',
            score: null,
            dueDate: dueDateStr,
            questions: questions
        };
        
        tests.push(newTest);
        localStorage.setItem(this.KEYS.TESTS, JSON.stringify(tests));

        // Sync with backend server
        if (EduApp.USE_SERVER_BACKEND) {
            const token = sessionStorage.getItem('edu_platform_auth_token');
            if (token) {
                fetch(`${EduApp.API_BASE}/api/tests`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(newTest)
                }).catch(err => console.warn("Background createTest sync failed:", err.message));
            }
        }
        return true;
    },

    // Get all homework submissions
    getHomework() {
        return JSON.parse(localStorage.getItem(this.KEYS.HOMEWORK)) || [];
    },

    // Submit homework PDF file (supports saving a new virtual assignment too)
    async submitHomework(homeworkId, fileName, fileSize, studentId = null, title = null, subject = null, fileDataUrl = null) {
        const homework = this.getHomework();
        let index = homework.findIndex(hw => hw.id === homeworkId);
        let activeStudentId = studentId || (this.getCurrentUser() ? this.getCurrentUser().id : null);
        let newHw = null;
        
        if (index === -1 && activeStudentId && title) {
            const users = this.getUsers();
            const studentObj = users.find(u => u.id === activeStudentId) || { name: 'Student' };
            newHw = {
                id: 'hw_' + Date.now(),
                studentId: activeStudentId,
                studentName: studentObj.name,
                name: studentObj.name,
                title: title,
                subject: subject || 'General',
                submittedAt: new Date().toISOString(),
                status: 'submitted',
                fileName: fileName,
                fileSize: fileSize,
                fileDataUrl: fileDataUrl,
                grade: null,
                score: null,
                feedback: null
            };
            homework.push(newHw);
            try {
                localStorage.setItem(this.KEYS.HOMEWORK, JSON.stringify(homework));
                this.awardXP(activeStudentId, 100, `Submitted Homework: ${title}`);
                this.awardBadge(activeStudentId, 'Homework Hero');
            } catch (e) {
                console.error("Local storage save failed:", e);
                throw new Error("Storage quota exceeded. Please upload a smaller PDF file (under 2MB).");
            }
        } else if (index !== -1) {
            const hwTitle = homework[index].title;
            homework[index].status = 'submitted';
            homework[index].submittedAt = new Date().toISOString();
            homework[index].fileName = fileName;
            homework[index].fileSize = fileSize;
            homework[index].fileDataUrl = fileDataUrl;
            try {
                localStorage.setItem(this.KEYS.HOMEWORK, JSON.stringify(homework));
                if (activeStudentId) {
                    this.awardXP(activeStudentId, 100, `Submitted Homework: ${hwTitle}`);
                    this.awardBadge(activeStudentId, 'Homework Hero');
                }
            } catch (e) {
                console.error("Local storage save failed:", e);
                throw new Error("Storage quota exceeded. Please upload a smaller PDF file (under 2MB).");
            }
        }

        // Sync with backend server
        if (EduApp.USE_SERVER_BACKEND) {
            const token = sessionStorage.getItem('edu_platform_auth_token');
            if (token) {
                try {
                    await fetch(`${EduApp.API_BASE}/api/homework`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            homeworkId: homeworkId || (newHw ? newHw.id : null),
                            fileName,
                            fileSize,
                            studentId: studentId || (homeworkId ? null : activeStudentId),
                            title: title || (homeworkId ? null : newHw.title),
                            subject: subject || (homeworkId ? null : newHw.subject),
                            fileDataUrl
                        })
                    });
                } catch (err) {
                    console.warn("Background submitHomework sync failed:", err.message);
                }
            }
        }
        return true;
    },

    // Create a new homework assignment for all students in the database
    async createHomeworkAssignment(title, subject) {
        const homework = this.getHomework();
        const users = this.getUsers().filter(u => u.role === 'student');
        
        users.forEach(student => {
            const exists = homework.some(hw => hw.studentId === student.id && hw.title === title);
            if (!exists) {
                homework.push({
                    id: 'hw_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    studentId: student.id,
                    studentName: student.name,
                    name: student.name,
                    title: title,
                    subject: subject,
                    submittedAt: null,
                    status: 'pending',
                    fileName: null,
                    fileSize: null,
                    grade: null,
                    score: null,
                    feedback: null
                });
            }
        });
        localStorage.setItem(this.KEYS.HOMEWORK, JSON.stringify(homework));

        // Sync with server
        if (EduApp.USE_SERVER_BACKEND) {
            const token = sessionStorage.getItem('edu_platform_auth_token');
            if (token) {
                try {
                    await fetch(`${EduApp.API_BASE}/api/homework/assignments`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ title, subject })
                    });
                } catch (err) {
                    console.warn("Background createHomeworkAssignment sync failed:", err.message);
                }
            }
        }
        return true;
    },

    // Get attendance records
    getAttendance() {
        return JSON.parse(localStorage.getItem(this.KEYS.ATTENDANCE)) || { today: [], history: [] };
    },

    // Save attendance list for today
    async saveAttendance(todaySheet) {
        const attendance = this.getAttendance();
        attendance.today = todaySheet;
        
        const todayDateStr = new Date().toISOString().split('T')[0];
        const existingHistoryIndex = attendance.history.findIndex(h => h.date === todayDateStr);
        if (existingHistoryIndex !== -1) {
            attendance.history[existingHistoryIndex].records = todaySheet;
        } else {
            attendance.history.unshift({
                date: todayDateStr,
                records: todaySheet
            });
        }
        
        localStorage.setItem(this.KEYS.ATTENDANCE, JSON.stringify(attendance));

        // Sync with server
        if (EduApp.USE_SERVER_BACKEND) {
            const token = sessionStorage.getItem('edu_platform_auth_token');
            if (token) {
                const list = todaySheet.map(r => ({
                    studentId: r.studentId,
                    studentName: r.name || r.studentName,
                    status: r.status
                }));
                try {
                    await fetch(`${EduApp.API_BASE}/api/attendance`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ attendanceList: list })
                    });
                } catch (err) {
                    console.warn("Background saveAttendance sync failed:", err.message);
                }
            }
        }
        return true;
    },

    // Get access control list (granted sets per student ID)
    getAccessControl() {
        return JSON.parse(localStorage.getItem(this.KEYS.ACCESS_CONTROL)) || {};
    },

    // Grant or revoke document set access for a student
    grantAccess(studentId, setId, status) {
        const access = this.getAccessControl();
        if (!access[studentId]) {
            access[studentId] = [];
        }
        if (status) {
            if (!access[studentId].includes(setId)) {
                access[studentId].push(setId);
            }
        } else {
            access[studentId] = access[studentId].filter(id => id !== setId);
        }
        localStorage.setItem(this.KEYS.ACCESS_CONTROL, JSON.stringify(access));

        // Sync with server
        if (EduApp.USE_SERVER_BACKEND) {
            const token = sessionStorage.getItem('edu_platform_auth_token');
            if (token) {
                fetch(`${EduApp.API_BASE}/api/users/toggle-set-access`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ userId: studentId, setId, grant: status })
                }).catch(err => console.warn("Background grantAccess sync failed:", err.message));
            }
        }
        return true;
    },

    // Rename a lecture
    renameLecture(lectureId, newName) {
        const lectures = this.getLectures();
        const index = lectures.findIndex(l => l.id === lectureId);
        if (index !== -1) {
            lectures[index].title = newName;
            localStorage.setItem(this.KEYS.LECTURES, JSON.stringify(lectures));

            // Sync with server
            if (EduApp.USE_SERVER_BACKEND) {
                const token = sessionStorage.getItem('edu_platform_auth_token');
                if (token) {
                    fetch(`${EduApp.API_BASE}/api/lectures/rename`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ lectureId, newName })
                    }).catch(err => console.warn("Background renameLecture sync failed:", err.message));
                }
            }
            return true;
        }
        return false;
    },

    // Rename a test
    renameTest(testId, newName) {
        const tests = this.getTests();
        const index = tests.findIndex(t => t.id === testId);
        if (index !== -1) {
            tests[index].title = newName;
            localStorage.setItem(this.KEYS.TESTS, JSON.stringify(tests));

            // Sync with server
            if (EduApp.USE_SERVER_BACKEND) {
                const token = sessionStorage.getItem('edu_platform_auth_token');
                if (token) {
                    fetch(`${EduApp.API_BASE}/api/tests/rename`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ testId, newName })
                    }).catch(err => console.warn("Background renameTest sync failed:", err.message));
                }
            }
            return true;
        }
        return false;
    },

    // Add a new test (legacy helper)
    async addTest(testData) {
        const tests = this.getTests();
        tests.push(testData);
        localStorage.setItem(this.KEYS.TESTS, JSON.stringify(tests));

        // Sync with backend server
        if (EduApp.USE_SERVER_BACKEND) {
            const token = sessionStorage.getItem('edu_platform_auth_token');
            if (token) {
                try {
                    await fetch(`${EduApp.API_BASE}/api/tests`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(testData)
                    });
                } catch (err) {
                    console.warn("Background addTest sync failed:", err.message);
                }
            }
        }
        return testData;
    },

    // Add a new class (batch) directly
    async addClass(classData) {
        const classes = this.getClasses();
        classes.push(classData);
        localStorage.setItem(this.KEYS.CLASSES, JSON.stringify(classes));

        // Sync with backend server
        if (EduApp.USE_SERVER_BACKEND) {
            const token = sessionStorage.getItem('edu_platform_auth_token');
            if (token) {
                try {
                    await fetch(`${EduApp.API_BASE}/api/classes`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(classData)
                    });
                } catch (err) {
                    console.warn("Background addClass sync failed:", err.message);
                }
            }
        }
        return true;
    },

    // Enroll student in a class (batch)
    enrollStudentInClass(studentId, classId) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === studentId);
        if (index !== -1) {
            const user = users[index];
            user.enrolledClasses = user.enrolledClasses || [];
            if (!user.enrolledClasses.includes(classId)) {
                user.enrolledClasses.push(classId);
                users[index] = user;
                localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
                
                // Award Badge!
                this.awardBadge(studentId, 'Active Learner');

                // Sync session if updating current logged in user
                const currentUser = this.getCurrentUser();
                if (currentUser && currentUser.id === studentId) {
                    this.setCurrentUser(user);
                }
                return true;
            }
        }
        return false;
    },

    // Remove student from a class (batch)
    removeStudentFromClass(studentId, classId) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === studentId);
        if (index !== -1) {
            const user = users[index];
            user.enrolledClasses = user.enrolledClasses || [];
            if (user.enrolledClasses.includes(classId)) {
                user.enrolledClasses = user.enrolledClasses.filter(id => id !== classId);
                users[index] = user;
                localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));

                // Sync session if updating current logged in user
                const currentUser = this.getCurrentUser();
                if (currentUser && currentUser.id === studentId) {
                    this.setCurrentUser(user);
                }

                // Sync with server
                if (EduApp.USE_SERVER_BACKEND) {
                    const token = sessionStorage.getItem('edu_platform_auth_token');
                    if (token) {
                        fetch(`${EduApp.API_BASE}/api/classes/remove-student`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ studentId, classId })
                        }).catch(err => console.warn("Background removeStudentFromClass sync failed:", err.message));
                    }
                }
                return true;
            }
        }
        return false;
    },

    // Grant or revoke access to a set for a user (legacy helper)
    toggleSetAccess(userId, setId, grant) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            const user = users[index];
            user.purchasedSets = user.purchasedSets || [];
            const hasSet = user.purchasedSets.includes(setId);
            if (grant && !hasSet) {
                user.purchasedSets.push(setId);
            } else if (!grant && hasSet) {
                user.purchasedSets = user.purchasedSets.filter(id => id !== setId);
            }
            users[index] = user;
            localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));

            // Sync session if updating current logged in user
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.id === userId) {
                this.setCurrentUser(user);
            }
            return true;
        }
        return false;
    },

    // Get all student join requests
    getJoinRequests() {
        return JSON.parse(localStorage.getItem('edu_platform_join_requests')) || [];
    },

    // Create a new batch join request
    async createJoinRequest(studentId, classId) {
        const requests = this.getJoinRequests();
        const users = this.getUsers();
        const classes = this.getClasses();

        const student = users.find(u => u.id === studentId) || { name: 'Student', email: 'student@edu.com' };
        const targetClass = classes.find(c => c.id === classId) || { title: 'Batch Course', instructor: 'Dr. Oswald' };

        const newRequest = {
            id: 'req_' + Date.now(),
            studentId: studentId,
            studentName: student.name,
            studentEmail: student.email,
            classId: classId,
            classTitle: targetClass.title,
            teacherName: targetClass.instructor,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        requests.push(newRequest);
        localStorage.setItem('edu_platform_join_requests', JSON.stringify(requests));

        // Sync with server
        if (EduApp.USE_SERVER_BACKEND) {
            const token = sessionStorage.getItem('edu_platform_auth_token');
            if (token) {
                try {
                    await fetch(`${EduApp.API_BASE}/api/classes/requests`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ classId })
                    });
                } catch (err) {
                    console.warn("Background createJoinRequest sync failed:", err.message);
                }
            }
        }
        return true;
    },

    // Approve join request (adds student to batch and marks approved)
    async approveJoinRequest(requestId) {
        const requests = this.getJoinRequests();
        const index = requests.findIndex(r => r.id === requestId);
        if (index !== -1) {
            const req = requests[index];
            req.status = 'approved';
            
            // Enroll student
            this.enrollStudentInClass(req.studentId, req.classId);
            localStorage.setItem('edu_platform_join_requests', JSON.stringify(requests));

            // Sync with server
            if (EduApp.USE_SERVER_BACKEND) {
                const token = sessionStorage.getItem('edu_platform_auth_token');
                if (token) {
                    try {
                        await fetch(`${EduApp.API_BASE}/api/classes/requests/${requestId}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ status: 'approved' })
                        });
                    } catch (err) {
                        console.warn("Background approveJoinRequest sync failed:", err.message);
                    }
                }
            }
            return true;
        }
        return false;
    },

    // Reject join request
    async rejectJoinRequest(requestId) {
        const requests = this.getJoinRequests();
        const index = requests.findIndex(r => r.id === requestId);
        if (index !== -1) {
            requests[index].status = 'rejected';
            localStorage.setItem('edu_platform_join_requests', JSON.stringify(requests));

            // Sync with server
            if (EduApp.USE_SERVER_BACKEND) {
                const token = sessionStorage.getItem('edu_platform_auth_token');
                if (token) {
                    try {
                        await fetch(`${EduApp.API_BASE}/api/classes/requests/${requestId}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ status: 'rejected' })
                        });
                    } catch (err) {
                        console.warn("Background rejectJoinRequest sync failed:", err.message);
                    }
                }
            }
            return true;
        }
        return false;
    },

    // Get current live class state
    getLiveClassState() {
        const state = localStorage.getItem(this.KEYS.LIVE_CLASS_STATE);
        if (!state) {
            return {
                classId: "",
                status: "ended",
                currentSlide: 0,
                drawings: [],
                chat: [],
                handRaises: []
            };
        }
        return JSON.parse(state);
    },

    // Update live class state
    updateLiveClassState(newState) {
        const currentState = this.getLiveClassState();
        const updatedState = { ...currentState, ...newState };
        localStorage.setItem(this.KEYS.LIVE_CLASS_STATE, JSON.stringify(updatedState));
        return updatedState;
    },

    // Clear live class state
    clearLiveClassState() {
        const endedState = {
            classId: "",
            status: "ended",
            currentSlide: 0,
            drawings: [],
            chat: [],
            handRaises: []
        };
        localStorage.setItem(this.KEYS.LIVE_CLASS_STATE, JSON.stringify(endedState));
        return endedState;
    },

    // Convert Base64 Data URL to Blob binary object
    dataURLtoBlob(dataurl) {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    },

    // Sync student stay time heartbeat
    async logStayHeartbeat(staySeconds, stayTimeStr) {
        if (EduApp.USE_SERVER_BACKEND) {
            const token = sessionStorage.getItem('edu_platform_auth_token');
            if (token) {
                fetch(`${EduApp.API_BASE}/api/attendance/stay`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ staySeconds, stayTimeStr })
                }).catch(err => console.warn("Background stay heartbeat sync failed:", err.message));
            }
        }
    },

    // Cache synchronizer method
    async syncCache() {
        if (!EduApp.USE_SERVER_BACKEND) return;
        const currentUser = this.getCurrentUser();
        if (!currentUser) return;
        
        const token = sessionStorage.getItem('edu_platform_auth_token');
        if (!token) return;

        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            // 1. Sync User profile
            const meRes = await fetch(`${EduApp.API_BASE}/api/auth/me`, { headers });
            if (meRes.ok) {
                const me = await meRes.json();
                const users = this.getUsers();
                const idx = users.findIndex(u => u.id === me.id);
                if (idx !== -1) {
                    users[idx] = me;
                } else {
                    users.push(me);
                }
                localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
                sessionStorage.setItem(this.KEYS.CURRENT_USER, JSON.stringify(me));
            }

            // If teacher, sync all users (for rankings/student matrices)
            if (currentUser.role === 'teacher') {
                const usersRes = await fetch(`${EduApp.API_BASE}/api/users`, { headers });
                if (usersRes.ok) {
                    const allUsers = await usersRes.json();
                    localStorage.setItem(this.KEYS.USERS, JSON.stringify(allUsers));
                }
            }

            // 2. Sync Classes
            const classesRes = await fetch(`${EduApp.API_BASE}/api/classes`);
            if (classesRes.ok) {
                const classes = await classesRes.json();
                localStorage.setItem(this.KEYS.CLASSES, JSON.stringify(classes));
            }

            // 3. Sync Join Requests
            const requestsRes = await fetch(`${EduApp.API_BASE}/api/classes/requests`, { headers });
            if (requestsRes.ok) {
                const requests = await requestsRes.json();
                localStorage.setItem('edu_platform_join_requests', JSON.stringify(requests));
            }

            // 4. Sync Lectures
            const lecturesRes = await fetch(`${EduApp.API_BASE}/api/lectures`);
            if (lecturesRes.ok) {
                const lectures = await lecturesRes.json();
                localStorage.setItem(this.KEYS.LECTURES, JSON.stringify(lectures));
            }

            // 5. Sync Tests
            const testsRes = await fetch(`${EduApp.API_BASE}/api/tests`);
            if (testsRes.ok) {
                const tests = await testsRes.json();
                localStorage.setItem(this.KEYS.TESTS, JSON.stringify(tests));
            }

            // 6. Sync Homework
            const homeworkRes = await fetch(`${EduApp.API_BASE}/api/homework`, { headers });
            if (homeworkRes.ok) {
                const homework = await homeworkRes.json();
                localStorage.setItem(this.KEYS.HOMEWORK, JSON.stringify(homework));
            }

            // 8. Sync Document Sets
            const setsRes = await fetch(`${EduApp.API_BASE}/api/document-sets`);
            if (setsRes.ok) {
                const setsList = await setsRes.json();
                localStorage.setItem(this.KEYS.DOCUMENT_SETS, JSON.stringify(setsList));
            }

            // 7. Sync Attendance
            const attendanceRes = await fetch(`${EduApp.API_BASE}/api/attendance`, { headers });
            if (attendanceRes.ok) {
                const attendanceList = await attendanceRes.json();
                const todayDateStr = new Date().toISOString().split('T')[0];
                const todayRecords = attendanceList.filter(a => a.date === todayDateStr).map(a => ({
                    studentId: a.studentId,
                    studentName: a.studentName,
                    name: a.studentName,
                    status: a.status
                }));
                
                const grouped = {};
                attendanceList.forEach(a => {
                    if (!grouped[a.date]) grouped[a.date] = [];
                    grouped[a.date].push({
                        studentId: a.studentId,
                        studentName: a.studentName,
                        name: a.studentName,
                        status: a.status
                    });
                });
                const historyList = Object.keys(grouped).map(date => ({
                    date,
                    records: grouped[date]
                })).sort((a,b) => b.date.localeCompare(a.date));

                localStorage.setItem(this.KEYS.ATTENDANCE, JSON.stringify({
                    today: todayRecords,
                    history: historyList
                }));
                
                const todayStatus = {};
                attendanceList.filter(a => a.date === todayDateStr).forEach(a => {
                    todayStatus[a.studentId] = {
                        present: a.status === 'present',
                        staySeconds: a.staySeconds || 0,
                        stayTimeStr: a.stayTimeStr || '0 secs'
                    };
                });
                localStorage.setItem('edu_teacher_attendance_today', JSON.stringify(todayStatus));
            }
        } catch (err) {
            console.warn("API Sync warning (server offline):", err.message);
        }
    }
};

// Initialize the database instantly
EduApp.db.init();
