window.EduApp = window.EduApp || {};

EduApp.LandingPage = {
    render() {
        const container = document.createElement('div');
        container.className = 'landing-page-wrapper';
        
        container.innerHTML = `
            <!-- Hero Section -->
            <section class="hero-sec" id="hero-section">
                <div class="container">
                    <h1>Unlock Your Potential with <span>Personalized Learning</span></h1>
                    <p>Connect with expert tutors, join live interactive classes, track your exam progress, and re-watch recorded lectures anytime—all from one cohesive dashboard.</p>
                    <div class="hero-buttons">
                        <button class="btn btn-primary" id="hero-cta-btn">Get Started</button>
                        <button class="btn btn-secondary" id="hero-secondary-btn">Explore Features</button>
                    </div>
                </div>
            </section>

            <!-- About Section / Platform Stats -->
            <section class="about-sec" id="about-section" style="padding: 60px 0; background-color: var(--bg-surface); text-align: center; border-bottom: 1px solid var(--border);">
                <div class="container">
                    <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 30px;">
                        <div>
                            <h2 style="font-size: 36px; color: var(--primary); font-family: var(--font-heading);">15K+</h2>
                            <p class="text-secondary" style="font-size: 14px; font-weight: 500;">Enrolled Students</p>
                        </div>
                        <div>
                            <h2 style="font-size: 36px; color: var(--primary); font-family: var(--font-heading);">200+</h2>
                            <p class="text-secondary" style="font-size: 14px; font-weight: 500;">Expert Instructors</p>
                        </div>
                        <div>
                            <h2 style="font-size: 36px; color: var(--primary); font-family: var(--font-heading);">98%</h2>
                            <p class="text-secondary" style="font-size: 14px; font-weight: 500;">Satisfaction Rate</p>
                        </div>
                        <div>
                            <h2 style="font-size: 36px; color: var(--primary); font-family: var(--font-heading);">120+</h2>
                            <p class="text-secondary" style="font-size: 14px; font-weight: 500;">Course Modules</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Features Grid Section -->
            <section class="features-sec" id="features-section">
                <div class="container">
                    <h2 class="sec-title">Tailored for Academic Excellence</h2>
                    <p class="sec-subtitle">Our platform brings together the absolute best educational tools to optimize learning outcomes and keep you motivated.</p>
                    
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/></svg>
                            </div>
                            <h3>Live Interactive Classrooms</h3>
                            <p>Attend scheduled batch lectures. Our conditional interface highlights class joining links exactly when they go live, eliminating dashboard clutter.</p>
                        </div>
                        
                        <div class="feature-card">
                            <div class="feature-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                            </div>
                            <h3>Recorded Lecture Archives</h3>
                            <p>Never fall behind. Access a catalog of recorded sessions, download class notes, homework sheets, and presentation slides at your own pace.</p>
                        </div>
                        
                        <div class="feature-card">
                            <div class="feature-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                            </div>
                            <h3>Comprehensive Testing</h3>
                            <p>Verify your mastery. Take active assignments on the platform, submit your answers instantly, and review detailed diagnostic reports of your past results.</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- How It Works Section -->
            <section class="how-it-works" id="how-it-works-section">
                <div class="container">
                    <h2 class="sec-title">How It Works</h2>
                    <p class="sec-subtitle">Getting top-tier tutoring and structuring your homework takes only three simple steps.</p>
                    
                    <div class="steps-container">
                        <div class="step-card">
                            <div class="step-number">1</div>
                            <h3>Create Your Account</h3>
                            <p>Sign up, choose your learning workspace (Student or Teacher), and configure your initial study goals and dashboard avatar.</p>
                        </div>
                        
                        <div class="step-card">
                            <div class="step-number">2</div>
                            <h3>Enroll in Live Batches</h3>
                            <p>Join scheduled classes directly from your main dashboard tab. The dynamic portal will show the join banner 1 hour before start.</p>
                        </div>
                        
                        <div class="step-card">
                            <div class="step-number">3</div>
                            <h3>Access Lecture Records & Tests</h3>
                            <p>Re-watch older lessons, view tutor slides, and finish tests to build your dashboard progress history.</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Footer -->
            <footer>
                <div class="container">
                    <div class="footer-logo" style="display: flex; align-items: center; gap: 10px; text-transform: uppercase;">
                        <svg viewBox="0 0 24 24" width="32" height="32" style="display: block;">
                            <defs>
                                <linearGradient id="logo-grad-footer" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stop-color="#F43F5E" />
                                    <stop offset="100%" stop-color="#FB923C" />
                                </linearGradient>
                            </defs>
                            <circle cx="12" cy="12" r="10" fill="url(#logo-grad-footer)" />
                            <path d="M14.5 8.5 A3.5 3.5 0 1 0 14.5 15.5" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" />
                        </svg>
                        CMTHAKUR<span>CLASSES</span>
                    </div>
                    <ul class="footer-nav">
                        <li><a href="#about" id="footer-about-link">About</a></li>
                        <li><a href="#features" id="footer-features-link">Features</a></li>
                        <li><a href="#how" id="footer-how-link">How it Works</a></li>
                    </ul>
                    <div class="copyright">
                        &copy; 2026 CM Thakur Classes. Created for Academic Excellence. All rights reserved.
                    </div>
                </div>
            </footer>
        `;

        // Bind events
        container.querySelector('#hero-cta-btn').addEventListener('click', () => {
            EduApp.AuthModal.show('signup');
        });

        container.querySelector('#hero-secondary-btn').addEventListener('click', () => {
            const el = container.querySelector('#features-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        });

        // Setup footer anchor links
        const setupFooterScroll = (linkId, sectionId) => {
            container.querySelector(linkId).addEventListener('click', (e) => {
                e.preventDefault();
                const section = container.querySelector('#' + sectionId);
                if (section) section.scrollIntoView({ behavior: 'smooth' });
            });
        };

        setupFooterScroll('#footer-about-link', 'about-section');
        setupFooterScroll('#footer-features-link', 'features-section');
        setupFooterScroll('#footer-how-link', 'how-it-works-section');

        return container;
    }
};
