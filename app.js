// Ensure our global namespace exists
window.EduApp = window.EduApp || {};

// Global Avatar Generator (initial block letter with deterministic background color)
EduApp.getAvatarHtml = function(name, sizeStyle = 'width: 44px; height: 44px; font-size: 18px;') {
    const firstLetter = (name && typeof name === 'string' && name.length > 0) ? name.charAt(0).toUpperCase() : '?';
    let hash = 0;
    if (name) {
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
    }
    const colors = [
        'linear-gradient(135deg, #3b82f6, #1d4ed8)', // Blue
        'linear-gradient(135deg, #10b981, #047857)', // Green
        'linear-gradient(135deg, #8b5cf6, #6d28d9)', // Purple
        'linear-gradient(135deg, #f43f5e, #be123c)', // Rose
        'linear-gradient(135deg, #f59e0b, #b45309)', // Amber
        'linear-gradient(135deg, #06b6d4, #0891b2)', // Cyan
        'linear-gradient(135deg, #ec4899, #be185d)'  // Pink
    ];
    const colorIndex = Math.abs(hash) % colors.length;
    const background = colors[colorIndex];

    return `
        <div class="avatar-letter-circle" style="display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; color: #ffffff; font-weight: 800; font-family: var(--font-heading), sans-serif; background: ${background}; text-transform: uppercase; user-select: none; ${sizeStyle}">
            ${firstLetter}
        </div>
    `;
};

// Toast System
EduApp.toast = {
    show(message, duration = 3000) {
        let toast = document.getElementById('global-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast-msg';
            toast.id = 'global-toast';
            document.body.appendChild(toast);
        }
        
        toast.textContent = message;
        toast.classList.add('show');
        
        // Clear previous timeout if any
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        
        this.timeoutId = setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }
};

// Router and Session Control
EduApp.router = {
    // Current hash route
    currentHash: '',

    init() {
        // Handle initial load
        this.handleRouting();

        // Listen for route changes
        window.addEventListener('hashchange', () => {
            this.handleRouting();
        });

        // Listen for viewport resizing to adjust responsive header
        window.addEventListener('resize', () => {
            this.updateHeaderOnly();
        });

        // Listen to storage events to sync dashboards across tabs in real-time
        window.addEventListener('storage', (e) => {
            if (e.key === 'edu_live_class_state') {
                // Only trigger workspace refresh if the modal classroom simulator is not open
                if (!document.getElementById('classroom-simulator')) {
                    this.updateWorkspace();
                }
            }
        });
    },

    // Programmatically navigate to a route hash
    navigate(hash) {
        window.location.hash = hash;
    },

    // Check auth rules and perform routing
    handleRouting() {
        const hash = window.location.hash || '#landing';
        this.currentHash = hash;
        const currentUser = EduApp.db.getCurrentUser();

        // 1. Auth Guard Checks
        if (hash.startsWith('#student') || hash.startsWith('#teacher')) {
            // Unauthenticated user attempting to access dashboard
            if (!currentUser) {
                this.navigate('#landing');
                EduApp.toast.show('Please log in to access your dashboard.');
                EduApp.AuthModal.show('login');
                return;
            }
            
            // Student attempting to access Teacher route
            if (currentUser.role === 'student' && hash.startsWith('#teacher')) {
                this.navigate('#student/home');
                EduApp.toast.show('Access Denied: Diverting to Student dashboard.');
                return;
            }

            // Teacher attempting to access Student route
            if (currentUser.role === 'teacher' && hash.startsWith('#student')) {
                this.navigate('#teacher');
                EduApp.toast.show('Access Denied: Diverting to Teacher dashboard.');
                return;
            }
        } else if (hash === '#landing' || hash === '') {
            // Already logged in user navigating back to landing page -> auto redirect to dashboard
            if (currentUser) {
                if (currentUser.role === 'student') {
                    this.navigate('#student/home');
                } else if (currentUser.role === 'teacher') {
                    this.navigate('#teacher');
                }
                return;
            }
        }

        // 2. Render Workspace
        this.updateWorkspace();
    },

    // Refresh and draw the DOM structure based on route
    async updateWorkspace() {
        const appContainer = document.getElementById('app');
        if (!appContainer) return;
        
        // Synchronize local cache with backend server database
        if (typeof EduApp.db.syncCache === 'function') {
            await EduApp.db.syncCache();
        }
        
        // Clear viewport
        appContainer.innerHTML = '';

        const hash = this.currentHash || '#landing';
        const currentUser = EduApp.db.getCurrentUser();

        // Render standard Header (which adapts inside its component logic)
        const headerNode = EduApp.Header.render();
        appContainer.appendChild(headerNode);

        // Render Main views based on path
        if (hash === '#landing' || hash === '') {
            appContainer.classList.add('unauth-layout');
            const landingNode = EduApp.LandingPage.render();
            appContainer.appendChild(landingNode);
        } 
        else if (hash.startsWith('#student')) {
            appContainer.classList.remove('unauth-layout');
            
            // Determine active subview
            let subview = 'home';
            if (hash === '#student/progress') {
                subview = 'progress';
            } else if (hash === '#student/profile') {
                subview = 'profile';
            }

            const dashboardNode = EduApp.StudentDashboard.render(subview);
            appContainer.appendChild(dashboardNode);
        } 
        else if (hash.startsWith('#teacher')) {
            appContainer.classList.remove('unauth-layout');
            
            // Determine active subview
            let subview = 'home';
            if (hash === '#teacher/activity') {
                subview = 'activity';
            } else if (hash === '#teacher/profile') {
                subview = 'profile';
            } else if (hash === '#teacher/create-test') {
                subview = 'create-test';
            }

            if (subview === 'create-test') {
                const createTestNode = EduApp.TeacherCreateTest.render();
                appContainer.appendChild(createTestNode);
            } else {
                const dashboardNode = EduApp.TeacherDashboard.render(subview);
                appContainer.appendChild(dashboardNode);
            }
        }
        else if (hash === '#sets') {
            appContainer.classList.remove('unauth-layout');
            const setsNode = EduApp.SetsPage.render();
            appContainer.appendChild(setsNode);
        }
    },

    // Simple light re-render of Header on window resize to check responsiveness
    updateHeaderOnly() {
        const headerEl = document.querySelector('.nav-header');
        if (headerEl) {
            const newHeader = EduApp.Header.render();
            headerEl.replaceWith(newHeader);
        }
    }
};

// Global helper to show enrolled classmates/students in a batch modal overlay
EduApp.showEnrolledStudentsModal = function(classId, isTeacher) {
    const classes = EduApp.db.getClasses();
    const targetClass = classes.find(c => c.id === classId);
    if (!targetClass) return;

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.id = 'enrolled-students-modal';

    const renderList = () => {
        const enrolledStudents = EduApp.db.getUsers().filter(u => u.role === 'student' && u.enrolledClasses && u.enrolledClasses.includes(classId));
        
        let listHtml = '';
        if (enrolledStudents.length === 0) {
            listHtml = `<div style="text-align: center; padding: 32px; color: var(--text-secondary); font-style: italic;">No students enrolled in this batch yet.</div>`;
        } else {
            enrolledStudents.forEach(st => {
                listHtml += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border); background-color: var(--bg-main); border-radius: var(--radius-sm); margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            ${EduApp.getAvatarHtml(st.name, 'width: 36px; height: 36px; font-size: 16px; border: 1px solid var(--border);')}
                            <div>
                                <div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">${st.name}</div>
                                <div style="font-size: 11px; color: var(--text-secondary);">${st.email}</div>
                            </div>
                        </div>
                        ${isTeacher ? `
                            <button class="btn btn-secondary btn-remove-st" data-student-id="${st.id}" style="padding: 6px 12px; font-size: 11px; color: #f43f5e; border-color: rgba(244, 63, 94, 0.3);">
                                Remove
                            </button>
                        ` : ''}
                    </div>
                `;
            });
        }

        const listContainer = modal.querySelector('#students-list-container');
        if (listContainer) {
            listContainer.innerHTML = listHtml;

            // Bind remove triggers
            if (isTeacher) {
                listContainer.querySelectorAll('.btn-remove-st').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const studentId = btn.getAttribute('data-student-id');
                        const studentObj = enrolledStudents.find(s => s.id === studentId);
                        const studentName = studentObj ? studentObj.name : 'Student';
                        
                        if (confirm(`Are you sure you want to remove ${studentName} from the batch "${targetClass.title}"?`)) {
                            const success = EduApp.db.removeStudentFromClass(studentId, classId);
                            if (success) {
                                EduApp.toast.show(`${studentName} removed from batch.`);
                                renderList(); // Re-render local list
                                EduApp.router.updateWorkspace(); // Refresh main dashboard background
                            } else {
                                EduApp.toast.show('Error removing student.');
                            }
                        }
                    });
                });
            }
        }
    };

    modal.innerHTML = `
        <div class="modal-container" style="max-width: 480px; padding: 32px;">
            <button class="modal-close" id="students-close-btn">&times;</button>
            <h2 style="font-size: 20px; font-family: var(--font-heading); margin-bottom: 8px; text-align: center;">Enrolled Students</h2>
            <p class="text-secondary text-center" style="font-size: 13px; margin-bottom: 24px;">Batch: <strong>${targetClass.title}</strong></p>
            
            <div id="students-list-container" style="max-height: 300px; overflow-y: auto; margin-bottom: 24px; padding-right: 4px;"></div>
            
            <div style="display: flex; justify-content: flex-end;">
                <button class="btn btn-primary" id="students-ok-btn" style="padding: 8px 20px; font-size: 13px;">Done</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);

    // Initial render
    renderList();

    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 250);
    };

    modal.querySelector('#students-close-btn').addEventListener('click', closeModal);
    modal.querySelector('#students-ok-btn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
};

// Start the application after all script modules load
document.addEventListener('DOMContentLoaded', () => {
    EduApp.router.init();
});
