window.EduApp = window.EduApp || {};

EduApp.Header = {
    render() {
        const user = EduApp.db.getCurrentUser();
        const header = document.createElement('header');
        header.className = 'nav-header';
        
        let actionsHtml = '';
        if (user) {
            actionsHtml = `
                <div class="student-profile-summary" style="cursor: pointer; margin-right: 12px;" id="header-profile-btn">
                    ${EduApp.getAvatarHtml(user.name, 'width: 44px; height: 44px; font-size: 18px; border: 2px solid var(--primary);')}
                    <span class="student-name-label" style="display: none; @media(min-width: 600px) { display: inline; }">${user.name}</span>
                </div>
                <button class="btn btn-secondary" id="logout-btn" style="padding: 8px 16px;">Log Out</button>
            `;
        } else {
            actionsHtml = `
                <button class="btn btn-secondary" id="login-nav-btn">Log In</button>
                <button class="btn btn-primary" id="signup-nav-btn">Sign Up</button>
            `;
        }
        
        let navLinksHtml = '';
        if (user) {
            navLinksHtml = `
                <li><a href="#dashboard" class="nav-link" id="nav-dashboard-link">Dashboard</a></li>
                <li><a href="#sets" class="nav-link" id="nav-sets-link">Sets</a></li>
            `;
        } else {
            navLinksHtml = `
                <li><a href="#about" class="nav-link" id="nav-about-link">About</a></li>
                <li><a href="#features" class="nav-link" id="nav-features-link">Features</a></li>
                <li><a href="#how" class="nav-link" id="nav-how-link">How it Works</a></li>
                <li><a href="#sets" class="nav-link" id="nav-sets-link">Sets</a></li>
            `;
        }

        header.innerHTML = `
            <div class="container">
                <div class="logo" id="logo-btn">
                    <div class="logo-icon">C</div>
                    cmthakur<span>classes</span>
                </div>
                <ul class="nav-links">
                    ${navLinksHtml}
                </ul>
                <div class="nav-actions">
                    ${actionsHtml}
                </div>
            </div>
        `;

        // Bind events
        header.querySelector('#logo-btn').addEventListener('click', () => {
            if (user) {
                if (user.role === 'student') {
                    EduApp.router.navigate('#student/home');
                } else {
                    EduApp.router.navigate('#teacher');
                }
            } else {
                EduApp.router.navigate('#landing');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });

        // Sets link binding
        const setsLink = header.querySelector('#nav-sets-link');
        if (setsLink) {
            setsLink.addEventListener('click', (e) => {
                e.preventDefault();
                EduApp.router.navigate('#sets');
            });
        }

        // Dashboard link binding (if logged in)
        const dashboardLink = header.querySelector('#nav-dashboard-link');
        if (dashboardLink) {
            dashboardLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (user.role === 'student') {
                    EduApp.router.navigate('#student/home');
                } else {
                    EduApp.router.navigate('#teacher');
                }
            });
        }

        // Setup smooth scroll for marketing page anchors
        const setupScroll = (linkId, sectionId) => {
            const linkEl = header.querySelector(linkId);
            if (linkEl) {
                linkEl.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (window.location.hash !== '#landing' && window.location.hash !== '') {
                        EduApp.router.navigate('#landing');
                        // Wait a tiny bit for render to finish
                        setTimeout(() => {
                            const section = document.getElementById(sectionId);
                            if (section) section.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                    } else {
                        const section = document.getElementById(sectionId);
                        if (section) section.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            }
        };

        if (!user) {
            setupScroll('#nav-about-link', 'about-section');
            setupScroll('#nav-features-link', 'features-section');
            setupScroll('#nav-how-link', 'how-it-works-section');
        }

        if (user) {
            header.querySelector('#logout-btn').addEventListener('click', () => {
                EduApp.db.setCurrentUser(null);
                EduApp.router.navigate('#landing');
                EduApp.toast.show('Logged out successfully.');
            });
            header.querySelector('#header-profile-btn').addEventListener('click', () => {
                if (user.role === 'student') {
                    EduApp.router.navigate('#student/profile');
                } else if (user.role === 'teacher') {
                    EduApp.router.navigate('#teacher/profile');
                }
            });
        } else {
            header.querySelector('#login-nav-btn').addEventListener('click', () => {
                EduApp.AuthModal.show('login');
            });
            header.querySelector('#signup-nav-btn').addEventListener('click', () => {
                EduApp.AuthModal.show('signup');
            });
        }
        
        return header;
    }
};
