window.EduApp = window.EduApp || {};

EduApp.TeacherDashboard = {
    // Current active subview. Defaults to 'home'.
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
                <div class="bottom-nav-item ${this.activeTab === 'activity' ? 'active' : ''}" id="nav-btn-activity">
                    <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                        <line x1="9" y1="9" x2="15" y2="9"></line>
                        <line x1="9" y1="13" x2="15" y2="13"></line>
                        <line x1="9" y1="17" x2="15" y2="17"></line>
                    </svg>
                    <span>Activity</span>
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

        const headerTab = container.querySelector('#dashboard-header-tab');
        const viewport = container.querySelector('#dashboard-subview-viewport');

        // Render header tab content
        headerTab.appendChild(this.renderHeaderTab());

        // Render subview content
        if (this.activeTab === 'home') {
            viewport.appendChild(EduApp.TeacherHome.render());
        } else if (this.activeTab === 'activity') {
            viewport.appendChild(EduApp.TeacherStudentActivity.render());
        } else if (this.activeTab === 'profile') {
            viewport.appendChild(EduApp.TeacherProfile.render());
        }

        // Add event listeners to bottom nav buttons (native bindings)
        container.querySelector('#nav-btn-home').addEventListener('click', () => {
            EduApp.router.navigate('#teacher');
        });
        container.querySelector('#nav-btn-activity').addEventListener('click', () => {
            EduApp.router.navigate('#teacher/activity');
        });
        container.querySelector('#nav-btn-profile').addEventListener('click', () => {
            EduApp.router.navigate('#teacher/profile');
        });

        return container;
    },

    // Sub-renderer for the Teacher top header tab
    renderHeaderTab() {
        const user = EduApp.db.getCurrentUser() || { name: 'Teacher', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256' };
        
        const headerTabNode = document.createElement('div');
        headerTabNode.className = 'student-header-tab'; // Reuse css classes for consistency

        // Calculate dynamic time-of-day greeting
        const greeting = this.getTimeOfDayGreeting();

        headerTabNode.innerHTML = `
            <div class="student-profile-summary">
                ${EduApp.getAvatarHtml(user.name, 'width: 44px; height: 44px; font-size: 18px; border: 2px solid var(--primary);')}
                <div>
                    <div class="student-name-label">${user.name}</div>
                    <span class="student-grade-badge" style="background-color: var(--accent-hover); color: white;">Educator</span>
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
