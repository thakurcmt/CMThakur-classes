window.EduApp = window.EduApp || {};

EduApp.TeacherStudentActivity = {
    // Current active sub-tab inside Student Activity
    activeTab: 'homework', // 'homework', 'attendance', 'performance', 'access'

    // Load student users from database
    syncStudents() {
        const users = EduApp.db.getUsers();
        return users.filter(u => u.role === 'student');
    },

    // Retrieve attendance history logs
    getAttendanceData() {
        const localHistory = localStorage.getItem('edu_teacher_attendance_history');
        const todayStatus = localStorage.getItem('edu_teacher_attendance_today');
        
        let history = localHistory ? JSON.parse(localHistory) : [];
        
        // If server backend sync has stored records in edu_platform_attendance, prioritize it
        const syncedAttendanceStr = localStorage.getItem('edu_platform_attendance');
        if (syncedAttendanceStr) {
            try {
                const synced = JSON.parse(syncedAttendanceStr);
                if (synced && Array.isArray(synced.history)) {
                    history = synced.history.map(h => {
                        const presentRecords = h.records.filter(r => r.status === 'present');
                        const presentNames = presentRecords.map(r => r.name || r.studentName || 'Student').map(n => n.split(' ')[0]).join(', ');
                        
                        // Parse date for cleaner presentation if it's ISO format
                        let displayDate = h.date;
                        const parsedDate = new Date(h.date);
                        if (!isNaN(parsedDate.getTime())) {
                            displayDate = parsedDate.toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });
                        }
                        
                        return {
                            date: displayDate,
                            presentCount: presentRecords.length,
                            totalCount: h.records.length,
                            presentNames: presentNames || 'None'
                        };
                    });
                }
            } catch (e) {
                console.error("Error parsing synced attendance data:", e);
            }
        }

        return {
            history: history,
            today: todayStatus ? JSON.parse(todayStatus) : {}
        };
    },

    render() {
        const container = document.createElement('div');
        container.className = 'student-activity-wrapper';

        const students = this.syncStudents();

        // 1. Render layout html structure (tab switcher and viewport)
        container.innerHTML = `
            <div style="margin-bottom: 24px;">
                <h1 style="font-size: 24px; font-family: var(--font-heading); margin-bottom: 8px;">Student Progress & Class Activity</h1>
                <p class="text-secondary" style="font-size: 14px;">Monitor homework submissions, track attendance, view assessment metrics, and configure course material access permissions.</p>
            </div>

            <!-- Page Sub-tab Switcher -->
            <div class="page-tabs" style="margin-bottom: 20px;">
                <div class="page-tab ${this.activeTab === 'homework' ? 'active' : ''}" id="act-tab-homework">Homework Grading</div>
                <div class="page-tab ${this.activeTab === 'attendance' ? 'active' : ''}" id="act-tab-attendance">Attendance Records</div>
                <div class="page-tab ${this.activeTab === 'performance' ? 'active' : ''}" id="act-tab-performance">Assessment Metrics</div>
                <div class="page-tab ${this.activeTab === 'access' ? 'active' : ''}" id="act-tab-access">Access Management</div>
            </div>

            <!-- Subview content viewport -->
            <div id="activity-tab-viewport" style="background-color: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm);"></div>
        `;

        const viewport = container.querySelector('#activity-tab-viewport');

        // Render subview based on activeTab
        if (this.activeTab === 'homework') {
            viewport.appendChild(this.renderHomeworkTab(students));
        } else if (this.activeTab === 'attendance') {
            viewport.appendChild(this.renderAttendanceTab(students));
        } else if (this.activeTab === 'performance') {
            viewport.appendChild(this.renderPerformanceTab(students));
        } else if (this.activeTab === 'access') {
            viewport.appendChild(this.renderAccessTab(students));
        }

        // Tab selection events
        container.querySelector('#act-tab-homework').addEventListener('click', () => {
            this.activeTab = 'homework';
            EduApp.router.updateWorkspace();
        });
        container.querySelector('#act-tab-attendance').addEventListener('click', () => {
            this.activeTab = 'attendance';
            EduApp.router.updateWorkspace();
        });
        container.querySelector('#act-tab-performance').addEventListener('click', () => {
            this.activeTab = 'performance';
            EduApp.router.updateWorkspace();
        });
        container.querySelector('#act-tab-access').addEventListener('click', () => {
            this.activeTab = 'access';
            EduApp.router.updateWorkspace();
        });

        return container;
    },

    // 1. Homework Tracking Tab
    renderHomeworkTab(students) {
        const div = document.createElement('div');
        const homeworkList = EduApp.db.getHomework();

        let rowsHtml = '';
        
        // Revoke any active row blobs to prevent leaks
        this.revokeRowBlobs();

        const displayList = [];
        if (homeworkList.length === 0) {
            rowsHtml = `<tr><td colspan="5" style="text-align:center; padding: 24px; color:var(--text-secondary);">No homework assignments in database.</td></tr>`;
        } else {
            // Find all unique homework assignments from database
            const uniqueAssignmentsMap = new Map();
            homeworkList.forEach(hw => {
                if (!uniqueAssignmentsMap.has(hw.title)) {
                    uniqueAssignmentsMap.set(hw.title, {
                        title: hw.title,
                        subject: hw.subject
                    });
                }
            });

            // Construct list containing every student for every unique assignment
            let virtualIdCounter = 1;
            uniqueAssignmentsMap.forEach((meta, title) => {
                students.forEach(st => {
                    const existing = homeworkList.find(hw => hw.studentId === st.id && hw.title === title);
                    if (existing) {
                        displayList.push(existing);
                    } else {
                        displayList.push({
                            id: `hw_virtual_${virtualIdCounter++}`,
                            studentId: st.id,
                            studentName: st.name,
                            name: st.name,
                            title: title,
                            subject: meta.subject,
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
            });

            displayList.forEach(hw => {
                const st = students.find(s => s.id === hw.studentId) || {
                    name: hw.studentName || 'Student',
                    email: 'student@edu.com',
                    avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(hw.studentName || 'Student')}`
                };

                const gradeDisplay = hw.status === 'graded' ? `<span style="color:var(--primary); font-weight:700;">${hw.grade} (${hw.score}%)</span>` : '<span style="color: var(--text-muted);">Unmarked</span>';
                
                let statusStyle = 'background-color: #f1f5f9; color: #475569;';
                let actionBtnHtml = '';
                let statusText = hw.status;

                if (hw.status === 'graded') {
                    statusStyle = 'background-color: #DEF7EC; color: #03543F;';
                    actionBtnHtml = `<button class="btn btn-secondary" style="padding: 6px 12px; font-size: 11px;" id="btn-grade-${hw.id}">Re-grade</button>`;
                } else if (hw.status === 'submitted') {
                    statusStyle = 'background-color: #E1EFFE; color: #1E429F;';
                    actionBtnHtml = `<button class="btn btn-primary" style="padding: 6px 12px; font-size: 11px;" id="btn-grade-${hw.id}">Grade File</button>`;
                } else { // pending
                    statusStyle = 'background-color: #FDE8E8; color: #9B1C1C;';
                    statusText = 'homework not submitted';
                    actionBtnHtml = `<button class="btn btn-secondary" style="padding: 6px 12px; font-size: 11px; opacity:0.5; cursor:not-allowed;" disabled>Unsubmitted</button>`;
                }

                let fileDetailsHtml = '';
                if (hw.fileName) {
                    fileDetailsHtml = `
                        <div style="font-size:11px; margin-top:2px; display:flex; align-items:center; gap:4px;">
                            <span style="color:var(--text-muted);">File:</span>
                            <a href="#" style="color:var(--primary); font-weight:600; text-decoration:underline; display:inline-flex; align-items:center; gap:2px;" id="view-file-link-${hw.id}">
                                📄 ${hw.fileName} (${hw.fileSize})
                            </a>
                        </div>
                    `;
                }

                rowsHtml += `
                    <tr style="border-bottom: 1px solid var(--border);">
                        <td style="padding: 12px; display: flex; align-items: center; gap: 10px;">
                            ${EduApp.getAvatarHtml(st.name, 'width:32px; height:32px; font-size:14px; border: 1px solid var(--border);')}
                            <div>
                                <div style="font-weight:600; font-size:14px;">${st.name}</div>
                                <div style="font-size:11px; color: var(--text-muted);">${st.email}</div>
                            </div>
                        </td>
                        <td style="padding: 12px; font-size: 13px;">
                            <div><strong>${hw.title}</strong></div>
                            ${fileDetailsHtml}
                        </td>
                        <td style="padding: 12px;">
                            <span style="font-size: 11px; padding: 4px 8px; border-radius: 12px; font-weight:600; text-transform: capitalize; ${statusStyle}">${statusText}</span>
                        </td>
                        <td style="padding: 12px; font-size: 13px;">
                            ${gradeDisplay}
                        </td>
                        <td style="padding: 12px; text-align: right;">
                            ${actionBtnHtml}
                        </td>
                    </tr>
                `;
            });
        }

        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="font-size: 18px; margin: 0;">Homework Grade Submissions</h3>
                <button class="btn btn-primary" id="btn-create-assignment" style="padding: 8px 16px; font-size: 12px; font-weight: 700; border-radius: var(--radius-sm);">
                    + Create Assignment
                </button>
            </div>
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--border); color: var(--text-secondary); font-size: 12px; text-transform: uppercase;">
                        <th style="padding: 12px;">Student</th>
                        <th style="padding: 12px;">Assignment Title / File</th>
                        <th style="padding: 12px;">Status</th>
                        <th style="padding: 12px;">Grade Score</th>
                        <th style="padding: 12px; text-align: right;">Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        `;

        // Bind Create Assignment action
        const createBtn = div.querySelector('#btn-create-assignment');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                const title = prompt("Enter homework assignment title (e.g. Fractions Worksheet 1):");
                if (!title || !title.trim()) return;
                
                const subject = prompt("Enter assignment subject:", "Mathematics");
                if (!subject || !subject.trim()) return;
                
                EduApp.db.createHomeworkAssignment(title.trim(), subject.trim());
                EduApp.toast.show(`New assignment "${title.trim()}" assigned to all students.`);
                EduApp.router.updateWorkspace();
            });
        }

        // Bind grading action triggers natively
        displayList.forEach(hw => {
            if (hw.fileName) {
                const fileLink = div.querySelector(`#view-file-link-${hw.id}`);
                if (fileLink) {
                    fileLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.launchHomeworkViewer(hw);
                    });
                }
            }

            if (hw.status === 'submitted' || hw.status === 'graded') {
                const btn = div.querySelector(`#btn-grade-${hw.id}`);
                if (btn) {
                    btn.addEventListener('click', () => {
                        const newGrade = prompt(`Enter numeric grade (0-100) for ${hw.studentName || hw.name}'s ${hw.title}:`);
                        if (newGrade !== null) {
                            const gradeVal = parseInt(newGrade);
                            if (isNaN(gradeVal) || gradeVal < 0 || gradeVal > 100) {
                                EduApp.toast.show('Please enter a valid number between 0 and 100.');
                                return;
                            }

                            const feedbackText = prompt(`Enter feedback comment for ${hw.studentName || hw.name}:`, hw.feedback || "Good work!");
                            if (feedbackText === null) return;

                            // Calculate Letter Grade
                            let letterGrade = 'F';
                            if (gradeVal >= 90) letterGrade = 'A';
                            else if (gradeVal >= 80) letterGrade = 'B';
                            else if (gradeVal >= 70) letterGrade = 'C';
                            else if (gradeVal >= 60) letterGrade = 'D';

                            // Save directly to database
                            const homeworks = EduApp.db.getHomework();
                            const idx = homeworks.findIndex(h => h.id === hw.id);
                            if (idx !== -1) {
                                homeworks[idx].status = 'graded';
                                homeworks[idx].score = gradeVal;
                                homeworks[idx].grade = letterGrade;
                                homeworks[idx].feedback = feedbackText;
                                localStorage.setItem(EduApp.db.KEYS.HOMEWORK, JSON.stringify(homeworks));
                                
                                EduApp.toast.show(`Grade ${letterGrade} (${gradeVal}%) saved for ${hw.studentName || hw.name}`);
                                
                                // Re-render
                                EduApp.router.updateWorkspace();
                            }
                        }
                    });
                }
            }
        });

        return div;
    },

    // 2. Attendance Records Tab
    renderAttendanceTab(students) {
        const div = document.createElement('div');
        const { history, today } = this.getAttendanceData();

        // 1. Checklist
        let checklistHtml = '';
        if (students.length === 0) {
            checklistHtml = `<p class="text-secondary" style="padding: 24px 0; font-size:13px; text-align:center;">No students enrolled yet.</p>`;
        } else {
            students.forEach(st => {
                const record = today[st.id];
                const isPresent = record !== undefined ? (typeof record === 'object' ? record.present : record) !== false : true;
                const stayTime = (record && typeof record === 'object') ? (record.stayTimeStr || '0 secs') : '0 secs';
                
                checklistHtml += `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); background-color: var(--bg-main);">
                        <div style="display:flex; align-items:center; gap:10px;">
                            ${EduApp.getAvatarHtml(st.name, 'width:32px; height:32px; font-size:14px; border: 1px solid var(--border);')}
                            <div>
                                <div style="font-weight: 600; font-size:14px;">${st.name}</div>
                                <div style="font-size:11px; color: var(--text-muted); margin-top:2px;">Stay Time: <strong style="color:var(--primary);">${stayTime}</strong></div>
                            </div>
                        </div>
                        <label class="switch" style="position: relative; display: inline-block; width: 44px; height: 22px;">
                            <input type="checkbox" id="attend-check-${st.id}" ${isPresent ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
                            <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px;"></span>
                        </label>
                    </div>
                `;
            });
        }

        // 2. History logs
        let historyRows = '';
        if (history.length === 0) {
            historyRows = `<tr><td colspan="3" style="text-align:center; padding:15px; color:var(--text-secondary); font-size:13px;">No attendance history logged.</td></tr>`;
        } else {
            history.forEach(h => {
                historyRows += `
                    <tr style="border-bottom:1px solid var(--border); font-size:13px;">
                        <td style="padding: 10px; font-weight:600;">${h.date}</td>
                        <td style="padding: 10px;">${h.presentCount} / ${h.totalCount} Present</td>
                        <td style="padding: 10px; color: var(--text-secondary); max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                            ${h.presentNames}
                        </td>
                    </tr>
                `;
            });
        }

        div.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 32px;">
                <!-- Attendance Checklist -->
                <div>
                    <h3 style="font-size:16px; margin-bottom: 12px; font-family: var(--font-heading);">Mark Today's Attendance</h3>
                    <p class="text-secondary" style="font-size:12px; margin-bottom:16px;">Toggles show green for Present, grey for Absent.</p>
                    
                    <div style="display:flex; flex-direction:column; gap:8px; margin-bottom: 20px;">
                        ${checklistHtml}
                    </div>

                    <button class="btn btn-primary" id="btn-save-attendance" style="width:100%;" ${students.length === 0 ? 'disabled' : ''}>Save Today's Records</button>
                </div>

                <!-- History log -->
                <div>
                    <h3 style="font-size:16px; margin-bottom: 16px; font-family: var(--font-heading);">Attendance History Log</h3>
                    
                    <table style="width:100%; border-collapse:collapse; text-align:left;">
                        <thead>
                            <tr style="border-bottom: 2px solid var(--border); color: var(--text-secondary); font-size: 11px; text-transform: uppercase;">
                                <th style="padding: 10px;">Date</th>
                                <th style="padding: 10px;">Status Ratio</th>
                                <th style="padding: 10px;">Attendees</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${historyRows}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Custom CSS for toggle switch -->
            <style>
                .switch input:checked + .slider {
                    background-color: #10b981 !important;
                }
                .switch .slider:before {
                    position: absolute;
                    content: "";
                    height: 14px;
                    width: 14px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }
                .switch input:checked + .slider:before {
                    transform: translateX(22px);
                }
            </style>
        `;

        // Bind Save Attendance action
        const saveAttendBtn = div.querySelector('#btn-save-attendance');
        if (saveAttendBtn && students.length > 0) {
            saveAttendBtn.addEventListener('click', () => {
                const todaySheetObj = {};
                const todaySheetArr = [];
                let presentCount = 0;
                const presentNamesArr = [];

                students.forEach(st => {
                    const check = div.querySelector(`#attend-check-${st.id}`);
                    const isPresent = check ? check.checked : true;
                    
                    // Maintain previous stayTime if exists
                    const existingRecord = today[st.id];
                    const stayTimeStr = (existingRecord && typeof existingRecord === 'object') ? existingRecord.stayTimeStr : '0 secs';
                    
                    todaySheetObj[st.id] = {
                        present: isPresent,
                        stayTimeStr: stayTimeStr
                    };

                    todaySheetArr.push({
                        studentId: st.id,
                        studentName: st.name,
                        name: st.name,
                        status: isPresent ? 'present' : 'absent'
                    });

                    if (isPresent) {
                        presentCount++;
                        presentNamesArr.push(st.name.split(' ')[0]);
                    }
                });

                localStorage.setItem('edu_teacher_attendance_today', JSON.stringify(todaySheetObj));

                // Append to history log
                const dateStr = new Date().toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });
                const attendeeNames = presentNamesArr.length > 0 ? presentNamesArr.join(', ') : 'None';
                
                const newHistoryRecord = {
                    date: dateStr,
                    presentCount: presentCount,
                    totalCount: students.length,
                    presentNames: attendeeNames
                };

                const updatedHistory = [newHistoryRecord, ...history];
                localStorage.setItem('edu_teacher_attendance_history', JSON.stringify(updatedHistory));

                // Sync with server
                if (typeof EduApp.db.saveAttendance === 'function') {
                    EduApp.db.saveAttendance(todaySheetArr);
                }

                EduApp.toast.show(`Today's attendance saved (${presentCount}/${students.length} present).`);
                EduApp.router.updateWorkspace();
            });
        }

        return div;
    },

    // 3. Performance Metrics (Rankings) Tab
    renderPerformanceTab(students) {
        const div = document.createElement('div');
        const tests = EduApp.db.getTests();

        if (tests.length === 0) {
            div.innerHTML = `
                <h3 style="font-size: 18px; margin-bottom: 12px; font-family: var(--font-heading);">Assessment Metrics</h3>
                <div style="text-align:center; padding: 40px; color: var(--text-muted); font-size:14px; border:1px dashed var(--border); border-radius:var(--radius-lg);">
                    No tests or assessments drafted yet. Draft a test under Home tab to see metrics.
                </div>
            `;
            return div;
        }

        // Generate test options dropdown html
        const testOptionsHtml = tests.map(t => `<option value="${t.id}">${t.title}</option>`).join('');

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px; flex-wrap:wrap; gap:12px;">
                <div>
                    <h3 style="font-size: 18px; margin: 0; font-family: var(--font-heading);">Assessment Metrics & Ranks</h3>
                    <p class="text-secondary" style="font-size: 12px; margin-top:2px;">Select an assessment to view student grades and rank listings.</p>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <label style="font-size:12px; font-weight:700;" for="metrics-test-select">Select Test:</label>
                    <select id="metrics-test-select" class="form-input" style="padding: 6px 12px; font-size:13px; width:220px; margin-bottom: 0;">
                        ${testOptionsHtml}
                    </select>
                </div>
            </div>

            <!-- Rankings Container -->
            <div id="rankings-viewport"></div>
        `;

        const rankingsViewport = div.querySelector('#rankings-viewport');

        const drawRankings = (testId) => {
            rankingsViewport.innerHTML = '';
            
            const selectedTest = tests.find(t => t.id === testId);
            if (!selectedTest) return;

            if (students.length === 0) {
                rankingsViewport.innerHTML = `<p class="text-secondary" style="text-align:center; padding:20px; font-size:13px;">No students enrolled yet.</p>`;
                return;
            }

            // Map students and display their score
            const studentsWithScores = students.map(st => {
                const studentScores = st.testScores || {};
                const scoreRecord = studentScores[testId];
                
                return {
                    student: st,
                    score: scoreRecord ? scoreRecord.score : 0,
                    submitted: !!scoreRecord
                };
            });

            // Sort descending by score
            studentsWithScores.sort((a, b) => b.score - a.score);

            let rankList = '';
            studentsWithScores.forEach((item, index) => {
                const rankNum = index + 1;
                let rankBadge = `<span style="font-family:monospace; font-weight:800; font-size:13px; width:22px; height:22px; border-radius:50%; display:flex; justify-content:center; align-items:center; background-color: #f1f5f9; color: var(--text-secondary);">${rankNum}</span>`;
                
                if (rankNum === 1) {
                    rankBadge = `<span style="font-weight:800; font-size:13px; width:22px; height:22px; border-radius:50%; display:flex; justify-content:center; align-items:center; background-color: #fef3c7; color: #b45309; border: 1px solid #f59e0b;">🥇</span>`;
                } else if (rankNum === 2) {
                    rankBadge = `<span style="font-weight:800; font-size:13px; width:22px; height:22px; border-radius:50%; display:flex; justify-content:center; align-items:center; background-color: #e2e8f0; color: #475569; border: 1px solid #94a3b8;">🥈</span>`;
                } else if (rankNum === 3) {
                    rankBadge = `<span style="font-weight:800; font-size:13px; width:22px; height:22px; border-radius:50%; display:flex; justify-content:center; align-items:center; background-color: #ffedd5; color: #c2410c; border: 1px solid #f97316;">🥉</span>`;
                }

                const scoreText = item.submitted ? `<strong style="color:var(--primary); font-size:15px;">${item.score}%</strong>` : `<span style="color:var(--text-muted); font-size:12px; font-style:italic;">Pending</span>`;

                rankList += `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-bottom:1px solid var(--border);">
                        <div style="display:flex; align-items:center; gap:12px;">
                            ${rankBadge}
                            ${EduApp.getAvatarHtml(item.student.name, 'width:36px; height:36px; font-size:16px; border:1px solid var(--border);')}
                            <div>
                                <div style="font-weight:600; font-size:14px;">${item.student.name}</div>
                                <div style="font-size:11px; color:var(--text-secondary);">${item.student.email}</div>
                            </div>
                        </div>
                        <div>
                            ${scoreText}
                        </div>
                    </div>
                `;
            });

            rankingsViewport.innerHTML = `
                <div style="border:1px solid var(--border); border-radius:var(--radius-md); background-color:var(--bg-main); overflow:hidden;">
                    <div style="display:flex; justify-content:space-between; align-items:center; background-color:var(--primary-light); padding:12px 20px; border-bottom:1px solid var(--border); font-weight:700; font-size:13px; color:var(--primary);">
                        <span>Student Ranking</span>
                        <span>Assessment Score</span>
                    </div>
                    <div style="display:flex; flex-direction:column;">
                        ${rankList}
                    </div>
                </div>
            `;
        };

        const testSelect = div.querySelector('#metrics-test-select');
        testSelect.addEventListener('change', (e) => {
            drawRankings(e.target.value);
        });

        // Initialize first test rankings
        drawRankings(tests[0].id);

        return div;
    },

    // 4. Access Management Tab (Matrix table)
    renderAccessTab(students) {
        const div = document.createElement('div');
        const documentSets = EduApp.db.getDocumentSets();

        if (documentSets.length === 0) {
            div.innerHTML = `
                <h3 style="font-size: 18px; margin-bottom: 12px; font-family: var(--font-heading);">Access Control Management</h3>
                <div style="text-align:center; padding: 40px; color: var(--text-muted); font-size:14px; border:1px dashed var(--border); border-radius:var(--radius-lg);">
                    No document sets found in database.
                </div>
            `;
            return div;
        }

        if (students.length === 0) {
            div.innerHTML = `
                <h3 style="font-size: 18px; margin-bottom: 12px; font-family: var(--font-heading);">Access Control Management</h3>
                <div style="text-align:center; padding: 40px; color: var(--text-muted); font-size:14px; border:1px dashed var(--border); border-radius:var(--radius-lg);">
                    No students enrolled yet to configure access permission.
                </div>
            `;
            return div;
        }

        // Premium document sets
        const premiumSets = documentSets.filter(s => s.type === 'premium');

        let headersHtml = '<th style="padding:12px;">Student Name</th>';
        premiumSets.forEach(s => {
            headersHtml += `<th style="padding:12px; font-size:11px; text-align:center; max-width:120px; white-space:normal; line-height:1.3;">${s.title}</th>`;
        });

        let rowsHtml = '';
        students.forEach(st => {
            const purchased = st.purchasedSets || [];
            
            let cellsHtml = `
                <td style="padding:12px; display:flex; align-items:center; gap:8px;">
                    ${EduApp.getAvatarHtml(st.name, 'width:28px; height:28px; font-size:12px;')}
                    <div>
                        <div style="font-weight:600; font-size:13px;">${st.name}</div>
                        <div style="font-size:10px; color:var(--text-muted);">${st.email}</div>
                    </div>
                </td>
            `;

            premiumSets.forEach(s => {
                const isGranted = purchased.includes(s.id);
                cellsHtml += `
                    <td style="padding:12px; text-align:center;">
                        <input type="checkbox" id="matrix-check-${st.id}-${s.id}" ${isGranted ? 'checked' : ''} style="width:16px; height:16px; cursor:pointer;" data-student-id="${st.id}" data-set-id="${s.id}">
                    </td>
                `;
            });

            rowsHtml += `<tr style="border-bottom:1px solid var(--border);">${cellsHtml}</tr>`;
        });

        div.innerHTML = `
            <div style="margin-bottom:16px;">
                <h3 style="font-size: 18px; margin: 0; font-family: var(--font-heading);">Premium Materials Access Matrix</h3>
                <p class="text-secondary" style="font-size: 12px; margin-top:2px;">Check boxes to unlock premium document study packs for students immediately.</p>
            </div>
            
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; text-align:left;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--border); color:var(--text-secondary); font-size:11px; text-transform:uppercase;">
                            ${headersHtml}
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
        `;

        // Bind Checkbox change handlers
        premiumSets.forEach(s => {
            students.forEach(st => {
                const cb = div.querySelector(`#matrix-check-${st.id}-${s.id}`);
                if (cb) {
                    cb.addEventListener('change', (e) => {
                        const checked = e.target.checked;
                        const success = EduApp.db.toggleSetAccess(st.id, s.id, checked);
                        if (success) {
                            EduApp.toast.show(`Access permissions updated for ${st.name}.`);
                        } else {
                            EduApp.toast.show('Failed to update access matrix.');
                            e.target.checked = !checked; // revert
                        }
                    });
                }
            });
        });

        return div;
    },

    // View submitted student homework PDF
    launchHomeworkViewer(hw) {
        const readerBackdrop = document.createElement('div');
        readerBackdrop.className = 'video-modal-backdrop active';
        readerBackdrop.id = 'hw-pdf-reader-overlay';

        // Content template based on assignment title
        const titleLower = hw.title.toLowerCase();
        let virtualPdfContent = '';

        if (titleLower.includes('fraction') || titleLower.includes('decimal')) {
            virtualPdfContent = `
                <div style="padding: 40px; color:#1e293b; line-height:1.6; font-family: 'Outfit', sans-serif;">
                    <div style="text-align:center; border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 24px;">
                        <h1 style="color:#4f46e5; margin:0; font-size:24px;">Fractions & Decimals Homework Submission</h1>
                        <p style="margin:4px 0 0 0; font-size:12px; color:#64748b;">Submitted by: ${hw.studentName || hw.name} &bull; Date: ${hw.submittedAt ? new Date(hw.submittedAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    
                    <h3 style="color:#0f172a; margin-top:0;">Question 1: Which fraction is equivalent to 2/3?</h3>
                    <p style="background-color:#f8fafc; padding:10px 15px; border-left:4px solid #10b981; margin: 4px 0 16px 0;">
                        <strong>Answer:</strong> 6/9. Explanation: Multiply the numerator and denominator by 3 (2*3 / 3*3 = 6/9).
                    </p>

                    <h3>Question 2: Simplify the fraction 12/18 to its lowest terms:</h3>
                    <p style="background-color:#f8fafc; padding:10px 15px; border-left:4px solid #10b981; margin: 4px 0 16px 0;">
                        <strong>Answer:</strong> 2/3. Explanation: The Highest Common Factor (HCF) of 12 and 18 is 6. Divide both by 6 to get 2/3.
                    </p>

                    <h3>Question 3: Convert the fraction 3/5 into a decimal:</h3>
                    <p style="background-color:#f8fafc; padding:10px 15px; border-left:4px solid #10b981; margin: 4px 0 16px 0;">
                        <strong>Answer:</strong> 0.6. Explanation: 3 divided by 5 is 0.6.
                    </p>

                    <h3>Question 4: Convert the improper fraction 7/3 into a mixed number:</h3>
                    <p style="background-color:#f8fafc; padding:10px 15px; border-left:4px solid #10b981; margin: 4px 0 16px 0;">
                        <strong>Answer:</strong> 2 1/3. Explanation: 7 divided by 3 is 2 with a remainder of 1.
                    </p>
                </div>
            `;
        } else if (titleLower.includes('integer') || titleLower.includes('algebra')) {
            virtualPdfContent = `
                <div style="padding: 40px; color:#1e293b; line-height:1.6; font-family: 'Outfit', sans-serif;">
                    <div style="text-align:center; border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 24px;">
                        <h1 style="color:#4f46e5; margin:0; font-size:24px;">Integers Number Line Homework Submission</h1>
                        <p style="margin:4px 0 0 0; font-size:12px; color:#64748b;">Submitted by: ${hw.studentName || hw.name} &bull; Date: ${hw.submittedAt ? new Date(hw.submittedAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    
                    <h3 style="color:#0f172a; margin-top:0;">Question 1: Evaluate (-5) + 8</h3>
                    <p style="background-color:#f8fafc; padding:10px 15px; border-left:4px solid #10b981; margin: 4px 0 16px 0;">
                        <strong>Answer:</strong> 3. Explanation: Starting at -5 on the number line and moving 8 steps to the right lands on 3.
                    </p>

                    <h3>Question 2: Compare -5 and -8</h3>
                    <p style="background-color:#f8fafc; padding:10px 15px; border-left:4px solid #10b981; margin: 4px 0 16px 0;">
                        <strong>Answer:</strong> -5 > -8. Explanation: -5 is to the right of -8 on the number line, so it is larger.
                    </p>

                    <h3>Question 3: Evaluate (-7) - (-12)</h3>
                    <p style="background-color:#f8fafc; padding:10px 15px; border-left:4px solid #10b981; margin: 4px 0 16px 0;">
                        <strong>Answer:</strong> 5. Explanation: Subtracting a negative is the same as adding: (-7) + 12 = 5.
                    </p>
                </div>
            `;
        } else {
            virtualPdfContent = `
                <div style="padding: 40px; color:#1e293b; line-height:1.6; font-family: 'Outfit', sans-serif;">
                    <div style="text-align:center; border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 24px;">
                        <h1 style="color:#4f46e5; margin:0; font-size:24px;">Mathematics General Homework Submission</h1>
                        <p style="margin:4px 0 0 0; font-size:12px; color:#64748b;">Submitted by: ${hw.studentName || hw.name} &bull; Date: ${hw.submittedAt ? new Date(hw.submittedAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    
                    <h3 style="color:#0f172a; margin-top:0;">Assignment: ${hw.title}</h3>
                    <p style="background-color:#f8fafc; padding:10px 15px; border-left:4px solid #10b981; margin: 4px 0 16px 0;">
                        The student has submitted responses to the assignment questions. Please review the grade and provide feedback comments.
                    </p>
                </div>
            `;
        }

        readerBackdrop.innerHTML = `
            <div style="position:fixed; top:5%; left:10%; width:80%; height:90%; background-color:white; border-radius:12px; box-shadow:0 12px 30px rgba(0,0,0,0.4); display:flex; flex-direction:column; overflow:hidden; z-index:2100;">
                <div style="background-color:#0f172a; padding:16px 24px; color:white; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-family: var(--font-heading); font-weight: 700; font-size: 15px;">Homework Submission Viewer</span>
                    <div style="display:flex; align-items:center; gap:16px;">
                        <span>Student: <strong>${hw.studentName || hw.name}</strong> &bull; File: <strong>${hw.fileName}</strong></span>
                        ${hw.fileDataUrl ? `
                            <button class="btn btn-primary" id="download-hw-pdf-btn" style="padding: 4px 10px; font-size:11px; font-weight:700; border-radius:4px; margin-left:8px; border:none; cursor:pointer;">
                                Download PDF File
                            </button>
                        ` : ''}
                        <button class="btn btn-accent" id="close-hw-reader" style="padding: 6px 14px; font-size:13px; font-weight: 700; border-radius: 6px; background-color:#ef4444; border:none; color:white;">
                            Close
                        </button>
                    </div>
                </div>
                <div style="flex:1; background-color:#f1f5f9; overflow-y:auto; display:flex; justify-content:center; padding:20px;">
                    ${hw.fileDataUrl ? `
                        <iframe src="${hw.fileDataUrl}" style="width:100%; max-width:1000px; height:100%; border:none; border-radius:8px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);" type="application/pdf"></iframe>
                    ` : `
                        <div style="width:100%; max-width:850px; background-color:white; border-radius:8px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); overflow:hidden; min-height:100%;">
                            ${virtualPdfContent}
                        </div>
                    `}
                </div>
            </div>
        `;

        document.body.appendChild(readerBackdrop);

        if (hw.fileDataUrl) {
            const dlBtn = readerBackdrop.querySelector('#download-hw-pdf-btn');
            if (dlBtn) {
                dlBtn.addEventListener('click', () => {
                    const a = document.createElement('a');
                    a.href = hw.fileDataUrl;
                    a.download = hw.fileName || 'submission.pdf';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                });
            }
        }

        const closeViewer = () => {
            readerBackdrop.remove();
        };

        readerBackdrop.querySelector('#close-hw-reader').addEventListener('click', closeViewer);
    },

    rowBlobUrls: [],
    revokeRowBlobs() {
        if (this.rowBlobUrls) {
            this.rowBlobUrls.forEach(url => {
                try {
                    URL.revokeObjectURL(url);
                } catch (e) {
                    console.error("Error revoking blob URL:", e);
                }
            });
            this.rowBlobUrls = [];
        }
    }
};
