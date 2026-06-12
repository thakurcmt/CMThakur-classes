window.EduApp = window.EduApp || {};

EduApp.TeacherHome = {
    render() {
        const wrapper = document.createElement('div');
        wrapper.className = 'teacher-home-wrapper';

        const user = EduApp.db.getCurrentUser() || { name: 'Dr. Clara Oswald' };
        const classes = EduApp.db.getClasses();
        const requests = EduApp.db.getJoinRequests();
        const pendingRequests = requests.filter(r => r.teacherName === user.name && r.status === 'pending');
        const now = new Date();

        // 1. Upcoming Class Banner (Check if a class taught by this teacher starts within 1 hour)
        const activeClass = classes.find(cls => {
            if (cls.instructor !== user.name) return false;
            const classTime = new Date(cls.time);
            const diffMs = classTime - now;
            // Class starting in the next 60 minutes or started in the last 60 minutes
            return diffMs > -60 * 60 * 1000 && diffMs <= 60 * 60 * 1000;
        });

        let bannerHtml = '';
        if (activeClass) {
            bannerHtml = `
                <div class="join-class-banner" id="host-class-banner" style="background: linear-gradient(135deg, var(--primary), #6366f1);">
                    <div class="banner-content">
                        <span class="banner-label">Your Live Batch is Scheduled</span>
                        <h2 class="banner-title">${activeClass.title}</h2>
                        <div class="banner-detail">
                            <span>Subject: <strong>${activeClass.subject}</strong></span> &bull; 
                            <span>Duration: <strong>${activeClass.duration}</strong></span>
                        </div>
                    </div>
                    <button class="btn btn-accent" id="start-class-btn" style="box-shadow: 0 4px 14px 0 rgba(244, 63, 94, 0.4);">Start Class</button>
                </div>
            `;
        } else {
            bannerHtml = `
                <div class="join-class-banner" style="background: linear-gradient(135deg, #1e293b, #0f172a); box-shadow: none;">
                    <div class="banner-content">
                        <span class="banner-label" style="color: var(--text-muted);">No Live Classes Right Now</span>
                        <h2 class="banner-title" style="font-size: 18px;">Ready to host your next session?</h2>
                        <div class="banner-detail" style="color: var(--text-muted);">
                            Create a new batch or schedule classes using the Quick Actions below.
                        </div>
                    </div>
                </div>
            `;
        }

        // 2. Taught Batches
        const taughtClasses = classes.filter(cls => cls.instructor === user.name);
        let classesHtml = '';
        if (taughtClasses.length > 0) {
            taughtClasses.forEach(cls => {
                classesHtml += `
                    <div class="class-card">
                        <div class="class-image" style="background-image: linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.4)), url('${cls.image}')">
                            <span class="class-subject-tag">${cls.subject}</span>
                        </div>
                        <div class="class-info" style="padding: 16px; flex: 1; display: flex; flex-direction: column;">
                            <h3 class="class-title" style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">${cls.title}</h3>
                            <div class="class-details" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; font-size: 12px; color: var(--text-secondary);">
                                <div class="class-detail-item" style="display: flex; align-items: center; gap: 6px;">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                    <span>Time: ${cls.displayTime}</span>
                                </div>
                                <div class="class-detail-item" style="display: flex; align-items: center; gap: 6px;">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                                    <span>Duration: ${cls.duration}</span>
                                </div>
                                <div class="class-detail-item" style="display: flex; align-items: center; gap: 6px;">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                    <span>Batch ID: <strong style="font-family: monospace; background-color: var(--bg-main); padding: 2px 6px; border-radius: 4px; cursor: pointer; color: var(--primary);" onclick="navigator.clipboard.writeText('${cls.id}'); EduApp.toast.show('Copied Batch ID: ${cls.id}')" title="Click to copy">${cls.id}</strong></span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px; margin-top: auto; width: 100%;">
                                <button class="btn btn-secondary" style="flex: 1; padding: 8px; font-size: 11px;" id="btn-syllabus-${cls.id}">
                                    Syllabus
                                </button>
                                <button class="btn btn-secondary" style="flex: 1.2; padding: 8px; font-size: 11px; border-color: var(--primary); color: var(--primary);" id="btn-students-${cls.id}">
                                    Students
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            classesHtml = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; border: 1px dashed var(--border); border-radius: var(--radius-lg); background-color: var(--bg-surface);">
                    <p class="text-secondary" style="font-size: 14px;">You are not currently teaching any active batches. Use "Create New Batch" to get started.</p>
                </div>
            `;
        }

        // 3. Pending Enrollment Requests
        let requestsHtml = '';
        if (pendingRequests.length === 0) {
            requestsHtml = `
                <div style="text-align: center; padding: 24px; border: 1px dashed var(--border); border-radius: var(--radius-lg); background-color: var(--bg-surface);">
                    <p class="text-secondary" style="font-size: 14px; margin: 0;">No pending enrollment requests.</p>
                </div>
            `;
        } else {
            requestsHtml = `
                <div style="overflow-x: auto; background-color: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 16px;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left; min-width: 600px;">
                        <thead>
                            <tr style="border-bottom: 2px solid var(--border); color: var(--text-secondary); font-size: 11px; text-transform: uppercase;">
                                <th style="padding: 12px 10px;">Student</th>
                                <th style="padding: 12px 10px;">Batch Name</th>
                                <th style="padding: 12px 10px;">Requested Date</th>
                                <th style="padding: 12px 10px; text-align: right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            pendingRequests.forEach(req => {
                const dateStr = new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });
                requestsHtml += `
                            <tr style="border-bottom: 1px solid var(--border); font-size: 13px;">
                                <td style="padding: 12px 10px; display: flex; align-items: center; gap: 8px;">
                                    ${EduApp.getAvatarHtml(req.studentName, 'width: 28px; height: 28px; font-size: 12px; border: 1px solid var(--border);')}
                                    <div>
                                        <div style="font-weight: 600;">${req.studentName}</div>
                                        <div style="font-size: 10px; color: var(--text-muted);">${req.studentEmail}</div>
                                    </div>
                                </td>
                                <td style="padding: 12px 10px; font-weight: 600;">${req.classTitle} <span style="font-size: 10px; font-family: monospace; color: var(--text-muted); background: var(--bg-main); padding: 2px 4px; border-radius: 3px; margin-left:4px;">${req.classId}</span></td>
                                <td style="padding: 12px 10px; color: var(--text-secondary);">${dateStr}</td>
                                <td style="padding: 12px 10px; text-align: right;">
                                    <div style="display: inline-flex; gap: 8px;">
                                        <button class="btn btn-primary" style="padding: 6px 12px; font-size: 11px; font-weight: 700; border-radius: var(--radius-sm);" id="btn-approve-${req.id}">Approve</button>
                                        <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 11px; font-weight: 700; border-radius: var(--radius-sm); border-color: rgba(244,63,94,0.3); color: #f43f5e;" id="btn-reject-${req.id}">Reject</button>
                                    </div>
                                </td>
                            </tr>
                `;
            });
            requestsHtml += `
                        </tbody>
                    </table>
                </div>
            `;
        }

        // 4. Quick Actions View
        wrapper.innerHTML = `
            ${bannerHtml}
            
            <div style="margin-top: 32px;">
                <h2 class="dashboard-sec-title">Quick Actions</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 32px;">
                    <button class="btn btn-primary" id="btn-create-batch" style="padding: 16px; border-radius: var(--radius-md); display: flex; flex-direction: column; align-items: flex-start; text-align: left; gap: 8px; font-size: 15px;">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        <strong>Create New Batch</strong>
                        <span style="font-size: 12px; font-weight: normal; opacity: 0.8;">Schedule a new course batch for your students.</span>
                    </button>

                    <button class="btn btn-secondary" id="btn-draft-test" style="padding: 16px; border-radius: var(--radius-md); display: flex; flex-direction: column; align-items: flex-start; text-align: left; gap: 8px; font-size: 15px;">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        <strong>Draft New Test</strong>
                        <span style="font-size: 12px; font-weight: normal; color: var(--text-secondary);">Create assessments or mock practice exams.</span>
                    </button>
                </div>
            </div>

            <div style="margin-bottom: 32px;">
                <h2 class="dashboard-sec-title">Your Taught Batches</h2>
                <div class="classes-grid">
                    ${classesHtml}
                </div>
            </div>

            <div>
                <h2 class="dashboard-sec-title">Pending Enrollment Requests</h2>
                <div id="requests-viewport">
                    ${requestsHtml}
                </div>
            </div>
        `;

        // Bind events
        if (activeClass) {
            wrapper.querySelector('#start-class-btn').addEventListener('click', () => {
                this.launchClassroomSimulator(activeClass);
            });
        }

        // Syllabus toast and student list bindings
        taughtClasses.forEach(cls => {
            wrapper.querySelector(`#btn-syllabus-${cls.id}`).addEventListener('click', () => {
                EduApp.toast.show(`Syllabus loaded for "${cls.title}". Complete textbook units 1-5.`);
            });
            wrapper.querySelector(`#btn-students-${cls.id}`).addEventListener('click', () => {
                EduApp.showEnrolledStudentsModal(cls.id, true);
            });
        });

        // Approve/Reject request bindings
        pendingRequests.forEach(req => {
            const approveBtn = wrapper.querySelector(`#btn-approve-${req.id}`);
            if (approveBtn) {
                approveBtn.addEventListener('click', async () => {
                    const success = await EduApp.db.approveJoinRequest(req.id);
                    if (success) {
                        EduApp.toast.show(`Request approved! ${req.studentName} has joined ${req.classTitle}.`);
                        EduApp.router.updateWorkspace(); // Re-render
                    } else {
                        EduApp.toast.show('Error approving request.');
                    }
                });
            }

            const rejectBtn = wrapper.querySelector(`#btn-reject-${req.id}`);
            if (rejectBtn) {
                rejectBtn.addEventListener('click', async () => {
                    const success = await EduApp.db.rejectJoinRequest(req.id);
                    if (success) {
                        EduApp.toast.show(`Request rejected for ${req.studentName}.`);
                        EduApp.router.updateWorkspace(); // Re-render
                    } else {
                        EduApp.toast.show('Error rejecting request.');
                    }
                });
            }
        });

        // Create Batch trigger
        wrapper.querySelector('#btn-create-batch').addEventListener('click', () => {
            this.showCreateBatchModal();
        });

        // Draft Test trigger
        wrapper.querySelector('#btn-draft-test').addEventListener('click', () => {
            window.open(window.location.pathname + '#teacher/create-test', '_blank');
        });

        return wrapper;
    },

    // Teacher Classroom Simulator
    launchClassroomSimulator(activeClass) {
        const backdrop = document.createElement('div');
        backdrop.style.position = 'fixed';
        backdrop.style.top = '0';
        backdrop.style.left = '0';
        backdrop.style.width = '100vw';
        backdrop.style.height = '100vh';
        backdrop.style.backgroundColor = '#0b0f19';
        backdrop.style.zIndex = '9999';
        backdrop.style.display = 'flex';
        backdrop.style.flexDirection = 'column';
        backdrop.style.color = '#ffffff';
        backdrop.id = 'classroom-simulator';

        backdrop.innerHTML = `
            <!-- Top bar -->
            <div style="padding: 16px 24px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; background-color: #0f172a;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 12px; height: 12px; background-color: var(--accent); border-radius: 50%; animation: pulse 1s infinite alternate;"></div>
                    <span style="font-family: var(--font-heading); font-weight: 800; font-size: 18px; letter-spacing: 0.5px;">EDUCATOR HOST PANEL</span>
                </div>
                
                <!-- Recording Control Bar -->
                <div style="display: flex; align-items: center; gap: 12px;">
                    <button class="btn btn-secondary" id="record-class-btn" style="padding: 6px 16px; font-size: 12px; border-color: rgba(244,63,94,0.4); color: #f43f5e; display: flex; align-items: center; gap: 6px; font-weight: bold; background-color: rgba(244,63,94,0.05);">
                        <span id="record-dot" style="width: 8px; height: 8px; background-color: #f43f5e; border-radius: 50%;"></span>
                        <span id="record-text">Record Class</span>
                    </button>
                    <span id="record-timer" style="font-family: monospace; font-size: 12px; color: #e2e8f0; display: none; background: rgba(0,0,0,0.4); padding: 2px 6px; border-radius: 4px;">00:00</span>
                </div>

                <div style="font-weight: 600; font-size: 14px; background-color: rgba(255,255,255,0.08); padding: 6px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                    Hosting: ${activeClass.title}
                </div>
                <button class="btn btn-accent" id="leave-class-btn" style="padding: 8px 16px; font-weight: 700; border-radius: 6px;">
                    End Session
                </button>
            </div>

            <!-- Webcam Bar -->
            <div style="padding: 12px 24px; background-color: #0d1323; border-bottom: 1px solid #1e293b; display: flex; gap: 20px; align-items: center; justify-content: center;">
                <!-- Teacher Video Container -->
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="position: relative; width: 140px; height: 90px; background-color: #1e293b; border-radius: 8px; overflow: hidden; border: 2px solid var(--primary); display: flex; align-items: center; justify-content: center;">
                        <video id="teacher-webcam-video" autoplay playsinline muted style="width: 100%; height: 100%; object-fit: cover;"></video>
                        <div id="teacher-webcam-avatar" style="position: absolute; font-size: 24px;">👩‍🏫</div>
                        <div style="position: absolute; bottom: 4px; left: 4px; background-color: rgba(0,0,0,0.6); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">Dr. Clara Oswald (You)</div>
                    </div>
                </div>
                <!-- Student Video Container (Simulated) -->
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="position: relative; width: 140px; height: 90px; background-color: #1e293b; border-radius: 8px; overflow: hidden; border: 2px solid #334155; display: flex; align-items: center; justify-content: center;">
                        <!-- Simulated video feed with pulsing effect -->
                        <div id="student-webcam-placeholder" style="width: 100%; height: 100%; background: linear-gradient(45deg, #1e1b4b, #311042); display: flex; flex-direction: column; align-items: center; justify-content: center; animation: pulse 2s infinite alternate;">
                            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256" style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--primary); object-fit: cover; margin-bottom: 4px;" alt="Student">
                            <div style="font-size: 8px; color: #a5b4fc; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Live Student Feed</div>
                        </div>
                        <div style="position: absolute; bottom: 4px; left: 4px; background-color: rgba(0,0,0,0.6); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;" id="webcam-student-name">Alex Morgan</div>
                    </div>
                </div>
            </div>

            <!-- Main workspace -->
            <div id="classroom-workspace-grid" style="flex: 1; display: grid; grid-template-columns: 3fr 1.2fr; overflow: hidden; background-color: #020617;">
                
                <!-- Whiteboard Area -->
                <div id="classroom-whiteboard-area" style="position: relative; display: flex; flex-direction: column; justify-content: center; align-items: center; border-right: 1px solid #1e293b; padding: 20px; gap: 16px;">
                    
                    <!-- Whiteboard Slide Container -->
                    <div class="whiteboard-slide-frame" style="width: 100%; max-width: 820px; aspect-ratio: 16/10; background-color: #1e293b; border-radius: 12px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: var(--shadow-lg); border: 2px solid rgba(255,255,255,0.05); position: relative; overflow: hidden;">
                        
                        <!-- Slide Content Container -->
                        <div id="whiteboard-slide" style="flex: 1; padding: 40px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: radial-gradient(circle, #223048 0%, #0d131e 100%); position: relative;">
                            
                            <!-- Drawing Canvas Overlay -->
                            <canvas id="whiteboard-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; cursor: crosshair; z-index: 10;"></canvas>

                            <div style="z-index: 2; pointer-events: none; user-select: none;">
                                <h2 id="slide-title" style="font-size: 26px; font-family: var(--font-heading); color: #60a5fa; margin-bottom: 20px;">Slide Title</h2>
                                <p id="slide-description" style="font-family: monospace; font-size: 16px; color: #a1a1aa; max-width: 600px; line-height: 2;">
                                    Slide Description Content
                                </p>
                            </div>
                        </div>

                        <!-- Whiteboard Controls Overlay -->
                        <div style="background-color: #0f172a; padding: 12px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #1e293b; z-index: 20;">
                            <!-- Slide selector -->
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <button class="btn btn-secondary" id="prev-slide-btn" style="padding: 6px 12px; font-size: 12px; color: white; border-color: #334155;">&larr; Prev</button>
                                <span id="slide-index" style="font-size: 12px; font-family: monospace;">Slide 1 / 3</span>
                                <button class="btn btn-secondary" id="next-slide-btn" style="padding: 6px 12px; font-size: 12px; color: white; border-color: #334155;">Next &rarr;</button>
                            </div>

                            <!-- Canvas tools -->
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="display: flex; gap: 6px;">
                                    <div class="color-picker active" data-color="#f43f5e" style="width: 20px; height: 20px; border-radius: 50%; background-color: #f43f5e; cursor: pointer; border: 2px solid white;"></div>
                                    <div class="color-picker" data-color="#3b82f6" style="width: 20px; height: 20px; border-radius: 50%; background-color: #3b82f6; cursor: pointer; border: 2px solid transparent;"></div>
                                    <div class="color-picker" data-color="#10b981" style="width: 20px; height: 20px; border-radius: 50%; background-color: #10b981; cursor: pointer; border: 2px solid transparent;"></div>
                                    <div class="color-picker" data-color="#fbbf24" style="width: 20px; height: 20px; border-radius: 50%; background-color: #fbbf24; cursor: pointer; border: 2px solid transparent;"></div>
                                    <div class="color-picker" data-color="#ffffff" style="width: 20px; height: 20px; border-radius: 50%; background-color: #ffffff; cursor: pointer; border: 2px solid transparent;"></div>
                                </div>
                                <button class="btn btn-secondary" id="eraser-btn" style="padding: 4px 10px; font-size: 11px; color: white; border-color: #334155;">Eraser</button>
                                <button class="btn btn-secondary" id="clear-canvas-btn" style="padding: 4px 10px; font-size: 11px; color: white; border-color: #334155; background-color: rgba(244,63,94,0.15); border-color: rgba(244,63,94,0.3);">Clear Board</button>
                            </div>
                        </div>

                    </div>

                    <!-- Webcam & Broadcast settings -->
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 820px; background-color: #0f172a; padding: 12px 20px; border-radius: 8px; border: 1px solid #1e293b;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span id="participant-count-badge" style="background-color: var(--primary); font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px;">Participants: 0</span>
                            <span style="font-size: 12px; color: #a1a1aa;">&bull; Broadcast Stream Status: <strong>Excellent</strong></span>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-secondary" id="share-screen-btn" style="padding: 6px 12px; font-size: 12px; color: white; border-color: #334155;">Share Screen</button>
                            <button class="btn btn-secondary" id="mic-toggle" style="padding: 6px 12px; font-size: 12px; color: white; border-color: #334155;">Mute Mic</button>
                            <button class="btn btn-secondary" id="video-toggle" style="padding: 6px 12px; font-size: 12px; color: white; border-color: #334155;">Stop Video</button>
                        </div>
                    </div>
                </div>

                <!-- Chat & Alert Log Sidebar -->
                <div id="classroom-chat-sidebar" style="display: flex; flex-direction: column; background-color: #0f172a; border-left: 1px solid #1e293b; overflow: hidden;">
                    <!-- Tab Selector -->
                    <div style="display: flex; border-bottom: 1px solid #1e293b; background-color: #0d1323;">
                        <div class="sidebar-tab active" id="tab-class-chat" style="flex:1; text-align:center; padding: 14px; font-size:12px; font-weight: 700; cursor:pointer; border-bottom: 2px solid var(--primary); letter-spacing:0.5px;">CHAT</div>
                        <div class="sidebar-tab" id="tab-class-alerts" style="flex:1; text-align:center; padding: 14px; font-size:12px; font-weight: 700; cursor:pointer; border-bottom: 2px solid transparent; letter-spacing:0.5px; display: flex; align-items:center; justify-content:center; gap: 6px;">
                            ALERTS <span id="alert-count-badge" style="background-color: var(--accent); font-size: 10px; padding: 2px 6px; border-radius: 10px; display: none;">0</span>
                        </div>
                    </div>

                    <!-- Chat Box -->
                    <div id="classroom-chat-view" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
                        <div id="classroom-chat-list" style="flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; font-size: 13px;">
                            <div>
                                <strong style="color: #34d399;">System:</strong>
                                <p style="margin-top: 2px; color: #94a3b8; font-style: italic;">Welcome to your virtual classroom! Students will connect as you advance slides.</p>
                            </div>
                        </div>
                        
                        <!-- Chat Form -->
                        <div style="padding: 16px; border-top: 1px solid #1e293b; display: flex; gap: 8px;">
                            <input type="text" id="classroom-chat-input" placeholder="Broadcasting a message..." style="flex:1; background-color: #1e293b; border: 1px solid #334155; color: white; padding: 8px 12px; border-radius: 6px; outline:none; font-size:13px;">
                            <button class="btn btn-primary" id="classroom-send-chat" style="padding: 8px 12px; border-radius: 6px; font-size:13px;">Send</button>
                        </div>
                    </div>

                    <!-- Alert Log Box -->
                    <div id="classroom-alerts-view" style="flex: 1; display: none; flex-direction: column; overflow: hidden; padding: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <span style="font-size: 12px; font-weight: 700; color: #a1a1aa;">PENDING STUDENT RAISES</span>
                            <button class="btn btn-secondary" id="simulate-hand-btn" style="padding: 4px 8px; font-size: 11px; border-color: #334155; color: white;">Simulate Raise</button>
                        </div>
                        <div id="classroom-alert-list" style="flex: 1; display: flex; flex-direction: column; gap: 8px; overflow-y: auto;">
                            <!-- Dynamic raises go here -->
                            <div id="empty-alerts" style="text-align: center; padding: 40px 0; color: #475569; font-size: 12px; font-style: italic;">
                                No active hand raises.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(backdrop);
        document.body.style.overflow = 'hidden';

        const user = EduApp.db.getCurrentUser() || { name: 'Dr. Clara Oswald' };

        // Select slides based on active class title
        const classTitle = activeClass.title || '';
        let slides = [];
        if (classTitle.includes('Fraction') || classTitle.includes('Decimal')) {
            slides = [
                {
                    title: "1. Fractions & Decimals Introduction",
                    description: "What is a fraction?\n\nA fraction is a part of a whole.\n\nNumerator (top): parts we have.\nDenominator (bottom): total equal parts in the whole.\n\nExample: 3/4 of a pizza is 3 out of 4 equal slices!"
                },
                {
                    title: "2. Equivalent Fractions",
                    description: "Fractions that represent the same value.\n\nMultiply or divide top & bottom by the same non-zero number:\n1/2 = (1*2)/(2*2) = 2/4\n2/4 = (2*2)/(4*2) = 4/8\n\nTherefore, 1/2 = 2/4 = 4/8!"
                },
                {
                    title: "3. Fractions to Decimals",
                    description: "Divide numerator by denominator:\n\n1/2 = 1 ÷ 2 = 0.5\n3/4 = 3 ÷ 4 = 0.75\n2/5 = 2 ÷ 5 = 0.4\n\nProblem: Convert 4/5 into a decimal."
                }
            ];
        } else if (classTitle.includes('Integer') || classTitle.includes('Algebra')) {
            slides = [
                {
                    title: "1. Understanding Integers",
                    description: "Integers are whole numbers and their negative opposites.\n\nPositive: 1, 2, 3...\nNegative: -1, -2, -3...\nZero is in the middle!\n\nNegative numbers are used for cold temperatures, sea level, or debt."
                },
                {
                    title: "2. The Number Line",
                    description: "<--- -3 --- -2 --- -1 --- 0 --- 1 --- 2 --- 3 --->\n\nLeft is smaller, Right is larger.\n-3 is smaller than -1 (because it's further left).\n\nAbsolute Value |x| is distance from 0:\n|-5| = 5, |3| = 3."
                },
                {
                    title: "3. Addition of Integers",
                    description: "When adding with different signs, subtract absolute values and keep the sign of the larger absolute value.\n\nExample: (-5) + 8 = 3\n\nThink of walking 5 steps left, then 8 steps right!"
                }
            ];
        } else if (classTitle.includes('Geometrical') || classTitle.includes('Geometry') || classTitle.includes('Mensuration')) {
            slides = [
                {
                    title: "1. Basic Geometrical Ideas",
                    description: "Point: A position, has no size.\nLine: Straight path extending infinitely in both directions.\nLine Segment: Path with two endpoints.\nRay: Starts at one endpoint, extends infinitely in one direction."
                },
                {
                    title: "2. Classifying Angles",
                    description: "Acute: less than 90°\nRight: exactly 90°\nObtuse: between 90° and 180°\nStraight: exactly 180°\n\nProblem: What type of angle is 120°?"
                },
                {
                    title: "3. Perimeter and Area",
                    description: "Perimeter: Distance around a shape.\n\nPerimeter of Square = 4 × side\nPerimeter of Rectangle = 2 × (length + width)\n\nProblem: A rectangle has length 8cm and width 5cm. Find its perimeter."
                }
            ];
        } else {
            // Factors and Multiples (fallback)
            slides = [
                {
                    title: "1. Factors & Multiples",
                    description: "Factor: A number that divides another number exactly.\nMultiples: Products of a number and integers.\n\nFactors of 6: 1, 2, 3, 6.\nMultiples of 6: 6, 12, 18, 24..."
                },
                {
                    title: "2. Prime vs Composite",
                    description: "Prime: Exactly 2 factors (1 and itself). E.g., 2, 3, 5, 7, 11.\nComposite: More than 2 factors. E.g., 4, 6, 8, 9.\n\nNote: 1 is neither prime nor composite!"
                },
                {
                    title: "3. Highest Common Factor (HCF)",
                    description: "HCF: The greatest common factor of two numbers.\n\nFactors of 12: 1, 2, 3, 4, 6, 12\nFactors of 18: 1, 2, 3, 6, 9, 18\n\nCommon factors: 1, 2, 3, 6. The HCF is 6!"
                }
            ];
        }

        // Initialize state in localStorage
        const defaultChat = [
            { sender: "System", message: `Welcome to the live session for ${activeClass.title}!`, isHost: false, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ];

        EduApp.db.updateLiveClassState({
            classId: activeClass.id,
            status: "live",
            currentSlide: 0,
            drawings: [],
            chat: defaultChat,
            handRaises: [],
            participants: [],
            isScreenSharing: false
        });

        let currentSlide = 0;
        const canvas = backdrop.querySelector('#whiteboard-canvas');
        const ctx = canvas.getContext('2d');
        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;
        let strokeColor = '#f43f5e';
        let strokeWidth = 3;
        let isEraser = false;
        let strokePoints = [];

        // Media Stream Variables
        let localStream = null;
        let screenStream = null;
        let isClassroomActive = true;

        // Recording State Variables
        let isRecording = false;
        let recordInterval = null;
        let recordSeconds = 0;

        // Start local video webcam stream
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (!isClassroomActive) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }
                localStream = stream;
                const videoElement = backdrop.querySelector('#teacher-webcam-video');
                if (videoElement) {
                    videoElement.srcObject = localStream;
                    backdrop.querySelector('#teacher-webcam-avatar').style.display = 'none';
                }
            } catch (err) {
                console.warn("Camera access failed or blocked: ", err);
                const avatarElement = backdrop.querySelector('#teacher-webcam-avatar');
                if (avatarElement) avatarElement.style.display = 'block';
                const videoElement = backdrop.querySelector('#teacher-webcam-video');
                if (videoElement) videoElement.style.display = 'none';
            }
        };

        // Start camera stream immediately
        setTimeout(startCamera, 200);

        // Webcam tracks toggle listeners
        const videoToggleBtn = backdrop.querySelector('#video-toggle');
        let videoEnabled = true;
        videoToggleBtn.addEventListener('click', () => {
            videoEnabled = !videoEnabled;
            if (localStream) {
                localStream.getVideoTracks().forEach(track => track.enabled = videoEnabled);
            }
            videoToggleBtn.textContent = videoEnabled ? 'Stop Video' : 'Start Video';
            videoToggleBtn.style.color = videoEnabled ? 'white' : '#f43f5e';
            backdrop.querySelector('#teacher-webcam-avatar').style.display = videoEnabled ? 'none' : 'block';
            const videoElement = backdrop.querySelector('#teacher-webcam-video');
            if (videoElement) {
                videoElement.style.display = videoEnabled ? 'block' : 'none';
            }
        });

        const micToggleBtn = backdrop.querySelector('#mic-toggle');
        let audioEnabled = true;
        micToggleBtn.addEventListener('click', () => {
            audioEnabled = !audioEnabled;
            if (localStream) {
                localStream.getAudioTracks().forEach(track => track.enabled = audioEnabled);
            }
            micToggleBtn.textContent = audioEnabled ? 'Mute Mic' : 'Unmute Mic';
            micToggleBtn.style.color = audioEnabled ? 'white' : '#f43f5e';
        });

        // Screen share toggle handler
        const shareScreenBtn = backdrop.querySelector('#share-screen-btn');
        
        const startScreenShare = async () => {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                if (!isClassroomActive) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }
                screenStream = stream;
                
                let screenVideo = backdrop.querySelector('#whiteboard-screen-video');
                if (!screenVideo) {
                    screenVideo = document.createElement('video');
                    screenVideo.id = 'whiteboard-screen-video';
                    screenVideo.autoplay = true;
                    screenVideo.playsinline = true;
                    screenVideo.muted = true;
                    screenVideo.style.position = 'absolute';
                    screenVideo.style.top = '0';
                    screenVideo.style.left = '0';
                    screenVideo.style.width = '100%';
                    screenVideo.style.height = '100%';
                    screenVideo.style.objectFit = 'contain';
                    screenVideo.style.zIndex = '15';
                    screenVideo.style.backgroundColor = '#000';
                    backdrop.querySelector('#whiteboard-slide').appendChild(screenVideo);
                }
                
                screenVideo.srcObject = screenStream;
                screenVideo.style.display = 'block';
                
                EduApp.db.updateLiveClassState({ isScreenSharing: true });
                
                shareScreenBtn.textContent = 'Stop Sharing';
                shareScreenBtn.style.backgroundColor = 'rgba(244, 63, 94, 0.2)';
                shareScreenBtn.style.borderColor = '#f43f5e';
                
                screenStream.getVideoTracks()[0].onended = () => {
                    stopScreenShare();
                };
            } catch (err) {
                console.warn("Screen share failed: ", err);
                EduApp.toast.show("Screen share was cancelled or failed.");
            }
        };

        const stopScreenShare = () => {
            if (screenStream) {
                screenStream.getTracks().forEach(track => track.stop());
                screenStream = null;
            }
            const screenVideo = backdrop.querySelector('#whiteboard-screen-video');
            if (screenVideo) {
                screenVideo.style.display = 'none';
                screenVideo.srcObject = null;
            }
            EduApp.db.updateLiveClassState({ isScreenSharing: false });
            
            shareScreenBtn.textContent = 'Share Screen';
            shareScreenBtn.style.backgroundColor = 'transparent';
            shareScreenBtn.style.borderColor = '#334155';
        };

        shareScreenBtn.addEventListener('click', () => {
            const state = EduApp.db.getLiveClassState();
            if (state.isScreenSharing) {
                stopScreenShare();
            } else {
                startScreenShare();
            }
        });

        // Recording toggle handlers
        const recordBtn = backdrop.querySelector('#record-class-btn');
        
        const startRecording = () => {
            isRecording = true;
            recordSeconds = 0;
            backdrop.querySelector('#record-dot').style.animation = 'pulse 0.5s infinite alternate';
            backdrop.querySelector('#record-text').textContent = 'Stop Recording';
            const timerEl = backdrop.querySelector('#record-timer');
            timerEl.style.display = 'inline';
            timerEl.textContent = '00:00';
            
            recordInterval = setInterval(() => {
                recordSeconds++;
                const mins = Math.floor(recordSeconds / 60).toString().padStart(2, '0');
                const secs = (recordSeconds % 60).toString().padStart(2, '0');
                timerEl.textContent = `${mins}:${secs}`;
            }, 1000);
            EduApp.toast.show('Recording started...');
        };

        const stopRecording = () => {
            isRecording = false;
            clearInterval(recordInterval);
            backdrop.querySelector('#record-dot').style.animation = 'none';
            backdrop.querySelector('#record-text').textContent = 'Record Class';
            backdrop.querySelector('#record-timer').style.display = 'none';
            
            const defaultTitle = `${activeClass.title} - Lecture (${new Date().toLocaleDateString()})`;
            const title = prompt("Enter a title for the recorded lecture:", defaultTitle);
            if (title !== null && title.trim() !== '') {
                const lecturePayload = {
                    id: 'lec_' + Date.now(),
                    title: title.trim(),
                    subject: activeClass.subject,
                    instructor: user.name,
                    date: new Date().toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' }),
                    duration: `${Math.floor(recordSeconds / 60)} mins ${recordSeconds % 60} secs`,
                    thumbnail: activeClass.image || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=256',
                    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    materials: []
                };
                EduApp.db.addLecture(lecturePayload);
                EduApp.toast.show(`Recorded lecture "${title.trim()}" saved successfully.`);
            } else {
                EduApp.toast.show('Recording discarded.');
            }
        };

        recordBtn.addEventListener('click', () => {
            if (isRecording) {
                stopRecording();
            } else {
                startRecording();
            }
        });

        // Synthesize notification beep on hand raise using browser AudioContext
        const playChime = () => {
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                
                // Note 1: E5 (659.25 Hz)
                const osc1 = audioCtx.createOscillator();
                const gain1 = audioCtx.createGain();
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime);
                gain1.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
                osc1.connect(gain1);
                gain1.connect(audioCtx.destination);
                osc1.start();
                osc1.stop(audioCtx.currentTime + 0.3);

                // Note 2: A5 (880.00 Hz) slightly offset
                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.12);
                gain2.gain.setValueAtTime(0, audioCtx.currentTime);
                gain2.gain.setValueAtTime(0.1, audioCtx.currentTime + 0.12);
                gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
                osc2.connect(gain2);
                gain2.connect(audioCtx.destination);
                osc2.start(audioCtx.currentTime + 0.12);
                osc2.stop(audioCtx.currentTime + 0.45);
            } catch (e) {
                console.error("Audio Context is blocked or not supported:", e);
            }
        };

        const updateSlide = () => {
            backdrop.querySelector('#slide-title').textContent = slides[currentSlide].title;
            backdrop.querySelector('#slide-description').innerHTML = slides[currentSlide].description.replace(/\n/g, '<br/>');
            backdrop.querySelector('#slide-index').textContent = `Slide ${currentSlide + 1} / ${slides.length}`;
            // Clear local canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Sync current slide and reset drawings in state
            EduApp.db.updateLiveClassState({
                currentSlide: currentSlide,
                drawings: []
            });
        };

        // Initialize canvas resolution to coordinate system
        const initCanvas = () => {
            canvas.width = 1000;
            canvas.height = 625;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
        };

        // Delay to allow DOM attachment
        setTimeout(initCanvas, 100);

        // Coordinates mapping helper
        const getCanvasCoords = (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };
        };

        // Drawing events
        canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            const coords = getCanvasCoords(e);
            lastX = coords.x;
            lastY = coords.y;
            strokePoints = [{ x: lastX, y: lastY }];
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            const coords = getCanvasCoords(e);
            const x = coords.x;
            const y = coords.y;

            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = isEraser ? '#151c2c' : strokeColor; // slide background color or drawing color
            ctx.lineWidth = isEraser ? 20 : strokeWidth;
            ctx.stroke();

            lastX = x;
            lastY = y;
            strokePoints.push({ x: x, y: y });
        });

        canvas.addEventListener('mouseup', () => {
            if (isDrawing && strokePoints.length > 0) {
                // Save drawing stroke
                const state = EduApp.db.getLiveClassState();
                state.drawings = state.drawings || [];
                state.drawings.push({
                    color: isEraser ? '#151c2c' : strokeColor,
                    width: isEraser ? 20 : strokeWidth,
                    points: strokePoints
                });
                EduApp.db.updateLiveClassState({ drawings: state.drawings });
            }
            isDrawing = false;
            strokePoints = [];
        });

        canvas.addEventListener('mouseout', () => {
            if (isDrawing && strokePoints.length > 0) {
                const state = EduApp.db.getLiveClassState();
                state.drawings = state.drawings || [];
                state.drawings.push({
                    color: isEraser ? '#151c2c' : strokeColor,
                    width: isEraser ? 20 : strokeWidth,
                    points: strokePoints
                });
                EduApp.db.updateLiveClassState({ drawings: state.drawings });
            }
            isDrawing = false;
            strokePoints = [];
        });

        // Slide navigation
        backdrop.querySelector('#prev-slide-btn').addEventListener('click', () => {
            if (currentSlide > 0) {
                currentSlide--;
                updateSlide();
            }
        });

        backdrop.querySelector('#next-slide-btn').addEventListener('click', () => {
            if (currentSlide < slides.length - 1) {
                currentSlide++;
                updateSlide();
            }
        });

        // Color picking
        const colors = backdrop.querySelectorAll('.color-picker');
        colors.forEach(el => {
            el.addEventListener('click', () => {
                isEraser = false;
                backdrop.querySelector('#eraser-btn').style.backgroundColor = 'transparent';
                
                colors.forEach(c => c.style.borderColor = 'transparent');
                el.style.borderColor = 'white';
                strokeColor = el.getAttribute('data-color');
            });
        });

        // Eraser Toggle
        backdrop.querySelector('#eraser-btn').addEventListener('click', (e) => {
            isEraser = !isEraser;
            e.target.style.backgroundColor = isEraser ? 'rgba(255,255,255,0.15)' : 'transparent';
        });

        // Clear Board
        backdrop.querySelector('#clear-canvas-btn').addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            EduApp.db.updateLiveClassState({ drawings: [] });
        });

        // Chat View Toggles
        const tabChat = backdrop.querySelector('#tab-class-chat');
        const tabAlerts = backdrop.querySelector('#tab-class-alerts');
        const chatView = backdrop.querySelector('#classroom-chat-view');
        const alertsView = backdrop.querySelector('#classroom-alerts-view');

        tabChat.addEventListener('click', () => {
            tabChat.classList.add('active');
            tabChat.style.borderBottomColor = 'var(--primary)';
            tabAlerts.classList.remove('active');
            tabAlerts.style.borderBottomColor = 'transparent';
            chatView.style.display = 'flex';
            alertsView.style.display = 'none';
        });

        tabAlerts.addEventListener('click', () => {
            tabAlerts.classList.add('active');
            tabAlerts.style.borderBottomColor = 'var(--primary)';
            tabChat.classList.remove('active');
            tabChat.style.borderBottomColor = 'transparent';
            alertsView.style.display = 'flex';
            chatView.style.display = 'none';
            // Clear notifications badge
            const alertCountBadge = backdrop.querySelector('#alert-count-badge');
            alertCountBadge.style.display = 'none';
        });

        // Chat Send
        const sendChat = () => {
            const input = backdrop.querySelector('#classroom-chat-input');
            const val = input.value.trim();
            if (val) {
                const state = EduApp.db.getLiveClassState();
                state.chat = state.chat || [];
                state.chat.push({
                    sender: user.name,
                    message: val,
                    isHost: true,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });
                EduApp.db.updateLiveClassState({ chat: state.chat });
                
                // Immediately refresh chat locally
                syncFromStorage();
                input.value = '';
            }
        };

        backdrop.querySelector('#classroom-send-chat').addEventListener('click', sendChat);
        backdrop.querySelector('#classroom-chat-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendChat();
        });

        // State Synchronizer Loop/Triggers
        let lastChatLength = 1;
        let lastHandRaises = [];

        const dismissHandRaise = (studentId) => {
            const state = EduApp.db.getLiveClassState();
            state.handRaises = (state.handRaises || []).filter(hr => hr.studentId !== studentId);
            EduApp.db.updateLiveClassState({ handRaises: state.handRaises });
            syncFromStorage();
        };

        const simulateHandRaise = () => {
            const studentNames = ['Bella Swan', 'Sarah Jenkins', 'Tyler Durden', 'Sophia Loren', 'Robert Down'];
            const student = studentNames[Math.floor(Math.random() * studentNames.length)];
            const state = EduApp.db.getLiveClassState();
            state.handRaises = state.handRaises || [];
            
            const dummyId = 'dummy_' + Math.random().toString(36).substr(2, 9);
            state.handRaises.push({
                studentId: dummyId,
                studentName: student,
                timestamp: Date.now()
            });
            EduApp.db.updateLiveClassState({ handRaises: state.handRaises });
            syncFromStorage();
        };

        backdrop.querySelector('#simulate-hand-btn').addEventListener('click', simulateHandRaise);

        const syncFromStorage = () => {
            const state = EduApp.db.getLiveClassState();
            
            // Check if class ended
            if (state.status !== 'live' || state.classId !== activeClass.id) {
                cleanup();
                backdrop.remove();
                document.body.style.overflow = '';
                EduApp.toast.show('Live classroom session completed.');
                return;
            }

            // Chat Sync
            const chatList = backdrop.querySelector('#classroom-chat-list');
            if (state.chat && state.chat.length > lastChatLength) {
                for (let i = lastChatLength; i < state.chat.length; i++) {
                    const msg = state.chat[i];
                    const item = document.createElement('div');
                    const color = msg.isHost ? '#60a5fa' : '#a78bfa';
                    item.innerHTML = `
                        <strong style="color: ${color};">${msg.sender}${msg.isHost ? ' (Host)' : ''}:</strong>
                        <p style="margin-top: 2px; color: #e2e8f0;">${msg.message}</p>
                    `;
                    chatList.appendChild(item);
                }
                chatList.scrollTop = chatList.scrollHeight;
                lastChatLength = state.chat.length;
            }

            // Hand Raises alerts sync & chime trigger
            const currentHandRaises = state.handRaises || [];
            const newRaises = currentHandRaises.filter(hr => !lastHandRaises.some(lh => lh.studentId === hr.studentId));
            if (newRaises.length > 0) {
                playChime();
                newRaises.forEach(nr => {
                    EduApp.toast.show(`${nr.studentName} raised their hand!`);
                });
            }

            // Render hand raises list
            const alertList = backdrop.querySelector('#classroom-alert-list');
            alertList.innerHTML = '';
            
            if (currentHandRaises.length === 0) {
                alertList.innerHTML = `
                    <div id="empty-alerts" style="text-align: center; padding: 40px 0; color: #475569; font-size: 12px; font-style: italic;">
                        No active hand raises.
                    </div>
                `;
            } else {
                currentHandRaises.forEach(hr => {
                    const alertItem = document.createElement('div');
                    alertItem.style.display = 'flex';
                    alertItem.style.justifyContent = 'space-between';
                    alertItem.style.alignItems = 'center';
                    alertItem.style.backgroundColor = 'rgba(244,63,94,0.1)';
                    alertItem.style.border = '1px solid rgba(244,63,94,0.2)';
                    alertItem.style.padding = '8px 12px';
                    alertItem.style.borderRadius = '6px';
                    alertItem.style.fontSize = '12px';

                    alertItem.innerHTML = `
                        <div>
                            <span style="color: var(--accent); font-weight:700;">HAND RAISED</span> &bull; 
                            <span style="color: white;">${hr.studentName}</span>
                            <div style="font-size:10px; color: var(--text-muted); margin-top:2px;">At ${new Date(hr.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'})}</div>
                        </div>
                        <button class="btn btn-secondary" style="padding: 4px 8px; font-size:10px; border-color: #334155; color: white; background-color: rgba(255,255,255,0.05);" data-student-id="${hr.studentId}">Dismiss</button>
                    `;

                    alertItem.querySelector('button').addEventListener('click', () => {
                        dismissHandRaise(hr.studentId);
                    });

                    alertList.appendChild(alertItem);
                });

                // Update alert tab badge if not on alerts view
                if (!tabAlerts.classList.contains('active')) {
                    const alertCountBadge = backdrop.querySelector('#alert-count-badge');
                    alertCountBadge.style.display = 'inline';
                    alertCountBadge.textContent = currentHandRaises.length;
                }
            }

            lastHandRaises = currentHandRaises;

            // Sync Participant Count
            const participants = state.participants || [];
            backdrop.querySelector('#participant-count-badge').textContent = `Participants: ${participants.length}`;
            
            // Sync Student Name in simulated webcam feed
            const webcamStudentName = backdrop.querySelector('#webcam-student-name');
            if (webcamStudentName) {
                if (participants.length > 0) {
                    webcamStudentName.textContent = participants[0].name;
                    backdrop.querySelector('#student-webcam-placeholder').style.animation = 'pulse 1s infinite alternate';
                } else {
                    webcamStudentName.textContent = 'No Student Connected';
                    backdrop.querySelector('#student-webcam-placeholder').style.animation = 'none';
                }
            }
        };

        // Storage Event Listener for cross-tab updates
        const onStorageChange = (e) => {
            if (e.key === EduApp.db.KEYS.LIVE_CLASS_STATE) {
                syncFromStorage();
            }
        };
        window.addEventListener('storage', onStorageChange);

        let hashListener;
        const cleanup = () => {
            isClassroomActive = false;
            if (hashListener) window.removeEventListener('hashchange', hashListener);
            window.removeEventListener('storage', onStorageChange);
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
                localStream = null;
            }
            if (screenStream) {
                screenStream.getTracks().forEach(track => track.stop());
                screenStream = null;
            }
            if (recordInterval) {
                clearInterval(recordInterval);
                recordInterval = null;
            }
        };

        hashListener = () => {
            cleanup();
            EduApp.db.clearLiveClassState();
            backdrop.remove();
            document.body.style.overflow = '';
        };
        window.addEventListener('hashchange', hashListener);

        // Leave virtual class
        backdrop.querySelector('#leave-class-btn').addEventListener('click', () => {
            cleanup();
            EduApp.db.clearLiveClassState();
            backdrop.remove();
            document.body.style.overflow = '';
            EduApp.toast.show('Live classroom session completed.');
        });

        // Initialize slide display
        updateSlide();
    },

    // Modal forms: Create Batch
    showCreateBatchModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.id = 'create-batch-modal';

        modal.innerHTML = `
            <div class="modal-container">
                <button class="modal-close" id="batch-close-btn">&times;</button>
                <h2 style="font-size: 20px; font-family: var(--font-heading); margin-bottom: 20px;">Create New Batch</h2>
                
                <form id="create-batch-form" novalidate>
                    <div class="form-group">
                        <label class="form-label" for="batch-title">Batch Course Title</label>
                        <input class="form-input" type="text" id="batch-title" placeholder="Advanced Organic Chemistry II" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="batch-subject">Subject Area</label>
                        <select class="form-input" id="batch-subject" style="background-color: var(--bg-main); width:100%;">
                            <option value="Mathematics">Mathematics</option>
                            <option value="Chemistry">Chemistry</option>
                            <option value="Physics">Physics</option>
                            <option value="Computer Science">Computer Science</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="batch-time">Scheduled Start Time</label>
                        <input class="form-input" type="datetime-local" id="batch-time" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="batch-duration">Duration</label>
                        <input class="form-input" type="text" id="batch-duration" placeholder="60 mins" required>
                    </div>

                    <button class="btn btn-primary" type="submit" style="width: 100%; margin-top: 10px;">
                        Schedule Batch
                    </button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);

        let hashListener;
        const hideModal = () => {
            if (hashListener) window.removeEventListener('hashchange', hashListener);
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 250);
        };

        hashListener = () => {
            hideModal();
        };
        window.addEventListener('hashchange', hashListener);

        modal.querySelector('#batch-close-btn').addEventListener('click', hideModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideModal();
        });

        modal.querySelector('#create-batch-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const title = modal.querySelector('#batch-title').value.trim();
            const subject = modal.querySelector('#batch-subject').value;
            const timeVal = modal.querySelector('#batch-time').value;
            const duration = modal.querySelector('#batch-duration').value.trim() || '60 mins';

            if (!title || !timeVal) {
                EduApp.toast.show('Please fill in all required fields.');
                return;
            }

            const scheduledDate = new Date(timeVal);
            const user = EduApp.db.getCurrentUser();

            // Simple format time string
            const upcomingTimeStr = scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // Calculate display date helper
            const diffDays = Math.floor((scheduledDate - new Date()) / (24 * 60 * 60 * 1000));
            let displayTimeText = '';
            if (diffDays === 0) {
                displayTimeText = `Today at ${upcomingTimeStr}`;
            } else if (diffDays === 1) {
                displayTimeText = `Tomorrow at ${upcomingTimeStr}`;
            } else {
                displayTimeText = `${scheduledDate.toLocaleDateString([], { month: 'short', day: '2-digit' })} at ${upcomingTimeStr}`;
            }

            // Create batch payload
            const batchPayload = {
                id: 'cls_' + Date.now(),
                title: title,
                instructor: user.name,
                subject: subject,
                time: scheduledDate.toISOString(),
                displayTime: displayTimeText,
                duration: duration,
                meetingUrl: 'https://meet.google.com/mock-class-room',
                image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600'
            };

            // Call db write
            await EduApp.db.addClass(batchPayload);
            EduApp.toast.show('New Batch Scheduled Successfully!');
            
            hideModal();

            // Re-render subview workspace (trigger router re-run or local viewport update)
            EduApp.router.updateWorkspace();
        });
    },

    // Modal forms: Draft Test
    showDraftTestModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.id = 'draft-test-modal';

        modal.innerHTML = `
            <div class="modal-container">
                <button class="modal-close" id="test-close-btn">&times;</button>
                <h2 style="font-size: 20px; font-family: var(--font-heading); margin-bottom: 20px;">Draft New Test</h2>
                
                <form id="draft-test-form" novalidate>
                    <div class="form-group">
                        <label class="form-label" for="test-title">Test Title</label>
                        <input class="form-input" type="text" id="test-title" placeholder="Calculus derivatives check" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="test-subject">Subject</label>
                        <select class="form-input" id="test-subject" style="background-color: var(--bg-main); width:100%;">
                            <option value="Mathematics">Mathematics</option>
                            <option value="Chemistry">Chemistry</option>
                            <option value="Physics">Physics</option>
                            <option value="Computer Science">Computer Science</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="test-count">Questions Count</label>
                        <input class="form-input" type="number" id="test-count" value="15" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="test-duration">Allowed Time (duration)</label>
                        <input class="form-input" type="text" id="test-duration" placeholder="45 mins" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="test-due">Due Date</label>
                        <input class="form-input" type="text" id="test-due" placeholder="June 25, 2026" required>
                    </div>

                    <button class="btn btn-primary" type="submit" style="width: 100%; margin-top: 10px;">
                        Create and Draft Test
                    </button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);

        let hashListener;
        const hideModal = () => {
            if (hashListener) window.removeEventListener('hashchange', hashListener);
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 250);
        };

        hashListener = () => {
            hideModal();
        };
        window.addEventListener('hashchange', hashListener);

        modal.querySelector('#test-close-btn').addEventListener('click', hideModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideModal();
        });

        modal.querySelector('#draft-test-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const title = modal.querySelector('#test-title').value.trim();
            const subject = modal.querySelector('#test-subject').value;
            const count = modal.querySelector('#test-count').value || '15';
            const duration = modal.querySelector('#test-duration').value.trim() || '45 mins';
            const dueStr = modal.querySelector('#test-due').value.trim() || 'June 25, 2026';

            if (!title) {
                EduApp.toast.show('Please fill in the Test Title.');
                return;
            }

            // Create test payload
            const testPayload = {
                id: 'tst_' + Date.now(),
                title: title,
                subject: subject,
                questionsCount: parseInt(count) || 15,
                duration: duration,
                status: 'active',
                score: null,
                dueDate: dueStr
            };

            // Call db write
            await EduApp.db.addTest(testPayload);
            EduApp.toast.show('New Assessment Drafted Successfully!');

            hideModal();

            // Refresh workspace
            EduApp.router.updateWorkspace();
        });
    }
};
