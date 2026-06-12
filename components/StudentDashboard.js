window.EduApp = window.EduApp || {};

EduApp.StudentDashboard = {
    // The current active subview. Defaults to 'home'.
    activeTab: 'home',

    render(subview = 'home') {
        this.activeTab = subview;
        const container = document.createElement('div');
        container.className = 'container dashboard-container';
        
        container.innerHTML = `
            <!-- Top Header Tab (Avatar on left, dynamic greeting on right) -->
            <div id="dashboard-header-tab"></div>

            <!-- Subview content display viewport -->
            <div id="dashboard-subview-viewport" style="margin-bottom: 40px;"></div>

            <!-- Sticky Horizontal Floating Bottom Nav Bar -->
            <nav class="bottom-nav-bar">
                <div class="bottom-nav-item ${this.activeTab === 'home' ? 'active' : ''}" id="nav-btn-home">
                    <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    <span>Home</span>
                </div>
                <div class="bottom-nav-item ${this.activeTab === 'progress' ? 'active' : ''}" id="nav-btn-progress">
                    <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 20V10"></path>
                        <path d="M18 20V4"></path>
                        <path d="M6 20v-4"></path>
                    </svg>
                    <span>Progress</span>
                </div>
                <div class="bottom-nav-item ${this.activeTab === 'profile' ? 'active' : ''}" id="nav-btn-profile">
                    <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>Profile</span>
                </div>
            </nav>
        `;

        // Render top header and subview inside viewport after mounting,
        // or we can do it directly on this container.
        const headerTab = container.querySelector('#dashboard-header-tab');
        const viewport = container.querySelector('#dashboard-subview-viewport');

        // Render header tab content
        headerTab.appendChild(this.renderHeaderTab());

        // Render subview content
        if (this.activeTab === 'home') {
            viewport.appendChild(EduApp.StudentHome.render());
        } else if (this.activeTab === 'progress') {
            viewport.appendChild(EduApp.StudentProgress.render());
        } else if (this.activeTab === 'profile') {
            viewport.appendChild(EduApp.StudentProfile.render());
        }

        // Mount the floating AI Study Companion widget globally
        if (EduApp.AIStudyCompanion) {
            container.appendChild(EduApp.AIStudyCompanion.render());
        }

        // Add event listeners to bottom nav buttons
        container.querySelector('#nav-btn-home').addEventListener('click', () => {
            EduApp.router.navigate('#student/home');
        });
        container.querySelector('#nav-btn-progress').addEventListener('click', () => {
            EduApp.router.navigate('#student/progress');
        });
        container.querySelector('#nav-btn-profile').addEventListener('click', () => {
            EduApp.router.navigate('#student/profile');
        });

        return container;
    },

    // Sub-renderer for the Student top header tab
    renderHeaderTab() {
        const user = EduApp.db.getCurrentUser() || { name: 'Student', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256', grade: '12th Grade' };
        
        const headerTabNode = document.createElement('div');
        headerTabNode.className = 'student-header-tab';

        // Calculate dynamic time-of-day greeting
        const greeting = this.getTimeOfDayGreeting();

        const xp = user.xp || 0;
        const level = user.level || 1;
        const badges = user.badges || [];
        
        const badgeIcons = {
            'Perfect Score': '💯',
            'Active Learner': '🚀',
            'Class Attendee': '🎓',
            'Homework Hero': '📝',
            'Scholar': '🏆'
        };

        const badgesHtml = badges.map(b => `
            <span class="badge-pill" title="${b}">
                ${badgeIcons[b] || '🏅'} ${b}
            </span>
        `).join('');

        const xpProgress = ((xp % 500) / 500) * 100;
        const nextLevelXp = 500 - (xp % 500);

        headerTabNode.innerHTML = `
            <div class="student-profile-summary">
                ${EduApp.getAvatarHtml(user.name, 'width: 44px; height: 44px; font-size: 18px; border: 2px solid var(--primary);')}
                <div>
                    <div class="student-name-label">${user.name}</div>
                    <span class="student-grade-badge">${user.grade || 'Student'}</span>
                </div>
            </div>
            
            <div class="gamification-header-card">
                <div class="gamification-card-header">
                    <span>🌟 Level ${level}</span>
                    <span class="gamification-xp-total">${xp} XP</span>
                </div>
                <div class="xp-progress-track">
                    <div class="xp-progress-bar" style="width: ${xpProgress}%;"></div>
                </div>
                <div class="xp-remaining-text">${nextLevelXp} XP to Level ${level + 1}</div>
                <div class="badges-wrapper">
                    ${badgesHtml || '<span class="no-badges-text">No badges earned yet</span>'}
                </div>
            </div>

            <div class="dynamic-greeting">
                ${greeting}, <span style="color: var(--primary);">${user.name.split(' ')[0]}</span>!
            </div>
        `;

        return headerTabNode;
    },

    // Computes dynamic greeting text
    getTimeOfDayGreeting() {
        const hours = new Date().getHours();
        if (hours < 12) {
            return 'Good morning';
        } else if (hours < 17) {
            return 'Good afternoon';
        } else {
            return 'Good evening';
        }
    }
};
