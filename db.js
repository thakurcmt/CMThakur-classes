const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize DB schema
db.serialize(() => {
    // 1. Create Users Table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            password_hash TEXT,
            name TEXT,
            role TEXT,
            grade TEXT,
            goals TEXT,
            preferences TEXT,
            enrolledClasses TEXT,
            purchasedSets TEXT,
            testScores TEXT
        )
    `);

    // 2. Create Classes Table
    db.run(`
        CREATE TABLE IF NOT EXISTS classes (
            id TEXT PRIMARY KEY,
            title TEXT,
            instructor TEXT,
            subject TEXT,
            time TEXT,
            displayTime TEXT,
            duration TEXT,
            meetingUrl TEXT,
            image TEXT
        )
    `);

    // 3. Create Join Requests Table
    db.run(`
        CREATE TABLE IF NOT EXISTS join_requests (
            id TEXT PRIMARY KEY,
            studentId TEXT,
            studentName TEXT,
            studentEmail TEXT,
            classId TEXT,
            classTitle TEXT,
            teacherName TEXT,
            status TEXT,
            createdAt TEXT
        )
    `);

    // 4. Create Lectures Table
    db.run(`
        CREATE TABLE IF NOT EXISTS lectures (
            id TEXT PRIMARY KEY,
            title TEXT,
            subject TEXT,
            instructor TEXT,
            date TEXT,
            duration TEXT,
            thumbnail TEXT,
            videoUrl TEXT
        )
    `);

    // 5. Create Tests Table
    db.run(`
        CREATE TABLE IF NOT EXISTS tests (
            id TEXT PRIMARY KEY,
            title TEXT,
            subject TEXT,
            questionsCount INTEGER,
            duration TEXT,
            status TEXT,
            dueDate TEXT,
            questions TEXT
        )
    `);

    // 6. Create Test Scores Table
    db.run(`
        CREATE TABLE IF NOT EXISTS test_scores (
            id TEXT PRIMARY KEY,
            studentId TEXT,
            testId TEXT,
            score INTEGER,
            completedDate TEXT,
            UNIQUE(studentId, testId)
        )
    `);

    // 7. Create Homework Table
    db.run(`
        CREATE TABLE IF NOT EXISTS homework (
            id TEXT PRIMARY KEY,
            studentId TEXT,
            studentName TEXT,
            name TEXT,
            title TEXT,
            subject TEXT,
            submittedAt TEXT,
            status TEXT,
            fileName TEXT,
            fileSize TEXT,
            fileDataUrl TEXT,
            grade TEXT,
            score INTEGER,
            feedback TEXT
        )
    `);

    // 8. Create Attendance Table
    db.run(`
        CREATE TABLE IF NOT EXISTS attendance (
            id TEXT PRIMARY KEY,
            date TEXT,
            studentId TEXT,
            studentName TEXT,
            status TEXT,
            staySeconds INTEGER,
            stayTimeStr TEXT
        )
    `);

    // 9. Create Document Sets Table
    db.run(`
        CREATE TABLE IF NOT EXISTS document_sets (
            id TEXT PRIMARY KEY,
            title TEXT,
            subject TEXT,
            pages INTEGER,
            size TEXT,
            type TEXT,
            price REAL,
            pdfDataUrl TEXT,
            content TEXT
        )
    `);

    // Seed default users if users table is empty
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        if (err) {
            console.error("Error checking user counts:", err);
            return;
        }

        if (row.count === 0) {
            console.log("Seeding database with default users...");
            
            const passHash = bcrypt.hashSync('password', 10);
            
            // Seed student 1
            db.run(`
                INSERT INTO users (id, email, password_hash, name, role, grade, goals, preferences, enrolledClasses, purchasedSets, testScores)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                'std_001', 
                'student1@edu.com', 
                passHash, 
                'Student One', 
                'student', 
                '6th Grade', 
                'Master Class 6 Math concepts and prepare for exams.',
                JSON.stringify({ emailAlerts: true, classReminders: true, weeklyReport: false }),
                JSON.stringify([]),
                JSON.stringify([]),
                JSON.stringify({})
            ]);

            // Seed student 2
            db.run(`
                INSERT INTO users (id, email, password_hash, name, role, grade, goals, preferences, enrolledClasses, purchasedSets, testScores)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                'std_002', 
                'student2@edu.com', 
                passHash, 
                'Student Two', 
                'student', 
                '6th Grade', 
                'Improve algebraic thinking and geometric visualization.',
                JSON.stringify({ emailAlerts: true, classReminders: true, weeklyReport: true }),
                JSON.stringify([]),
                JSON.stringify([]),
                JSON.stringify({})
            ]);

            // Seed teacher
            db.run(`
                INSERT INTO users (id, email, password_hash, name, role, grade, goals, preferences, enrolledClasses, purchasedSets, testScores)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                'tea_001', 
                'teacher@edu.com', 
                passHash, 
                'Primary Educator', 
                'teacher', 
                null, 
                null, 
                null,
                null,
                JSON.stringify([]),
                null
            ]);
            
            console.log("Default users seeded successfully.");
        }
    });

    // Seed default document sets if document_sets table is empty
    db.get("SELECT COUNT(*) as count FROM document_sets", (err, row) => {
        if (err) {
            console.error("Error checking document sets counts:", err);
            return;
        }

        if (!row || row.count === 0) {
            console.log("Seeding database with default document sets...");
            const initialSets = [
                {
                    id: 'set_001',
                    title: 'Fractions and Decimals Practice Set',
                    subject: 'Mathematics',
                    pages: 5,
                    size: '1.2 MB',
                    type: 'trial',
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
            initialSets.forEach(set => {
                db.run(`
                    INSERT INTO document_sets (id, title, subject, pages, size, type, price, pdfDataUrl, content)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    set.id,
                    set.title,
                    set.subject,
                    set.pages,
                    set.size,
                    set.type,
                    set.price,
                    null,
                    JSON.stringify(set.content)
                ]);
            });
            console.log("Default document sets seeded successfully.");
        }
    });
});

// Promise-based wrappers for database operations
const query = {
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    },
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
};

module.exports = query;
