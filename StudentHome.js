window.EduApp = window.EduApp || {};

EduApp.StudentHome = {
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
    },

    render() {
        const wrapper = document.createElement('div');
        wrapper.className = 'student-home-wrapper';
        
        // Clean up any row blob URLs to prevent memory leaks
        this.revokeRowBlobs();

        const user = EduApp.db.getCurrentUser() || { id: 'std_001', name: 'Student One' };
        const enrolledClassIds = user.enrolledClasses || [];

        // Check for upcoming or active class (only for classes the student is enrolled in)
        const classes = EduApp.db.getClasses();
        const studentClasses = classes.filter(cls => enrolledClassIds.includes(cls.id));
        const now = new Date();

        // Prioritize actual live class state
        const liveState = EduApp.db.getLiveClassState();
        let activeClass = null;
        let isClassCurrentlyLive = false;

        if (liveState && liveState.status === 'live' && enrolledClassIds.includes(liveState.classId)) {
            activeClass = studentClasses.find(cls => cls.id === liveState.classId);
            isClassCurrentlyLive = true;
        }

        // If no actual live class, fall back to scheduled check
        if (!activeClass) {
            activeClass = studentClasses.find(cls => {
                const classTime = new Date(cls.time);
                const diffMs = classTime - now;
                return diffMs > -60 * 60 * 1000 && diffMs <= 60 * 60 * 1000;
            });
        }

        let bannerHtml = '';
        if (activeClass) {
            if (isClassCurrentlyLive) {
                bannerHtml = `
                    <div class="join-class-banner" id="join-class-banner" style="background: linear-gradient(135deg, #8b5cf6, #ec4899); box-shadow: 0 0 25px rgba(139, 92, 246, 0.65); border: 1px solid rgba(255,255,255,0.1); position: relative;">
                        <div class="banner-content">
                            <span class="banner-label" style="background-color: #ef4444; color: white; padding: 2px 8px; border-radius: 4px; font-weight: 800; font-size: 10px; text-transform: uppercase; animation: pulse 1s infinite alternate; display: inline-block; margin-bottom: 8px;">Live Now</span>
                            <h2 class="banner-title">${activeClass.title}</h2>
                            <div class="banner-detail">
                                <span>Instructor: <strong>${activeClass.instructor}</strong></span> &bull; 
                                <span>Duration: <strong>${activeClass.duration}</strong></span>
                            </div>
                        </div>
                        <button class="btn btn-accent" id="join-now-btn" style="box-shadow: 0 0 15px rgba(244, 63, 94, 0.6); background-color: #f43f5e; color: white;">Join Class</button>
                    </div>
                `;
            } else {
                bannerHtml = `
                    <div class="join-class-banner" id="join-class-banner">
                        <div class="banner-content">
                            <span class="banner-label">Upcoming Live Class</span>
                            <h2 class="banner-title">${activeClass.title}</h2>
                            <div class="banner-detail">
                                <span>Instructor: <strong>${activeClass.instructor}</strong></span> &bull; 
                                <span>Duration: <strong>${activeClass.duration}</strong></span>
                            </div>
                        </div>
                        <button class="btn btn-accent" id="join-now-btn" disabled style="opacity: 0.6; cursor: not-allowed;">Waiting for Host...</button>
                    </div>
                `;
            }
        }

        // Render classes grid HTML
        let classesHtml = '';
        if (studentClasses.length === 0) {
            classesHtml = `
                <div style="grid-column: 1/-1; text-align: center; padding: 48px 24px; border: 2px dashed var(--border); border-radius: var(--radius-lg); background-color: var(--bg-surface); display: flex; flex-direction: column; align-items: center; gap: 16px;">
                    <div style="font-size: 32px;">🎒</div>
                    <div style="font-size: 16px; font-weight: 700; color: var(--text-primary);">No batches joined</div>
                    <p class="text-secondary" style="font-size: 14px; max-width: 320px; margin: 0; line-height:1.5;">Please join a new batch to access live classrooms, syllabus schedules, and assignments.</p>
                    <button class="btn btn-primary" id="btn-join-batch-empty" style="padding: 10px 20px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; border-radius:var(--radius-sm);">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Join New Batch
                    </button>
                </div>
            `;
        } else {
            studentClasses.forEach(cls => {
                classesHtml += `
                    <div class="class-card">
                        <div class="class-image" style="background-image: linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.4)), url('${cls.image}')">
                            <span class="class-subject-tag">${cls.subject}</span>
                        </div>
                        <div class="class-info">
                            <h3 class="class-title">${cls.title}</h3>
                            <div class="class-details">
                                <div class="class-detail-item">
                                    <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                    <span>Instructor: ${cls.instructor}</span>
                                </div>
                                <div class="class-detail-item">
                                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                    <span>Time: ${cls.displayTime}</span>
                                </div>
                                <div class="class-detail-item">
                                    <svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>
                                    <span>Duration: ${cls.duration}</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px; margin-top: auto; width: 100%;">
                                <button class="btn btn-secondary" style="flex: 1; padding: 8px; font-size: 11px;" id="btn-syllabus-${cls.id}">
                                    Syllabus
                                </button>
                                <button class="btn btn-secondary" style="flex: 1.2; padding: 8px; font-size: 11px; border-color: var(--primary); color: var(--primary);" id="btn-students-${cls.id}">
                                    Classmates
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        const homeworkList = EduApp.db.getHomework();
        const enrolledSubjects = studentClasses.map(c => c.subject);

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

        // Construct complete list of assignments for this student matching enrolled subjects
        const studentAssignments = [];
        let virtualIdCounter = 1;
        uniqueAssignmentsMap.forEach((meta, title) => {
            if (enrolledSubjects.includes(meta.subject)) {
                const existing = homeworkList.find(hw => hw.studentId === user.id && hw.title === title);
                if (existing) {
                    studentAssignments.push(existing);
            } else {
                studentAssignments.push({
                    id: `hw_virtual_${virtualIdCounter++}`,
                    studentId: user.id,
                    studentName: user.name,
                    name: user.name,
                    title: title,
                    subject: meta.subject,
                    submittedAt: null,
                    status: 'pending',
                    fileName: null,
                    fileSize: null,
                    grade: null,
                    score: null,
                    feedback: null,
                    dueDate: 'Soon'
                });
            }
        }
        });

        let homeworkHtml = '';
        if (studentAssignments.length === 0) {
            homeworkHtml = `<p class="text-secondary" style="grid-column:span 3; padding:20px 0; font-size:14px;">No assignments registered.</p>`;
        } else {
            studentAssignments.forEach(hw => {
                let statusBadge = '';
                let actionBtn = '';
                
                let fileLinkHtml = `<strong style="color:var(--primary);">${hw.fileName || 'assignment.pdf'}</strong>`;
                if (hw.fileName) {
                    fileLinkHtml = `<a href="#" style="color:var(--primary); font-weight:600; text-decoration:underline;" id="view-file-link-${hw.id}">📄 ${hw.fileName}</a>`;
                }

                if (hw.status === 'graded') {
                    statusBadge = `<span style="background-color: #DEF7EC; color: #03543F; padding: 4px 10px; border-radius: var(--radius-full); font-size:11px; font-weight:700;">Graded: ${hw.grade} (${hw.score}%)</span>`;
                    actionBtn = `
                        <div style="font-size:12px; color:var(--text-secondary); margin-top:8px;">File: ${fileLinkHtml}</div>
                        <div style="font-size:12px; color:var(--text-secondary); margin-top:4px; border-top:1px dashed var(--border); padding-top:6px;">
                            Teacher Feedback: <em style="color:var(--text-primary);">"${hw.feedback || 'Good effort!'}"</em>
                        </div>
                    `;
                } else if (hw.status === 'submitted') {
                    statusBadge = `<span style="background-color: #E1EFFE; color: #1E429F; padding: 4px 10px; border-radius: var(--radius-full); font-size:11px; font-weight:700;">Submitted</span>`;
                    actionBtn = `<div style="font-size:12px; color:var(--text-secondary); margin-top:8px;">File: ${fileLinkHtml} (${hw.fileSize}) <br/><span class="text-muted" style="font-size:10px;">Pending review</span></div>`;
                } else { // pending
                    statusBadge = `<span style="background-color: #FEF08A; color: #713F12; padding: 4px 10px; border-radius: var(--radius-full); font-size:11px; font-weight:700;">Pending Submission</span>`;
                    actionBtn = `
                        <div style="margin-top:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                            <span style="font-size:12px; color:var(--accent); font-weight:600;">Due: ${hw.dueDate || 'Soon'}</span>
                            <button class="btn btn-primary" id="submit-hw-btn-${hw.id}" style="padding: 6px 12px; font-size:12px; border-radius:var(--radius-sm);">Submit Homework</button>
                        </div>
                    `;
                }

                homeworkHtml += `
                    <div class="class-card" style="padding: 20px; display:flex; flex-direction:column; gap:6px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span class="class-subject-tag" style="position:static; padding: 2px 8px; font-size:10px;">${hw.subject}</span>
                            ${statusBadge}
                        </div>
                        <h3 class="class-title" style="font-size:15px; margin-top:8px; margin-bottom:0;">${hw.title}</h3>
                        ${actionBtn}
                    </div>
                `;
            });
        }

        wrapper.innerHTML = `
            ${bannerHtml}
            
            <div style="margin-top: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h2 class="dashboard-sec-title" style="margin-bottom: 0;">Your Enrolled Batches</h2>
                    ${studentClasses.length > 0 ? `
                        <button class="btn btn-primary" id="btn-join-batch-header" style="padding: 8px 16px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; border-radius: var(--radius-sm);">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Join New Batch
                        </button>
                    ` : ''}
                </div>
                <div class="classes-grid">
                    ${classesHtml}
                </div>
            </div>
 
            <div style="margin-top: 36px;">
                <h2 class="dashboard-sec-title">Your Homework Assignments</h2>
                <div class="classes-grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:20px;">
                    ${homeworkHtml}
                </div>
            </div>
        `;

        // Bind events
        const joinHeaderBtn = wrapper.querySelector('#btn-join-batch-header');
        if (joinHeaderBtn) {
            joinHeaderBtn.addEventListener('click', () => {
                this.showJoinBatchModal(user.id);
            });
        }

        const joinEmptyBtn = wrapper.querySelector('#btn-join-batch-empty');
        if (joinEmptyBtn) {
            joinEmptyBtn.addEventListener('click', () => {
                this.showJoinBatchModal(user.id);
            });
        }

        if (activeClass) {
            wrapper.querySelector('#join-now-btn').addEventListener('click', () => {
                this.launchClassroomSimulator(activeClass);
            });
        }

        // Class card button event bindings
        studentClasses.forEach(cls => {
            wrapper.querySelector(`#btn-syllabus-${cls.id}`).addEventListener('click', () => {
                EduApp.toast.show('Class syllabus and material details are available in the Progress page.');
            });
            wrapper.querySelector(`#btn-students-${cls.id}`).addEventListener('click', () => {
                EduApp.showEnrolledStudentsModal(cls.id, false);
            });
        });

        // Bind Homework submission button events
        studentAssignments.forEach(hw => {
            if (hw.status === 'pending') {
                const btn = wrapper.querySelector(`#submit-hw-btn-${hw.id}`);
                if (btn) {
                    btn.addEventListener('click', () => {
                        this.launchHomeworkSubmitModal(hw);
                    });
                }
            }
        });

        // Bind Homework view file events
        studentAssignments.forEach(hw => {
            if (hw.fileName) {
                const link = wrapper.querySelector(`#view-file-link-${hw.id}`);
                if (link) {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.launchHomeworkViewer(hw);
                    });
                }
            }
        });

        return wrapper;
    },

    // Displays the single PDF homework submission modal
    launchHomeworkSubmitModal(homeworkItem) {
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.id = 'hw-submit-modal-backdrop';

        backdrop.innerHTML = `
            <div class="modal-container" style="max-width: 460px; padding:32px;">
                <button class="modal-close" id="hw-close-btn">&times;</button>
                
                <h2 style="font-size:20px; font-family:var(--font-heading); margin-bottom:8px; text-align:center;">Submit Homework</h2>
                <p class="text-secondary text-center" style="font-size:13px; margin-bottom:24px;">Upload your completed work file. Access strictly restricted to a single PDF.</p>

                <div style="background-color: var(--primary-light); padding:12px 16px; border-radius: var(--radius-md); border-left:4px solid var(--primary); margin-bottom:24px; font-size:13px;">
                    <div>Assignment: <strong>${homeworkItem.title}</strong></div>
                    <div style="margin-top:2px;">Subject: <span>${homeworkItem.subject}</span></div>
                </div>

                <!-- Drag zone uploader simulation -->
                <div id="hw-drag-zone" style="border: 2px dashed var(--border); border-radius: var(--radius-md); padding: 30px 20px; text-align:center; cursor:pointer; background-color: var(--bg-main); transition: var(--transition); margin-bottom:20px;">
                    <svg viewBox="0 0 24 24" width="32" height="32" stroke="var(--primary)" stroke-width="2" fill="none" style="margin: 0 auto 12px auto;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    <div style="font-weight:600; font-size:14px; margin-bottom:4px;" id="hw-zone-text">Click to choose file or drag here</div>
                    <span style="font-size:11px; color:var(--text-muted);">Only single PDF format (.pdf) allowed</span>
                    <input type="file" id="hw-file-input" accept=".pdf" style="display:none;">
                </div>

                <!-- Validations messaging logs -->
                <div id="hw-upload-error" style="display:none; background-color:#FDE8E8; border:1px solid #FBD5D5; color:#9B1C1C; padding:10px 14px; border-radius:var(--radius-sm); font-size:13px; font-weight:700; margin-bottom:20px; line-height:1.4;"></div>
                <div id="hw-upload-success" style="display:none; background-color:#DEF7EC; border:1px solid #BCF0DA; color:#03543F; padding:10px 14px; border-radius:var(--radius-sm); font-size:13px; margin-bottom:20px; line-height:1.4;"></div>

                <div style="display:flex; justify-content:flex-end; gap:12px;">
                    <button class="btn btn-secondary" id="hw-cancel-btn" style="font-size:13px;">Cancel</button>
                    <button class="btn btn-primary" id="hw-submit-upload-btn" style="font-size:13px;" disabled>Submit Assignment</button>
                </div>
            </div>
        `;

        document.body.appendChild(backdrop);

        const fileInput = backdrop.querySelector('#hw-file-input');
        const dragZone = backdrop.querySelector('#hw-drag-zone');
        const errorDiv = backdrop.querySelector('#hw-upload-error');
        const successDiv = backdrop.querySelector('#hw-upload-success');
        const submitBtn = backdrop.querySelector('#hw-submit-upload-btn');

        let selectedFile = null;

        // Click on dragzone opens input
        dragZone.addEventListener('click', () => {
            fileInput.click();
        });

        // Dragover visual feedback
        dragZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dragZone.style.borderColor = 'var(--primary)';
            dragZone.style.backgroundColor = 'var(--primary-light)';
        });

        dragZone.addEventListener('dragleave', () => {
            dragZone.style.borderColor = 'var(--border)';
            dragZone.style.backgroundColor = 'var(--bg-main)';
        });

        dragZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dragZone.style.borderColor = 'var(--border)';
            dragZone.style.backgroundColor = 'var(--bg-main)';
            
            if (e.dataTransfer.files) {
                validateAndSetFiles(e.dataTransfer.files);
            }
        });

        // Validator logic
        const validateAndSetFiles = (files) => {
            errorDiv.style.display = 'none';
            successDiv.style.display = 'none';
            submitBtn.setAttribute('disabled', 'true');
            selectedFile = null;

            if (files.length === 0) return;

            // 1. Check if multiple files selected
            if (files.length > 1) {
                errorDiv.textContent = 'Invalid selection. You can only upload a single PDF file!';
                errorDiv.style.display = 'block';
                fileInput.value = '';
                return;
            }

            const file = files[0];

            // 2. Check if extension is PDF
            const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
            if (!isPdf) {
                errorDiv.innerHTML = `<strong>File Error:</strong> Only PDF files are allowed! Your file (${file.name}) was rejected.`;
                errorDiv.style.display = 'block';
                fileInput.value = '';
                return;
            }

            // Valid PDF case
            selectedFile = file;
            const fileSizeKb = (file.size / 1024).toFixed(1);
            successDiv.innerHTML = `✓ <strong>Ready to upload:</strong> ${file.name} (${fileSizeKb} KB)`;
            successDiv.style.display = 'block';
            submitBtn.removeAttribute('disabled');
        };

        fileInput.addEventListener('change', (e) => {
            if (e.target.files) {
                validateAndSetFiles(e.target.files);
            }
        });

        let hashListener;
        const closeModal = () => {
            if (hashListener) window.removeEventListener('hashchange', hashListener);
            backdrop.classList.remove('active');
            setTimeout(() => backdrop.remove(), 250);
        };

        hashListener = () => {
            closeModal();
        };
        window.addEventListener('hashchange', hashListener);

        backdrop.querySelector('#hw-close-btn').addEventListener('click', closeModal);
        backdrop.querySelector('#hw-cancel-btn').addEventListener('click', closeModal);
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeModal();
        });

        // Submit to database handler
        submitBtn.addEventListener('click', () => {
            if (selectedFile) {
                const fileSizeKb = (selectedFile.size / 1024).toFixed(1) + ' KB';
                
                // Read PDF file as Base64 Data URL
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const fileDataUrl = e.target.result;
                    try {
                        const success = await EduApp.db.submitHomework(
                            homeworkItem.id, 
                            selectedFile.name, 
                            fileSizeKb,
                            homeworkItem.studentId,
                            homeworkItem.title,
                            homeworkItem.subject,
                            fileDataUrl
                        );
                        if (success) {
                            closeModal();
                            EduApp.toast.show('Homework submitted successfully!');
                            EduApp.router.updateWorkspace(); // Re-render student dashboard
                        } else {
                            EduApp.toast.show('Error saving submission. Please try again.');
                        }
                    } catch (err) {
                        console.error(err);
                        EduApp.toast.show(err.message || 'Error saving submission. File might be too large.');
                    }
                };
                reader.onerror = () => {
                    EduApp.toast.show('Failed to read the file. Please try again.');
                };
                reader.readAsDataURL(selectedFile);
            }
        });

        // Show modal transition
        setTimeout(() => backdrop.classList.add('active'), 10);
    },

    // Classroom simulator logic (popups/simulations)
    launchClassroomSimulator(activeClass) {
        // Create full screen classroom backdrop
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

        const user = EduApp.db.getCurrentUser() || { id: 'std_001', name: 'Student One' };

        backdrop.innerHTML = `
            <!-- Top bar -->
            <div style="padding: 16px 24px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; background-color: #0f172a;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 12px; height: 12px; background-color: var(--accent); border-radius: 50%; animation: pulse 1s infinite alternate;"></div>
                    <span style="font-family: var(--font-heading); font-weight: 800; font-size: 18px;">LIVE CLASSROOM</span>
                </div>
                <div style="font-weight: 600; font-size: 15px; background-color: rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 6px;">
                    ${activeClass.title} - ${activeClass.instructor}
                </div>
                <button class="btn btn-accent" id="leave-class-btn" style="padding: 8px 16px; font-weight: 700; border-radius: 6px;">
                    Leave Classroom
                </button>
            </div>

            <!-- Webcam Bar -->
            <div style="padding: 12px 24px; background-color: #0d1323; border-bottom: 1px solid #1e293b; display: flex; gap: 20px; align-items: center; justify-content: center;">
                <!-- Student Video Container (Local) -->
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="position: relative; width: 140px; height: 90px; background-color: #1e293b; border-radius: 8px; overflow: hidden; border: 2px solid var(--primary); display: flex; align-items: center; justify-content: center;">
                        <video id="student-webcam-video" autoplay playsinline muted style="width: 100%; height: 100%; object-fit: cover;"></video>
                        <div id="student-webcam-avatar" style="position: absolute; font-size: 24px;">🎒</div>
                        <div style="position: absolute; bottom: 4px; left: 4px; background-color: rgba(0,0,0,0.6); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">👤 ${user.name} (You)</div>
                    </div>
                </div>
                <!-- Teacher Video Container (Simulated Host) -->
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="position: relative; width: 140px; height: 90px; background-color: #1e293b; border-radius: 8px; overflow: hidden; border: 2px solid #334155; display: flex; align-items: center; justify-content: center;">
                        <!-- Simulated video feed with pulsing effect -->
                        <div id="teacher-webcam-placeholder" style="width: 100%; height: 100%; background: linear-gradient(45deg, #1e1b4b, #1e293b); display: flex; flex-direction: column; align-items: center; justify-content: center; animation: pulse 2s infinite alternate;">
                            <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256" style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--primary); object-fit: cover; margin-bottom: 4px;" alt="Teacher">
                            <div style="font-size: 8px; color: #a5b4fc; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Live Host Feed</div>
                        </div>
                        <div style="position: absolute; bottom: 4px; left: 4px; background-color: rgba(0,0,0,0.6); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">👩‍🏫 ${activeClass.instructor}</div>
                    </div>
                </div>
            </div>

            <!-- Main view (Whiteboard presentation + chat) -->
            <div id="classroom-workspace-grid" style="flex: 1; display: grid; grid-template-columns: 3fr 1.2fr; overflow: hidden; background-color: #020617;">
                
                <!-- Main screen: blackboard/webcam -->
                <div id="classroom-whiteboard-area" style="position: relative; display: flex; flex-direction: column; justify-content: center; align-items: center; border-right: 1px solid #1e293b; padding: 20px; gap: 16px;">
                    
                    <!-- Whiteboard Slide Container -->
                    <div class="whiteboard-slide-frame" style="width: 100%; max-width: 820px; aspect-ratio: 16/10; background-color: #1e293b; border-radius: 12px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: var(--shadow-lg); border: 2px solid rgba(255,255,255,0.05); position: relative; overflow: hidden;">
                        
                        <!-- Slide Content Container -->
                        <div id="whiteboard-slide" style="flex: 1; padding: 40px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: radial-gradient(circle, #223048 0%, #0d131e 100%); position: relative;">
                            
                            <!-- Drawing Canvas Overlay -->
                            <canvas id="whiteboard-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; pointer-events: none;"></canvas>
 
                            <div style="z-index: 2; pointer-events: none; user-select: none;">
                                <h2 id="slide-title" style="font-size: 26px; font-family: var(--font-heading); color: #60a5fa; margin-bottom: 20px;">Slide Title</h2>
                                <p id="slide-description" style="font-family: monospace; font-size: 16px; color: #a1a1aa; max-width: 600px; line-height: 2;">
                                    Slide Description Content
                                </p>
                            </div>
                        </div>
 
                        <!-- Whiteboard Controls Footer (View Only for Student) -->
                        <div style="background-color: #0f172a; padding: 12px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #1e293b; z-index: 20;">
                            <span style="font-size: 11px; color: #60a5fa; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Whiteboard Synced with Instructor</span>
                            <span id="slide-index" style="font-size: 12px; font-family: monospace;">Slide 1 / 3</span>
                        </div>
 
                    </div>
 
                    <!-- Webcam buttons / controls -->
                    <div style="display: flex; gap: 16px; margin-top: 8px;">
                        <button class="btn btn-secondary" style="border-radius: 6px; padding: 10px 20px; border-color: #334155; color: white;" id="student-mic-toggle">
                            Mute Mic
                        </button>
                        <button class="btn btn-secondary" style="border-radius: 6px; padding: 10px 20px; border-color: #334155; color: white;" id="webcam-toggle-btn">
                            Stop Video
                        </button>
                        <button class="btn btn-secondary" style="border-radius: 6px; padding: 10px 20px; border-color: #334155; color: white;" id="classroom-raise-hand">
                            Raise Hand
                        </button>
                    </div>
                </div>
 
                <!-- Chat sidebar -->
                <div id="classroom-chat-sidebar" style="display: flex; flex-direction: column; background-color: #0f172a; border-left: 1px solid #1e293b; overflow: hidden;">
                    <div style="padding: 16px; border-bottom: 1px solid #1e293b; font-weight: 700; font-size: 14px; letter-spacing: 0.5px;">
                        CLASSROOM CHAT
                    </div>
                    
                    <!-- Chat Messages List -->
                    <div id="classroom-chat-list" style="flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; font-size: 13px;">
                        <!-- messages -->
                    </div>

                    <!-- Chat input -->
                    <div style="padding: 16px; border-top: 1px solid #1e293b; display: flex; gap: 8px;">
                        <input type="text" id="classroom-chat-input" placeholder="Type a message..." style="flex:1; background-color: #1e293b; border: 1px solid #334155; color: white; padding: 8px 12px; border-radius: 6px; outline:none; font-size:13px;">
                        <button class="btn btn-primary" id="classroom-send-chat" style="padding: 8px 12px; border-radius: 6px; font-size:13px;">Send</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(backdrop);
        document.body.style.overflow = 'hidden'; // Lock scrolling

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

        const canvas = backdrop.querySelector('#whiteboard-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1000;
        canvas.height = 625;

        // Register participant to state
        const registerParticipant = () => {
            const state = EduApp.db.getLiveClassState();
            state.participants = state.participants || [];
            if (!state.participants.some(p => p.studentId === user.id)) {
                state.participants.push({ studentId: user.id, name: user.name });
                EduApp.db.updateLiveClassState({ participants: state.participants });
            }
        };
        registerParticipant();

        // 1. Mark attendance on entry
        const markSelfPresent = () => {
            const todayStatusStr = localStorage.getItem('edu_teacher_attendance_today');
            let todayStatus = todayStatusStr ? JSON.parse(todayStatusStr) : {};
            
            const currentRecord = todayStatus[user.id] || {};
            const existingSeconds = typeof currentRecord === 'object' ? (currentRecord.staySeconds || 0) : 0;
            const existingTimeStr = typeof currentRecord === 'object' ? (currentRecord.stayTimeStr || '0 secs') : '0 secs';
            
            todayStatus[user.id] = {
                present: true,
                staySeconds: existingSeconds,
                stayTimeStr: existingTimeStr
            };
            
            localStorage.setItem('edu_teacher_attendance_today', JSON.stringify(todayStatus));
            
            // Sync with global attendance DB
            const attendance = EduApp.db.getAttendance();
            if (!attendance.today) attendance.today = [];
            const index = attendance.today.findIndex(r => r.studentId === user.id);
            if (index !== -1) {
                attendance.today[index].status = 'present';
            } else {
                attendance.today.push({
                    studentId: user.id,
                    studentName: user.name,
                    name: user.name,
                    status: 'present'
                });
            }
            localStorage.setItem(EduApp.db.KEYS.ATTENDANCE, JSON.stringify(attendance));
        };
        markSelfPresent();

        // 2. Stay Tracker Heartbeat
        let staySeconds = 0;
        const checkInitialStay = () => {
            const todayStatusStr = localStorage.getItem('edu_teacher_attendance_today');
            if (todayStatusStr) {
                const todayStatus = JSON.parse(todayStatusStr);
                const currentRecord = todayStatus[user.id];
                if (currentRecord && typeof currentRecord === 'object') {
                    staySeconds = currentRecord.staySeconds || 0;
                }
            }
        };
        checkInitialStay();

        const saveStayTime = () => {
            const todayStatusStr = localStorage.getItem('edu_teacher_attendance_today');
            let todayStatus = todayStatusStr ? JSON.parse(todayStatusStr) : {};
            
            let timeStr = '';
            if (staySeconds < 60) {
                timeStr = `${staySeconds} secs`;
            } else {
                const mins = Math.floor(staySeconds / 60);
                const secs = staySeconds % 60;
                timeStr = `${mins} mins ${secs} secs`;
            }
            
            todayStatus[user.id] = {
                present: true,
                staySeconds: staySeconds,
                stayTimeStr: timeStr
            };
            localStorage.setItem('edu_teacher_attendance_today', JSON.stringify(todayStatus));
            
            if (typeof EduApp.db.logStayHeartbeat === 'function') {
                EduApp.db.logStayHeartbeat(staySeconds, timeStr);
            }
        };

        const stayInterval = setInterval(() => {
            staySeconds++;
            if (staySeconds % 5 === 0) {
                saveStayTime();
            }
        }, 1000);

        // Beforeunload backup
        const onUnload = () => {
            saveStayTime();
        };
        window.addEventListener('beforeunload', onUnload);

        // Media Stream Variables
        let localStream = null;
        let isClassroomActive = true;

        // Start local video webcam stream
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (!isClassroomActive) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }
                localStream = stream;
                const videoElement = backdrop.querySelector('#student-webcam-video');
                if (videoElement) {
                    videoElement.srcObject = localStream;
                    backdrop.querySelector('#student-webcam-avatar').style.display = 'none';
                }
            } catch (err) {
                console.warn("Student camera access failed or blocked: ", err);
                const avatarElement = backdrop.querySelector('#student-webcam-avatar');
                if (avatarElement) avatarElement.style.display = 'block';
                const videoElement = backdrop.querySelector('#student-webcam-video');
                if (videoElement) videoElement.style.display = 'none';
            }
        };

        // Start camera stream immediately
        setTimeout(startCamera, 200);

        // Video and Audio toggle buttons
        const videoToggleBtn = backdrop.querySelector('#webcam-toggle-btn');
        let videoEnabled = true;
        videoToggleBtn.addEventListener('click', () => {
            videoEnabled = !videoEnabled;
            if (localStream) {
                localStream.getVideoTracks().forEach(track => track.enabled = videoEnabled);
            }
            videoToggleBtn.textContent = videoEnabled ? 'Stop Video' : 'Start Video';
            videoToggleBtn.style.color = videoEnabled ? 'white' : '#f43f5e';
            backdrop.querySelector('#student-webcam-avatar').style.display = videoEnabled ? 'none' : 'block';
            const videoElement = backdrop.querySelector('#student-webcam-video');
            if (videoElement) {
                videoElement.style.display = videoEnabled ? 'block' : 'none';
            }
        });

        const micToggleBtn = backdrop.querySelector('#student-mic-toggle');
        let audioEnabled = true;
        micToggleBtn.addEventListener('click', () => {
            audioEnabled = !audioEnabled;
            if (localStream) {
                localStream.getAudioTracks().forEach(track => track.enabled = audioEnabled);
            }
            micToggleBtn.textContent = audioEnabled ? 'Mute Mic' : 'Unmute Mic';
            micToggleBtn.style.color = audioEnabled ? 'white' : '#f43f5e';
        });

        let currentSlide = -1;
        let lastChatLength = 0;
        const raiseHandBtn = backdrop.querySelector('#classroom-raise-hand');

        // Draw whiteboard canvas drawings
        const drawAllStrokes = (drawings) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (!drawings) return;
            drawings.forEach(stroke => {
                ctx.beginPath();
                ctx.strokeStyle = stroke.color;
                ctx.lineWidth = stroke.width;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                if (stroke.points && stroke.points.length > 0) {
                    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
                    for (let j = 1; j < stroke.points.length; j++) {
                        ctx.lineTo(stroke.points[j].x, stroke.points[j].y);
                    }
                    ctx.stroke();
                }
            });
        };

        // Sync local UI to local storage state
        const syncFromStorage = () => {
            const state = EduApp.db.getLiveClassState();

            // 1. Session Ended Overlay
            if (state.status !== 'live' || state.classId !== activeClass.id) {
                cleanup();
                backdrop.remove();
                document.body.style.overflow = '';
                
                // Show fullscreen end-class overlay
                const endOverlay = document.createElement('div');
                endOverlay.className = 'modal-backdrop active';
                endOverlay.style.zIndex = '10000';
                endOverlay.innerHTML = `
                    <div class="modal-container" style="max-width: 400px; text-align: center; padding: 40px 30px; border-radius: var(--radius-lg);">
                        <div style="font-size: 48px; margin-bottom: 20px;">🎓</div>
                        <h2 style="font-family: var(--font-heading); font-size: 22px; margin-bottom: 12px;">Class Has Ended</h2>
                        <p class="text-secondary" style="font-size: 14px; margin-bottom: 24px; line-height: 1.5;">The instructor has closed this live classroom session. All blackboard annotations and chat streams have been saved to progress logs.</p>
                        <button class="btn btn-primary" id="end-overlay-close-btn" style="width: 100%; padding: 12px; font-weight: 700;">Back to Dashboard</button>
                    </div>
                `;
                document.body.appendChild(endOverlay);
                endOverlay.querySelector('#end-overlay-close-btn').addEventListener('click', () => {
                    endOverlay.remove();
                    // Force refresh Student Home dashboard to clear live banner
                    EduApp.router.updateWorkspace();
                });
                return;
            }

            // 2. Slide Advancement
            if (state.currentSlide !== currentSlide) {
                currentSlide = state.currentSlide;
                if (slides[currentSlide]) {
                    backdrop.querySelector('#slide-title').textContent = slides[currentSlide].title;
                    backdrop.querySelector('#slide-description').innerHTML = slides[currentSlide].description.replace(/\\n/g, '<br/>');
                    backdrop.querySelector('#slide-index').textContent = `Slide ${currentSlide + 1} / ${slides.length}`;
                }
            }

            // 3. Drawings Redraw
            drawAllStrokes(state.drawings);

            // 4. Chat messages Sync
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

            // 5. Hand Raise button sync
            const handRaises = state.handRaises || [];
            const isHandRaised = handRaises.some(hr => hr.studentId === user.id);
            if (isHandRaised) {
                raiseHandBtn.textContent = 'Hand Raised';
                raiseHandBtn.style.color = '#fbbf24';
                raiseHandBtn.style.borderColor = '#fbbf24';
                raiseHandBtn.style.boxShadow = '0 0 10px rgba(251,191,36,0.4)';
            } else {
                raiseHandBtn.textContent = 'Raise Hand';
                raiseHandBtn.style.color = 'white';
                raiseHandBtn.style.borderColor = '#334155';
                raiseHandBtn.style.boxShadow = 'none';
            }

            // 6. Screen Share Overlay Sync
            let screenOverlay = backdrop.querySelector('#student-screen-share-overlay');
            if (state.isScreenSharing) {
                if (!screenOverlay) {
                    screenOverlay = document.createElement('div');
                    screenOverlay.id = 'student-screen-share-overlay';
                    screenOverlay.style.position = 'absolute';
                    screenOverlay.style.top = '0';
                    screenOverlay.style.left = '0';
                    screenOverlay.style.width = '100%';
                    screenOverlay.style.height = '100%';
                    screenOverlay.style.backgroundColor = '#0b0f19';
                    screenOverlay.style.zIndex = '30';
                    screenOverlay.style.display = 'flex';
                    screenOverlay.style.flexDirection = 'column';
                    screenOverlay.style.alignItems = 'center';
                    screenOverlay.style.justifyContent = 'center';
                    screenOverlay.style.gap = '16px';
                    screenOverlay.innerHTML = `
                        <div style="font-size: 40px; animation: pulse 1s infinite alternate;">🖥️</div>
                        <h3 style="font-family: var(--font-heading); font-size: 18px; color: #60a5fa;">Instructor is Sharing Screen</h3>
                        <p class="text-secondary" style="font-size: 12px; max-width: 300px; text-align: center; line-height: 1.5;">The presenter is currently sharing their screen/window. Whiteboard draw overlays are temporarily paused.</p>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="width: 8px; height: 8px; background-color: #34d399; border-radius: 50%; animation: pulse 0.5s infinite alternate;"></span>
                            <span style="font-size: 11px; font-weight: 700; color: #34d399; text-transform: uppercase;">Streaming Live</span>
                        </div>
                    `;
                    backdrop.querySelector('#whiteboard-slide').appendChild(screenOverlay);
                }
                screenOverlay.style.display = 'flex';
            } else {
                if (screenOverlay) {
                    screenOverlay.style.display = 'none';
                }
            }
        };

        // Hand Raise Button Event
        raiseHandBtn.addEventListener('click', () => {
            const state = EduApp.db.getLiveClassState();
            state.handRaises = state.handRaises || [];
            const isHandRaised = state.handRaises.some(hr => hr.studentId === user.id);
            
            if (!isHandRaised) {
                state.handRaises.push({
                    studentId: user.id,
                    studentName: user.name,
                    timestamp: Date.now()
                });
                EduApp.toast.show('You raised your hand.');
            } else {
                state.handRaises = state.handRaises.filter(hr => hr.studentId !== user.id);
                EduApp.toast.show('You lowered your hand.');
            }
            EduApp.db.updateLiveClassState({ handRaises: state.handRaises });
            syncFromStorage();
        });

        // Chat send trigger
        const sendChat = () => {
            const input = backdrop.querySelector('#classroom-chat-input');
            const val = input.value.trim();
            if (val) {
                const state = EduApp.db.getLiveClassState();
                state.chat = state.chat || [];
                state.chat.push({
                    sender: user.name,
                    message: val,
                    isHost: false,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });
                EduApp.db.updateLiveClassState({ chat: state.chat });
                syncFromStorage();
                input.value = '';
            }
        };

        // Bind chat buttons
        backdrop.querySelector('#classroom-send-chat').addEventListener('click', sendChat);
        backdrop.querySelector('#classroom-chat-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendChat();
        });

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
            clearInterval(stayInterval);
            saveStayTime();
            window.removeEventListener('beforeunload', onUnload);
            window.removeEventListener('storage', onStorageChange);
            
            // Award XP & Badge for attending live class (>= 10 seconds stay)
            if (staySeconds >= 10) {
                const alreadyAwardedKey = `edu_class_xp_awarded_${activeClass.id}_${user.id}`;
                if (!localStorage.getItem(alreadyAwardedKey)) {
                    localStorage.setItem(alreadyAwardedKey, 'true');
                    EduApp.db.awardXP(user.id, 100, `Attended Live Session: ${activeClass.title}`);
                    EduApp.db.awardBadge(user.id, 'Class Attendee');
                }
            }

            // Remove student from participants list
            const state = EduApp.db.getLiveClassState();
            state.participants = (state.participants || []).filter(p => p.studentId !== user.id);
            EduApp.db.updateLiveClassState({ participants: state.participants });
            
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
                localStream = null;
            }
        };

        hashListener = () => {
            cleanup();
            backdrop.remove();
            document.body.style.overflow = '';
        };
        window.addEventListener('hashchange', hashListener);

        // Leave Classroom
        backdrop.querySelector('#leave-class-btn').addEventListener('click', () => {
            cleanup();
            backdrop.remove();
            document.body.style.overflow = '';
            EduApp.toast.show('You left the classroom.');
        });

        // Initial sync call
        syncFromStorage();
    },    // View submitted student homework PDF
    launchHomeworkViewer(hw) {
        const dataURLtoBlob = (dataurl) => {
            const arr = dataurl.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new Blob([u8arr], { type: mime });
        };

        const readerBackdrop = document.createElement('div');
        readerBackdrop.style.position = 'fixed';
        readerBackdrop.style.top = '0';
        readerBackdrop.style.left = '0';
        readerBackdrop.style.width = '100vw';
        readerBackdrop.style.height = '100vh';
        readerBackdrop.style.backgroundColor = '#1e293b'; // PDF workspace background
        readerBackdrop.style.zIndex = '9999';
        readerBackdrop.style.display = 'flex';
        readerBackdrop.style.flexDirection = 'column';
        readerBackdrop.style.color = '#111827';
        readerBackdrop.id = 'hw-pdf-reader-overlay';

        // Content template based on assignment title
        let mockAnswersHtml = '';
        const titleLower = hw.title.toLowerCase();
        if (titleLower.includes('limit') || titleLower.includes('calculus')) {
            mockAnswersHtml = `
                <h3 style="font-size:15px; font-weight:700; margin-top:20px; margin-bottom:8px; color:var(--primary);">Question 1: Evaluate lim(x->3) (x^2 - 9)/(x - 3)</h3>
                <p style="font-family:monospace; background-color:var(--bg-main); padding:12px; border-radius:4px; border:1px solid var(--border); margin-bottom:16px; font-size:13px; color:var(--text-secondary);">
                    Solution:<br>
                    Factor the numerator: x^2 - 9 = (x - 3)(x + 3)<br>
                    Substitute: lim(x->3) (x-3)(x+3)/(x-3) = lim(x->3) (x+3)<br>
                    Direct substitution: 3 + 3 = 6.<br>
                    <strong>Answer: 6</strong>
                </p>

                <h3 style="font-size:15px; font-weight:700; margin-bottom:8px; color:var(--primary);">Question 2: Find the discontinuity of f(x) = 1/(x-2)</h3>
                <p style="font-family:monospace; background-color:var(--bg-main); padding:12px; border-radius:4px; border:1px solid var(--border); margin-bottom:16px; font-size:13px; color:var(--text-secondary);">
                    Solution:<br>
                    The function is undefined when denominator is zero.<br>
                    x - 2 = 0 => x = 2.<br>
                    So there is a point of discontinuity (vertical asymptote) at x = 2.<br>
                    <strong>Answer: x = 2</strong>
                </p>

                <h3 style="font-size:15px; font-weight:700; margin-bottom:8px; color:var(--primary);">Question 3: Solve lim(x->0) x * sin(1/x)</h3>
                <p style="font-family:monospace; background-color:var(--bg-main); padding:12px; border-radius:4px; border:1px solid var(--border); font-size:13px; color:var(--text-secondary);">
                    Solution:<br>
                    Use Squeeze Theorem:<br>
                    -1 <= sin(1/x) <= 1<br>
                    Multiply by |x|: -|x| <= x * sin(1/x) <= |x|<br>
                    Since lim(x->0) -|x| = 0 and lim(x->0) |x| = 0, by Squeeze Theorem, the limit is 0.<br>
                    <strong>Answer: 0</strong>
                </p>
            `;
        } else if (titleLower.includes('mechanics') || titleLower.includes('physics')) {
            mockAnswersHtml = `
                <h3 style="font-size:15px; font-weight:700; margin-top:20px; margin-bottom:8px; color:var(--primary);">Question 1: Calculate max height of projectile thrown at 20 m/s</h3>
                <p style="font-family:monospace; background-color:var(--bg-main); padding:12px; border-radius:4px; border:1px solid var(--border); margin-bottom:16px; font-size:13px; color:var(--text-secondary);">
                    Solution:<br>
                    Use kinematics: v^2 = u^2 - 2gh<br>
                    At max height, v = 0.<br>
                    0 = (20)^2 - 2 * 9.8 * h<br>
                    19.6 * h = 400 => h = 20.41 meters.<br>
                    Total height = 20.41 + 1.5 (initial) = 21.91 meters.<br>
                    <strong>Answer: 21.91m</strong>
                </p>

                <h3 style="font-size:15px; font-weight:700; margin-bottom:8px; color:var(--primary);">Question 2: Find acceleration of 5kg block on 30-degree incline (mu = 0.2)</h3>
                <p style="font-family:monospace; background-color:var(--bg-main); padding:12px; border-radius:4px; border:1px solid var(--border); font-size:13px; color:var(--text-secondary);">
                    Solution:<br>
                    Forces parallel to incline:<br>
                    F_gravity = m * g * sin(30) = 5 * 9.8 * 0.5 = 24.5 N<br>
                    F_friction = mu * m * g * cos(30) = 0.2 * 5 * 9.8 * 0.866 = 8.49 N<br>
                    Net Force = 24.5 - 8.49 = 16.01 N<br>
                    Acceleration a = F_net / m = 16.01 / 5 = 3.20 m/s^2.<br>
                    <strong>Answer: 3.20 m/s^2</strong>
                </p>
            `;
        } else { // default chemistry or others
            mockAnswersHtml = `
                <h3 style="font-size:15px; font-weight:700; margin-top:20px; margin-bottom:8px; color:var(--primary);">Question 1: Name CH3-CH(OH)-CH2-CH3</h3>
                <p style="font-family:monospace; background-color:var(--bg-main); padding:12px; border-radius:4px; border:1px solid var(--border); margin-bottom:16px; font-size:13px; color:var(--text-secondary);">
                    Solution:<br>
                    4 carbons parent chain = butane.<br>
                    Alcohol functional group (-OH) is on carbon 2.<br>
                    Name: butan-2-ol.<br>
                    <strong>Answer: butan-2-ol</strong>
                </p>

                <h3 style="font-size:15px; font-weight:700; margin-bottom:8px; color:var(--primary);">Question 2: Name 1,2-dimethylcyclohexane</h3>
                <p style="font-family:monospace; background-color:var(--bg-main); padding:12px; border-radius:4px; border:1px solid var(--border); font-size:13px; color:var(--text-secondary);">
                    Solution:<br>
                    6 carbons ring = cyclohexane.<br>
                    Methyl groups on carbon 1 and 2.<br>
                    <strong>Answer: 1,2-dimethylcyclohexane</strong>
                </p>
            `;
        }

        let contentHtml = '';
        let tempBlobUrl = null;

        if (hw.fileDataUrl) {
            try {
                const blob = dataURLtoBlob(hw.fileDataUrl);
                tempBlobUrl = URL.createObjectURL(blob);
                contentHtml = `
                    <iframe src="${tempBlobUrl}" style="width:100%; max-width:1000px; height:calc(100vh - 120px); border:none; border-radius:8px; box-shadow: 0 10px 30px rgba(0,0,0,0.4);" type="application/pdf"></iframe>
                `;
            } catch (e) {
                console.error("Error creating PDF Blob URL: ", e);
                contentHtml = `
                    <iframe src="${hw.fileDataUrl}" style="width:100%; max-width:1000px; height:calc(100vh - 120px); border:none; border-radius:8px; box-shadow: 0 10px 30px rgba(0,0,0,0.4);" type="application/pdf"></iframe>
                `;
            }
        } else {
            contentHtml = `
                <!-- A4 Sheet Paper Simulator -->
                <div style="width: 100%; max-width: 720px; background-color: white; border-radius: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); padding: 50px 60px; min-height: 800px; display: flex; flex-direction: column; position: relative;">
                    
                    <!-- Paper Header -->
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid var(--border); padding-bottom: 20px; margin-bottom: 30px; font-size:11px; text-transform:uppercase; color:var(--text-secondary); letter-spacing:1px; font-family:var(--font-heading);">
                        <div>Student Name: ${hw.studentName || hw.name}</div>
                        <div>Subject: ${hw.subject}</div>
                    </div>

                    <!-- Homework Title -->
                    <h2 style="font-family:var(--font-heading); font-size:22px; color:var(--text-primary); font-weight:800; margin-bottom:6px;">${hw.title}</h2>
                    <div style="font-size:12px; color:var(--text-secondary); margin-bottom:30px;">
                        Submitted on: ${hw.submittedAt ? new Date(hw.submittedAt).toLocaleString() : 'N/A'} &bull; File Size: ${hw.fileSize}
                    </div>

                    <!-- Answers content -->
                    <div style="flex: 1; font-size: 14px; color: var(--text-primary); line-height: 1.6;">
                        <p style="font-style:italic; color:var(--text-secondary); margin-bottom:24px;">The following text answers and mathematical steps were extracted directly from the uploaded PDF document:</p>
                        ${mockAnswersHtml}
                    </div>

                    <!-- Paper Footer -->
                    <div style="border-top: 1px solid var(--border); padding-top: 20px; margin-top: 40px; display:flex; justify-content:space-between; align-items:center; font-size: 11px; color: var(--text-muted);">
                        <span>CM Thakur Classes PDF Processing Engine</span>
                        <span>Page 1 of 1</span>
                    </div>

                </div>
            `;
        }

        readerBackdrop.innerHTML = `
            <!-- Header Bar -->
            <div style="padding: 14px 24px; border-bottom: 1px solid #1f2937; display: flex; justify-content: space-between; align-items: center; background-color: #0f172a; color: white;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--accent)" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    <span style="font-family: var(--font-heading); font-weight: 700; font-size: 15px;">Homework Submission Viewer</span>
                </div>
                <div style="font-size:13px; color:#94a3b8; display:flex; align-items:center; gap:16px;">
                    <span>Student: <strong>${hw.studentName || hw.name}</strong> &bull; File: <strong>${hw.fileName}</strong></span>
                    ${hw.fileDataUrl ? `
                        <button class="btn btn-primary" id="download-hw-pdf-btn" style="padding: 4px 10px; font-size:11px; font-weight:700; border-radius:4px; margin-left:8px; border:none; cursor:pointer;">
                            Download Original PDF
                        </button>
                    ` : ''}
                </div>
                <button class="btn btn-accent" id="close-hw-reader" style="padding: 6px 14px; font-size:13px; font-weight: 700; border-radius: 6px;">
                    Close Viewer
                </button>
            </div>

            <!-- Page Workspace Area -->
            <div style="flex: 1; overflow-y: auto; background-color: #2c3540; padding: 40px 20px; display: flex; justify-content: center; align-items: flex-start;">
                ${contentHtml}
            </div>
        `;

        document.body.appendChild(readerBackdrop);
        document.body.style.overflow = 'hidden';

        // Bind download action
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

        let hashListener;
        const closeViewer = () => {
            if (hashListener) window.removeEventListener('hashchange', hashListener);
            readerBackdrop.remove();
            document.body.style.overflow = '';
            if (tempBlobUrl) {
                URL.revokeObjectURL(tempBlobUrl);
            }
        };

        hashListener = () => {
            closeViewer();
        };
        window.addEventListener('hashchange', hashListener);

        readerBackdrop.querySelector('#close-hw-reader').addEventListener('click', closeViewer);
    },

    // Displays the modal to join a new batch via Batch ID
    showJoinBatchModal(studentId) {
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.id = 'join-batch-modal';

        modal.innerHTML = `
            <div class="modal-container" style="max-width: 420px; padding: 32px;">
                <button class="modal-close" id="join-batch-close-btn">&times;</button>
                
                <h2 style="font-size: 20px; font-family: var(--font-heading); margin-bottom: 8px; text-align: center;">Join New Batch</h2>
                <p class="text-secondary text-center" style="font-size: 13px; margin-bottom: 24px;">Enter the unique Batch ID provided by your instructor to enroll in the course.</p>
                
                <form id="join-batch-form" novalidate>
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label" for="join-batch-id">Batch ID</label>
                        <input class="form-input" type="text" id="join-batch-id" placeholder="e.g. cls_001" style="text-align: center; font-family: monospace; font-size: 15px; letter-spacing: 1px;" required>
                    </div>

                    <button class="btn btn-primary" type="submit" style="width: 100%; font-weight: 700; padding: 12px; font-size: 14px;">
                        Join Batch
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

        modal.querySelector('#join-batch-close-btn').addEventListener('click', hideModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideModal();
        });

        modal.querySelector('#join-batch-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const batchId = modal.querySelector('#join-batch-id').value.trim();
            if (!batchId) {
                EduApp.toast.show('Please enter a Batch ID.');
                return;
            }

            const classes = EduApp.db.getClasses();
            const targetClass = classes.find(c => c.id === batchId);

            if (!targetClass) {
                EduApp.toast.show('Invalid Batch ID. Please double-check and try again.');
                return;
            }

            // Check if already joined
            const user = EduApp.db.getCurrentUser();
            const enrolled = user.enrolledClasses || [];
            if (enrolled.includes(batchId)) {
                EduApp.toast.show('You are already enrolled in this batch.');
                return;
            }

            // Check if request is already pending
            const requests = EduApp.db.getJoinRequests();
            const pendingRequestExists = requests.some(r => r.studentId === studentId && r.classId === batchId && r.status === 'pending');
            if (pendingRequestExists) {
                EduApp.toast.show('You have already submitted a join request for this batch. Please wait for the teacher\'s approval.');
                return;
            }

            // Save join request to database
            const success = await EduApp.db.createJoinRequest(studentId, batchId);
            if (success) {
                EduApp.toast.show(`Join request sent! Waiting for teacher approval.`);
                hideModal();
                EduApp.router.updateWorkspace(); // Re-render student dashboard
            } else {
                EduApp.toast.show('Error submitting join request. Please try again.');
            }
        });
    }
};
