window.EduApp = window.EduApp || {};

EduApp.AuthModal = {
    // Current active mode: 'login' or 'signup'
    mode: 'login',
    // Current selected role in modal: 'student' or 'teacher'
    role: 'student',

    render() {
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.id = 'auth-modal-backdrop';

        backdrop.innerHTML = `
            <div class="modal-container">
                <button class="modal-close" id="modal-close-btn">&times;</button>
                
                <div class="modal-tabs">
                    <div class="modal-tab ${this.mode === 'login' ? 'active' : ''}" id="tab-login">Log In</div>
                    <div class="modal-tab ${this.mode === 'signup' ? 'active' : ''}" id="tab-signup">Sign Up</div>
                </div>

                <div class="error-message" id="auth-error-msg"></div>

                <form id="auth-form" novalidate>
                    <div class="form-group" id="name-group" style="display: ${this.mode === 'signup' ? 'block' : 'none'};">
                        <label class="form-label" for="auth-name">Full Name</label>
                        <input class="form-input" type="text" id="auth-name" placeholder="Alex Morgan">
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="auth-email">Email Address</label>
                        <input class="form-input" type="email" id="auth-email" placeholder="student1@edu.com" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="auth-password">Password</label>
                        <input class="form-input" type="password" id="auth-password" placeholder="••••••••" required>
                    </div>

                    <div class="form-group" id="role-group">
                        <label class="form-label">I am registering/logging in as a:</label>
                        <div class="role-selector">
                            <div class="role-option ${this.role === 'student' ? 'active' : ''}" id="role-student">Student</div>
                            <div class="role-option ${this.role === 'teacher' ? 'active' : ''}" id="role-teacher">Teacher</div>
                        </div>
                    </div>

                    <button class="btn btn-primary" type="submit" id="auth-submit-btn" style="width: 100%; margin-top: 10px;">
                        ${this.mode === 'login' ? 'Log In' : 'Create Account'}
                    </button>
                </form>

                <div style="margin-top: 20px; font-size: 12px; color: var(--text-secondary); text-align: center; border-top: 1px dashed var(--border); padding-top: 15px;">
                    <p><strong>Demo Credentials:</strong></p>
                    <p style="margin-top: 4px;">Student 1: <code style="background-color: var(--primary-light); padding: 2px 4px; border-radius: 4px; color: var(--primary);">student1@edu.com</code> / <code style="background-color: var(--primary-light); padding: 2px 4px; border-radius: 4px; color: var(--primary);">password</code></p>
                    <p style="margin-top: 4px;">Student 2: <code style="background-color: var(--primary-light); padding: 2px 4px; border-radius: 4px; color: var(--primary);">student2@edu.com</code> / <code style="background-color: var(--primary-light); padding: 2px 4px; border-radius: 4px; color: var(--primary);">password</code></p>
                    <p style="margin-top: 4px;">Teacher: <code style="background-color: var(--primary-light); padding: 2px 4px; border-radius: 4px; color: var(--primary);">teacher@edu.com</code> / <code style="background-color: var(--primary-light); padding: 2px 4px; border-radius: 4px; color: var(--primary);">password</code></p>
                </div>
            </div>
        `;

        // Bind events
        const closeBtn = backdrop.querySelector('#modal-close-btn');
        closeBtn.addEventListener('click', () => this.hide());

        // Close on backdrop click
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) this.hide();
        });

        // Tabs toggle
        const tabLogin = backdrop.querySelector('#tab-login');
        const tabSignup = backdrop.querySelector('#tab-signup');
        const nameGroup = backdrop.querySelector('#name-group');
        const submitBtn = backdrop.querySelector('#auth-submit-btn');
        const errorMsg = backdrop.querySelector('#auth-error-msg');

        const setMode = (newMode) => {
            this.mode = newMode;
            errorMsg.style.display = 'none';
            if (this.mode === 'login') {
                tabLogin.classList.add('active');
                tabSignup.classList.remove('active');
                nameGroup.style.display = 'none';
                submitBtn.textContent = 'Log In';
            } else {
                tabLogin.classList.remove('active');
                tabSignup.classList.add('active');
                nameGroup.style.display = 'block';
                submitBtn.textContent = 'Create Account';
            }
        };

        tabLogin.addEventListener('click', () => setMode('login'));
        tabSignup.addEventListener('click', () => setMode('signup'));

        // Role select
        const roleStudent = backdrop.querySelector('#role-student');
        const roleTeacher = backdrop.querySelector('#role-teacher');

        const setRole = (newRole) => {
            this.role = newRole;
            if (this.role === 'student') {
                roleStudent.classList.add('active');
                roleTeacher.classList.remove('active');
            } else {
                roleStudent.classList.remove('active');
                roleTeacher.classList.add('active');
            }
        };

        roleStudent.addEventListener('click', () => setRole('student'));
        roleTeacher.addEventListener('click', () => setRole('teacher'));

        // Submit form
        const form = backdrop.querySelector('#auth-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMsg.style.display = 'none';

            const emailInput = backdrop.querySelector('#auth-email');
            const passwordInput = backdrop.querySelector('#auth-password');
            const nameInput = backdrop.querySelector('#auth-name');

            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            const name = nameInput.value.trim();

            if (!email || !password) {
                errorMsg.textContent = 'Please fill in all required fields.';
                errorMsg.style.display = 'block';
                return;
            }

            if (this.mode === 'signup' && !name) {
                errorMsg.textContent = 'Please enter your full name.';
                errorMsg.style.display = 'block';
                return;
            }

            try {
                if (this.mode === 'signup') {
                    // Create account
                    const user = await EduApp.db.registerUser(name, email, password, this.role);
                    EduApp.db.setCurrentUser(user);
                    this.hide();
                    EduApp.toast.show(`Account created! Welcome, ${user.name}.`);
                    
                    // Route
                    if (user.role === 'student') {
                        EduApp.router.navigate('#student/home');
                    } else {
                        EduApp.router.navigate('#teacher');
                    }
                } else {
                    // Log In
                    const user = await EduApp.db.authenticate(email, password);
                    if (user) {
                        this.hide();
                        EduApp.toast.show(`Logged in as ${user.name}`);
                        
                        // Route
                        if (user.role === 'student') {
                            EduApp.router.navigate('#student/home');
                        } else {
                            EduApp.router.navigate('#teacher');
                        }
                    } else {
                        errorMsg.textContent = 'Invalid email or password.';
                        errorMsg.style.display = 'block';
                    }
                }
            } catch (err) {
                errorMsg.textContent = err.message;
                errorMsg.style.display = 'block';
            }
        });

        return backdrop;
    },

    show(mode = 'login') {
        this.mode = mode;
        
        // Remove existing if any
        const existing = document.getElementById('auth-modal-backdrop');
        if (existing) {
            existing.remove();
            if (this.hashListener) {
                window.removeEventListener('hashchange', this.hashListener);
            }
        }

        const modalNode = this.render();
        document.body.appendChild(modalNode);

        // Close on hash change
        this.hashListener = () => {
            this.hide();
        };
        window.addEventListener('hashchange', this.hashListener);

        // Force reflow and add active class
        setTimeout(() => {
            modalNode.classList.add('active');
        }, 10);
    },

    hide() {
        if (this.hashListener) {
            window.removeEventListener('hashchange', this.hashListener);
            this.hashListener = null;
        }
        const modal = document.getElementById('auth-modal-backdrop');
        if (modal) {
            modal.classList.remove('active');
            // Remove from DOM after transition finishes
            setTimeout(() => {
                modal.remove();
            }, 250);
        }
    }
};
