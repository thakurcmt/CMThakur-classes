window.EduApp = window.EduApp || {};

EduApp.StudentProgress = {
    // Sub-page active view: 'lectures', 'tests', or 'tools'
    activeTab: 'lectures',
    selectedDeckSubject: 'Fractions & Decimals',
    currentCardIdx: 0,
    isFlipped: false,

    render() {
        const container = document.createElement('div');
        container.className = 'student-progress-wrapper';

        container.innerHTML = `
            <!-- Division Tab Switcher -->
            <div class="page-tabs">
                <div class="page-tab ${this.activeTab === 'lectures' ? 'active' : ''}" id="prog-tab-lectures">Previous Lectures</div>
                <div class="page-tab ${this.activeTab === 'tests' ? 'active' : ''}" id="prog-tab-tests">Assessments & Tests</div>
                <div class="page-tab ${this.activeTab === 'tools' ? 'active' : ''}" id="prog-tab-tools">Interactive Study Tools</div>
            </div>

            <!-- Content Container -->
            <div id="progress-content-viewport"></div>
        `;

        const viewport = container.querySelector('#progress-content-viewport');

        if (this.activeTab === 'lectures') {
            viewport.appendChild(this.renderLectures());
        } else if (this.activeTab === 'tests') {
            viewport.appendChild(this.renderTests());
        } else if (this.activeTab === 'tools') {
            viewport.appendChild(this.renderStudyTools());
        }

        // Tab selection events
        container.querySelector('#prog-tab-lectures').addEventListener('click', () => {
            this.activeTab = 'lectures';
            EduApp.router.updateWorkspace(); // Re-render current route
        });
        container.querySelector('#prog-tab-tests').addEventListener('click', () => {
            this.activeTab = 'tests';
            EduApp.router.updateWorkspace();
        });
        container.querySelector('#prog-tab-tools').addEventListener('click', () => {
            this.activeTab = 'tools';
            EduApp.router.updateWorkspace();
        });

        return container;
    },

    // Render Tab 1: Recorded Lectures List
    renderLectures() {
        const user = EduApp.db.getCurrentUser() || { id: 'std_001', name: 'Student One' };
        const enrolledClassIds = user.enrolledClasses || [];
        const classes = EduApp.db.getClasses();
        const studentClasses = classes.filter(cls => enrolledClassIds.includes(cls.id));
        const enrolledSubjects = studentClasses.map(c => c.subject);

        const lectures = EduApp.db.getLectures().filter(lec => enrolledSubjects.includes(lec.subject));
        const wrapper = document.createElement('div');
        wrapper.className = 'lectures-list';

        if (lectures.length === 0) {
            wrapper.innerHTML = `<p class="text-secondary text-center" style="padding: 40px 0;">No past lectures found.</p>`;
            return wrapper;
        }

        lectures.forEach(lec => {
            const card = document.createElement('div');
            card.className = 'lecture-card';

            // Generate materials buttons
            let materialsHtml = '';
            if (lec.materials && lec.materials.length > 0) {
                lec.materials.forEach(mat => {
                    materialsHtml += `
                        <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 11px; display: inline-flex; align-items: center;" onclick="EduApp.toast.show('Downloading ${mat}...')">
                            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" style="margin-right:4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            ${mat}
                        </button>
                    `;
                });
            }

            card.innerHTML = `
                <div class="lecture-thumbnail" style="background-image: linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.3)), url('${lec.thumbnail}')" id="play-btn-${lec.id}">
                    <!-- Play icon -->
                    <div style="background-color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm);">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="var(--primary)" stroke="none">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                    </div>
                </div>
                <div class="lecture-details">
                    <span class="class-subject-tag" style="position:static; padding: 2px 8px; font-size:10px; margin-bottom: 8px; display: inline-block;">${lec.subject}</span>
                    <h3 class="lecture-title">${lec.title}</h3>
                    <div class="lecture-meta">
                        <span>Instructor: <strong>${lec.instructor}</strong></span>
                        <span>Date: ${lec.date}</span>
                        <span>Duration: ${lec.duration}</span>
                    </div>
                    <div class="lecture-actions" style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                        ${materialsHtml}
                    </div>
                </div>
            `;

            // Play lecture click
            card.querySelector(`#play-btn-${lec.id}`).addEventListener('click', () => {
                this.launchVideoPlayer(lec);
            });

            wrapper.appendChild(card);
        });

        return wrapper;
    },

    // Renders the fullscreen video player modal
    launchVideoPlayer(lecture) {
        const backdrop = document.createElement('div');
        backdrop.className = 'video-modal-backdrop';
        backdrop.id = 'lecture-video-backdrop';

        backdrop.innerHTML = `
            <div class="video-modal-container">
                <button class="video-modal-close" id="video-modal-close-btn">&times;</button>
                <video class="video-player-frame" controls autoplay id="lecture-video-player">
                    <source src="${lecture.videoUrl}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <div style="padding: 16px 20px; background-color: var(--bg-surface); color: var(--text-primary);">
                    <h3 style="font-size: 16px; margin-bottom: 4px;">${lecture.title}</h3>
                    <p style="font-size: 12px; color: var(--text-secondary);">Instructor: ${lecture.instructor} &bull; Broadcast date: ${lecture.date}</p>
                </div>
            </div>
        `;

        document.body.appendChild(backdrop);

        // Bind events
        const videoElement = backdrop.querySelector('#lecture-video-player');
        
        let hashListener;
        const closeVideo = () => {
            if (hashListener) window.removeEventListener('hashchange', hashListener);
            videoElement.pause();
            backdrop.classList.remove('active');
            setTimeout(() => backdrop.remove(), 250);
        };

        hashListener = () => {
            closeVideo();
        };
        window.addEventListener('hashchange', hashListener);

        backdrop.querySelector('#video-modal-close-btn').addEventListener('click', closeVideo);
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeVideo();
        });

        // Trigger active visual class
        setTimeout(() => backdrop.classList.add('active'), 10);
    },

    // Render Tab 2: Assessment Tests
    renderTests() {
        const user = EduApp.db.getCurrentUser() || { id: 'std_001', name: 'Student One' };
        const enrolledClassIds = user.enrolledClasses || [];
        const classes = EduApp.db.getClasses();
        const studentClasses = classes.filter(cls => enrolledClassIds.includes(cls.id));
        const enrolledSubjects = studentClasses.map(c => c.subject);

        const tests = EduApp.db.getTests().filter(t => enrolledSubjects.includes(t.subject));
        const wrapper = document.createElement('div');
        wrapper.className = 'tests-division';

        const studentScores = user.testScores || {};
        const activeTests = tests.filter(t => !studentScores[t.id]);
        const completedTests = tests.filter(t => studentScores[t.id]);

        // Render Active Tests List
        let activeHtml = '';
        if (activeTests.length === 0) {
            activeHtml = `<p class="text-secondary" style="padding: 10px 0; font-size: 14px;">No active assessments currently open.</p>`;
        } else {
            activeHtml = `<div class="tests-list">`;
            activeTests.forEach(test => {
                activeHtml += `
                    <div class="test-card">
                        <div class="test-header">
                            <span class="test-subject">${test.subject}</span>
                            <span class="test-due">Due: ${test.dueDate}</span>
                        </div>
                        <h3 class="test-title">${test.title}</h3>
                        <div class="test-info-row">
                            <span>Questions: <strong>${test.questionsCount}</strong></span>
                            <span>Limit: <strong>${test.duration}</strong></span>
                        </div>
                        <button class="btn btn-primary" id="take-test-btn-${test.id}" style="width: 100%; margin-top: 10px; padding: 8px 16px; font-size: 13px;">
                            Take Assessment
                        </button>
                    </div>
                `;
            });
            activeHtml += `</div>`;
        }

        // Render Completed Tests List
        let completedHtml = '';
        if (completedTests.length === 0) {
            completedHtml = `<p class="text-secondary" style="padding: 10px 0; font-size: 14px;">No completed tests found.</p>`;
        } else {
            completedHtml = `<div class="tests-list">`;
            completedTests.forEach(test => {
                const scoreRecord = studentScores[test.id];
                completedHtml += `
                    <div class="test-card">
                        <div class="test-header">
                            <span class="test-subject">${test.subject}</span>
                            <span class="text-muted" style="font-size: 12px; font-weight: 500;">Completed: ${scoreRecord.completedDate}</span>
                        </div>
                        <h3 class="test-title">${test.title}</h3>
                        <div class="test-info-row" style="align-items: center; justify-content: space-between;">
                            <span>Questions: ${test.questionsCount}</span>
                            <div class="test-score-display">
                                <span class="test-score-val">${scoreRecord.score}</span>
                                <span class="test-score-max">/100</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            completedHtml += `</div>`;
        }

        wrapper.innerHTML = `
            <div>
                <h3 class="test-section-title">Active Assessments</h3>
                ${activeHtml}
            </div>
            
            <div style="margin-top: 24px;">
                <h3 class="test-section-title">Past Results</h3>
                ${completedHtml}
            </div>
        `;

        // Bind events for taking test
        activeTests.forEach(test => {
            const btn = wrapper.querySelector(`#take-test-btn-${test.id}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    this.launchTestInterface(test);
                });
            }
        });

        return wrapper;
    },

    // Renders the quiz taking interface
    launchTestInterface(test) {
        // Sample questions database by test topic
        const testTitle = test.title || '';
        let mockQuestions = [];
        if (test.questions && test.questions.length > 0) {
            mockQuestions = test.questions;
        } else if (testTitle.includes('Fraction') || testTitle.includes('Decimal')) {
            mockQuestions = [
                {
                    q: "1. Which fraction is equivalent to 2/3?",
                    opts: ["4/9", "6/9", "8/9", "5/6"],
                    correctIdx: 1
                },
                {
                    q: "2. Simplify the fraction 12/18 to its lowest terms:",
                    opts: ["6/9", "2/3", "3/4", "12/18"],
                    correctIdx: 1
                },
                {
                    q: "3. Convert the fraction 3/5 into a decimal:",
                    opts: ["0.3", "0.5", "0.6", "0.75"],
                    correctIdx: 2
                },
                {
                    q: "4. Convert the improper fraction 7/3 into a mixed number:",
                    opts: ["2 1/3", "1 2/3", "2 2/3", "3 1/3"],
                    correctIdx: 0
                }
            ];
        } else if (testTitle.includes('Numbers') || testTitle.includes('Factors') || testTitle.includes('LCM') || testTitle.includes('HCF')) {
            mockQuestions = [
                {
                    q: "1. What is the Highest Common Factor (HCF) of 12 and 18?",
                    opts: ["2", "3", "6", "12"],
                    correctIdx: 2
                },
                {
                    q: "2. What is the Least Common Multiple (LCM) of 8 and 12?",
                    opts: ["16", "24", "32", "48"],
                    correctIdx: 1
                },
                {
                    q: "3. Which of the following is a prime number?",
                    opts: ["9", "15", "17", "21"],
                    correctIdx: 2
                },
                {
                    q: "4. What is the prime factorization of 36?",
                    opts: ["2 * 2 * 3 * 3", "2 * 3 * 6", "4 * 9", "2 * 2 * 2 * 3"],
                    correctIdx: 0
                }
            ];
        } else if (testTitle.includes('Integer')) {
            mockQuestions = [
                {
                    q: "1. Evaluate the integer expression: (-5) + 8",
                    opts: ["-3", "3", "13", "-13"],
                    correctIdx: 1
                },
                {
                    q: "2. Which of the following statements is true?",
                    opts: ["-10 > -2", "-5 < -8", "-2 > -6", "0 < -4"],
                    correctIdx: 2
                },
                {
                    q: "3. Find the value of: (-7) - (-12)",
                    opts: ["-19", "-5", "5", "19"],
                    correctIdx: 2
                },
                {
                    q: "4. What is the absolute value of -15, written as |-15|?",
                    opts: ["-15", "0", "15", "1"],
                    correctIdx: 2
                }
            ];
        } else {
            // Geometry / General Math
            mockQuestions = [
                {
                    q: "1. What is the perimeter of a square with a side length of 5 cm?",
                    opts: ["10 cm", "20 cm", "25 cm", "15 cm"],
                    correctIdx: 1
                },
                {
                    q: "2. A line segment has how many endpoints?",
                    opts: ["Zero", "One", "Two", "Infinite"],
                    correctIdx: 2
                },
                {
                    q: "3. What is the name of an angle that is greater than 90° and less than 180°?",
                    opts: ["Acute angle", "Right angle", "Obtuse angle", "Reflex angle"],
                    correctIdx: 2
                },
                {
                    q: "4. Find the perimeter of a rectangle with length 8 cm and width 5 cm:",
                    opts: ["13 cm", "26 cm", "40 cm", "30 cm"],
                    correctIdx: 1
                }
            ];
        }

        // Create overlay container for taking test
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(15,23,42,0.8)';
        overlay.style.zIndex = '2000';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.overflowY = 'auto';

        let hashListener;
        const removeOverlay = () => {
            if (hashListener) window.removeEventListener('hashchange', hashListener);
            overlay.remove();
        };

        hashListener = () => {
            removeOverlay();
        };
        window.addEventListener('hashchange', hashListener);

        let currentQuestionIdx = 0;
        const answers = [];

        const renderQuestionScreen = () => {
            const qData = mockQuestions[currentQuestionIdx];
            
            overlay.innerHTML = `
                <div class="test-taking-container">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px; border-bottom: 1px solid var(--border); padding-bottom: 15px;">
                        <h2 style="font-size: 16px; font-family: var(--font-heading);">${test.title}</h2>
                        <span style="font-size: 12px; color: var(--text-secondary);">Question ${currentQuestionIdx + 1} of ${mockQuestions.length}</span>
                    </div>

                    <div class="test-q-num">Question ${currentQuestionIdx + 1}</div>
                    <div class="test-q-text">${qData.q}</div>

                    <div class="test-options">
                        ${qData.opts.map((opt, idx) => `
                            <div class="test-opt" data-idx="${idx}">${opt}</div>
                        `).join('')}
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <button class="btn btn-secondary" id="test-cancel-btn" style="font-size:13px;">Cancel</button>
                        <button class="btn btn-primary" id="test-next-btn" style="font-size:13px;" disabled>
                            ${currentQuestionIdx === mockQuestions.length - 1 ? 'Submit Answers' : 'Next Question'}
                        </button>
                    </div>
                </div>
            `;

            // Option selection logic
            const optionElements = overlay.querySelectorAll('.test-opt');
            const nextBtn = overlay.querySelector('#test-next-btn');
            
            optionElements.forEach(opt => {
                opt.addEventListener('click', (e) => {
                    optionElements.forEach(o => o.classList.remove('selected'));
                    opt.classList.add('selected');
                    answers[currentQuestionIdx] = parseInt(opt.getAttribute('data-idx'));
                    nextBtn.removeAttribute('disabled');
                });
            });

            // Cancel button
            overlay.querySelector('#test-cancel-btn').addEventListener('click', () => {
                if (confirm('Are you sure you want to cancel the test? Your progress will be lost.')) {
                    removeOverlay();
                }
            });

            // Next / Submit button
            nextBtn.addEventListener('click', () => {
                if (currentQuestionIdx < mockQuestions.length - 1) {
                    currentQuestionIdx++;
                    renderQuestionScreen();
                } else {
                    // Grade the test
                    let correctCount = 0;
                    mockQuestions.forEach((q, idx) => {
                        if (answers[idx] === q.correctIdx) correctCount++;
                    });
                    const finalScore = Math.round((correctCount / mockQuestions.length) * 100);

                    // Update in database
                    EduApp.db.submitTestScore(test.id, finalScore);
                    
                    overlay.innerHTML = `
                        <div class="test-taking-container text-center">
                            <h2 style="font-size: 24px; font-family: var(--font-heading); color: var(--primary); margin-bottom:12px;">Test Submitted!</h2>
                            <p class="text-secondary" style="font-size:15px; margin-bottom: 24px;">Thank you for completing the assessment.</p>
                            
                            <div style="width:120px; height:120px; border-radius:50%; border: 6px solid var(--primary-light); display:flex; flex-direction:column; justify-content:center; align-items:center; margin: 0 auto 24px auto;">
                                <span style="font-size:32px; font-weight:800; color:var(--primary); font-family:var(--font-heading);">${finalScore}</span>
                                <span style="font-size:12px; color:var(--text-muted); font-weight:600;">Score</span>
                            </div>

                            <button class="btn btn-primary" id="test-finish-btn" style="width: 100%;">Return to Progress Dashboard</button>
                        </div>
                    `;

                    overlay.querySelector('#test-finish-btn').addEventListener('click', () => {
                        removeOverlay();
                        EduApp.router.updateWorkspace(); // Refresh progress tabs
                        EduApp.toast.show(`Successfully completed ${test.title}!`);
                    });
                }
            });
        };

        document.body.appendChild(overlay);
        renderQuestionScreen();
    },

    renderStudyTools() {
        const user = EduApp.db.getCurrentUser() || { id: 'std_001', name: 'Student One' };
        
        const flashcardDecks = {
            'Fractions & Decimals': [
                { q: "What is a proper fraction?", a: "A fraction where the numerator is smaller than the denominator (e.g., 3/4)." },
                { q: "What is an improper fraction?", a: "A fraction where the numerator is larger than or equal to the denominator (e.g., 7/4)." },
                { q: "What are equivalent fractions?", a: "Fractions that look different but have the same value (e.g., 1/2 and 2/4)." },
                { q: "How do you convert 3/4 to a decimal?", a: "Divide 3 by 4, which equals 0.75." },
                { q: "What is a mixed number?", a: "A combination of a whole number and a proper fraction (e.g., 2 1/3)." }
            ],
            'Integers & Algebra': [
                { q: "What is an integer?", a: "A whole number (positive, negative, or zero) without fractional or decimal parts." },
                { q: "What is absolute value |x|?", a: "The distance of a number from zero on the number line (always positive or zero). E.g., |-7| = 7." },
                { q: "What is a variable?", a: "A letter or symbol used to represent an unknown value in algebra (e.g., x in x + 5)." },
                { q: "Evaluate: (-3) + (-5)", a: "-8 (Add their values and keep the common negative sign)." },
                { q: "Solve for x: x - 4 = 10", a: "x = 14 (Add 4 to both sides)." }
            ],
            'Geometry & Shapes': [
                { q: "What is a ray?", a: "A straight path that starts at one endpoint and extends infinitely in one direction." },
                { q: "What is an obtuse angle?", a: "An angle that measures greater than 90 degrees and less than 180 degrees." },
                { q: "What is the perimeter of a rectangle?", a: "Perimeter = 2 * (length + width)." },
                { q: "What is the area of a square?", a: "Area = side * side (or s^2)." },
                { q: "What is a regular polygon?", a: "A polygon whose sides are all equal in length and whose angles are all equal." }
            ],
            'Factors & Multiples': [
                { q: "What is a prime number?", a: "A number greater than 1 that has exactly two factors: 1 and itself (e.g., 2, 3, 5, 7)." },
                { q: "What is HCF?", a: "Highest Common Factor - the largest factor shared by two or more numbers." },
                { q: "What is LCM?", a: "Least Common Multiple - the smallest positive multiple shared by two or more numbers." },
                { q: "Is 1 a prime or composite number?", a: "Neither. 1 has only one factor (itself), so it cannot be prime or composite." },
                { q: "What is the HCF of 15 and 25?", a: "5 (Factors of 15 are 1, 3, 5, 15; factors of 25 are 1, 5, 25)." }
            ]
        };
        const wrapper = document.createElement('div');
        wrapper.className = 'study-tools-wrapper';

        const masteredKey = 'edu_mastered_cards_' + user.id;
        let masteredCards = JSON.parse(localStorage.getItem(masteredKey)) || { 'Fractions & Decimals': [], 'Integers & Algebra': [], 'Geometry & Shapes': [], 'Factors & Multiples': [] };

        const currentDeck = flashcardDecks[this.selectedDeckSubject];
        const masteredInDeck = masteredCards[this.selectedDeckSubject] || [];

        // Ensure index does not overshoot
        if (this.currentCardIdx >= currentDeck.length) {
            this.currentCardIdx = 0;
        }

        const activeCard = currentDeck[this.currentCardIdx];
        const isCurrentCardMastered = masteredInDeck.includes(this.currentCardIdx);

        // Flashcards column html
        const flashcardsHtml = `
            <div style="flex: 1; display:flex; flex-direction:column; gap:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="font-size: 18px; font-family: var(--font-heading);">Study Flashcards 🗂️</h3>
                    <span style="font-size: 12px; font-weight:700; color: #10b981; background: rgba(16, 185, 129, 0.1); padding: 4px 10px; border-radius: 12px;">
                        Mastered: ${masteredInDeck.length}/${currentDeck.length}
                    </span>
                </div>
                <p class="text-secondary" style="font-size: 13px;">Memorize formulas, rules, and terms. Get 5 XP for every card mastered!</p>
                
                <!-- Deck subject toggles -->
                <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:4px;">
                    ${['Fractions & Decimals', 'Integers & Algebra', 'Geometry & Shapes', 'Factors & Multiples'].map(subj => {
                        const active = this.selectedDeckSubject === subj ? 'btn-primary' : 'btn-secondary';
                        const label = subj;
                        return `<button class="btn ${active}" style="padding: 6px 12px; font-size:11px; border-radius:var(--radius-full);" data-subject="${subj}">${label}</button>`;
                    }).join('')}
                </div>

                <!-- Flashcard flip viewport -->
                <div class="flashcard-container" id="flashcard-viewport" style="perspective: 1000px; width: 100%; height: 200px; cursor: pointer; margin-top: 10px;">
                    <div class="flashcard-inner ${this.isFlipped ? 'flipped' : ''}" id="flashcard-inner" style="position: relative; width: 100%; height: 100%; text-align: center; transition: transform 0.6s; transform-style: preserve-3d; border-radius: var(--radius-md);">
                        <!-- Front -->
                        <div class="flashcard-front" style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; background-color: var(--primary-light); color: var(--text-primary); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; border-radius: var(--radius-md); border: 2px dashed var(--primary); box-shadow: var(--shadow-sm);">
                            <span style="font-size: 10px; text-transform: uppercase; color: var(--primary); font-weight: 800; letter-spacing: 1px; margin-bottom: 8px;">QUESTION</span>
                            <h4 style="font-size: 16px; font-weight: 700; max-height: 100px; overflow-y:auto; line-height:1.5;">${activeCard.q}</h4>
                            <span style="font-size: 10px; color: var(--text-muted); margin-top: 16px;">🔄 Click to Reveal Answer</span>
                        </div>
                        <!-- Back -->
                        <div class="flashcard-back" style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; background-color: var(--primary); color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; border-radius: var(--radius-md); transform: rotateY(180deg); box-shadow: var(--shadow-md);">
                            <span style="font-size: 10px; text-transform: uppercase; color: rgba(255,255,255,0.7); font-weight: 800; letter-spacing: 1px; margin-bottom: 8px;">ANSWER</span>
                            <h4 style="font-size: 16px; font-weight: 700; max-height: 100px; overflow-y:auto; line-height:1.5;">${activeCard.a}</h4>
                            <span style="font-size: 10px; color: rgba(255,255,255,0.7); margin-top: 16px;">🔄 Click to Flip Back</span>
                        </div>
                    </div>
                </div>

                <!-- Navigation and Mastery buttons -->
                <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-top:8px;">
                    <button class="btn btn-secondary" id="fc-prev-btn" style="padding: 6px 12px; font-size:12px;" ${this.currentCardIdx === 0 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>&larr; Prev</button>
                    <span style="font-size:12px; font-family:monospace;">Card ${this.currentCardIdx + 1} of ${currentDeck.length}</span>
                    <button class="btn btn-secondary" id="fc-next-btn" style="padding: 6px 12px; font-size:12px;" ${this.currentCardIdx === currentDeck.length - 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>Next &rarr;</button>
                </div>

                <div style="display: flex; gap: 12px; margin-top: 12px;">
                    <button class="btn btn-secondary" id="fc-review-action-btn" style="flex: 1; padding: 10px; font-size:12px; border-color: rgba(244,63,94,0.3); color:#f43f5e; background-color: rgba(244,63,94,0.03);" ${!isCurrentCardMastered ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                        Reset / Mark Review 🔁
                    </button>
                    <button class="btn btn-primary" id="fc-master-action-btn" style="flex: 1.5; padding: 10px; font-size:12px; background-color: #10b981; border:none;" ${isCurrentCardMastered ? 'disabled style="opacity:0.5; cursor:not-allowed; background-color:#a7f3d0;"' : ''}>
                        ${isCurrentCardMastered ? '✓ Mastered' : 'Mark as Mastered! +5 XP'}
                    </button>
                </div>
            </div>
        `;

        wrapper.innerHTML = `
            <div class="study-tools-container" style="max-width: 600px; margin: 20px auto 0 auto;">
                ${flashcardsHtml}
            </div>
        `;

        // Bind events
        const deckSubjectButtons = wrapper.querySelectorAll('[data-subject]');
        deckSubjectButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectedDeckSubject = btn.getAttribute('data-subject');
                this.currentCardIdx = 0;
                this.isFlipped = false;
                EduApp.router.updateWorkspace();
            });
        });

        const cardViewport = wrapper.querySelector('#flashcard-viewport');
        cardViewport.addEventListener('click', () => {
            this.isFlipped = !this.isFlipped;
            const inner = wrapper.querySelector('#flashcard-inner');
            if (inner) {
                if (this.isFlipped) {
                    inner.classList.add('flipped');
                } else {
                    inner.classList.remove('flipped');
                }
            }
        });

        const prevBtn = wrapper.querySelector('#fc-prev-btn');
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.currentCardIdx > 0) {
                    this.currentCardIdx--;
                    this.isFlipped = false;
                    EduApp.router.updateWorkspace();
                }
            });
        }

        const nextBtn = wrapper.querySelector('#fc-next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.currentCardIdx < currentDeck.length - 1) {
                    this.currentCardIdx++;
                    this.isFlipped = false;
                    EduApp.router.updateWorkspace();
                }
            });
        }

        const masterBtn = wrapper.querySelector('#fc-master-action-btn');
        if (masterBtn) {
            masterBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!isCurrentCardMastered) {
                    masteredCards[this.selectedDeckSubject] = masteredCards[this.selectedDeckSubject] || [];
                    masteredCards[this.selectedDeckSubject].push(this.currentCardIdx);
                    localStorage.setItem(masteredKey, JSON.stringify(masteredCards));
                    
                    EduApp.db.awardXP(user.id, 5, `Mastered ${this.selectedDeckSubject} Flashcard #${this.currentCardIdx + 1}`);
                    
                    const updatedMastered = masteredCards[this.selectedDeckSubject];
                    if (updatedMastered.length === currentDeck.length) {
                        EduApp.db.awardXP(user.id, 50, `Completed Entire ${this.selectedDeckSubject} Flashcard Deck!`);
                        EduApp.db.awardBadge(user.id, 'Scholar');
                    }
                    
                    EduApp.router.updateWorkspace();
                }
            });
        }

        const reviewBtn = wrapper.querySelector('#fc-review-action-btn');
        if (reviewBtn) {
            reviewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (isCurrentCardMastered) {
                    masteredCards[this.selectedDeckSubject] = masteredCards[this.selectedDeckSubject].filter(idx => idx !== this.currentCardIdx);
                    localStorage.setItem(masteredKey, JSON.stringify(masteredCards));
                    EduApp.toast.show('Card marked for review.');
                    EduApp.router.updateWorkspace();
                }
            });
        }
        return wrapper;
    }
};

