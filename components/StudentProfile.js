window.EduApp = window.EduApp || {};

EduApp.StudentProfile = {
    render() {
        const user = EduApp.db.getCurrentUser() || {
            name: 'Student One',
            email: 'student1@edu.com',
            avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=StudentOne',
            grade: '6th Grade',
            goals: 'Master Class 6 Math concepts and prepare for exams.',
            preferences: {
                emailAlerts: true,
                classReminders: true,
                weeklyReport: false
            }
        };

        const container = document.createElement('div');
        container.className = 'profile-layout';

        container.innerHTML = `
            <!-- Sidebar -->
            <div class="profile-sidebar">
                <div id="profile-avatar-container" style="margin-bottom: 16px;">
                    ${EduApp.getAvatarHtml(user.name, 'width: 120px; height: 120px; font-size: 48px; border: 3px solid var(--primary);')}
                </div>
                <h2 class="profile-sidebar-name" id="profile-sidebar-display-name">${user.name}</h2>
                <div class="profile-sidebar-email">${user.email}</div>
            </div>

            <!-- Fields Column -->
            <div class="profile-fields-container">
                
                <!-- Personal Details Card -->
                <div class="profile-section-card">
                    <h3>Personal Details</h3>
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                        <div class="form-group">
                            <label class="form-label" for="profile-name-input">Full Name</label>
                            <input class="form-input" type="text" id="profile-name-input" value="${user.name}">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="profile-email-input">Email Address</label>
                            <input class="form-input" type="email" id="profile-email-input" value="${user.email}">
                        </div>
                        <div class="form-group" style="grid-column: span 1;">
                            <label class="form-label" for="profile-grade-select">Academic Level</label>
                            <select class="form-input" id="profile-grade-select">
                                <option value="5th Grade" ${user.grade === '5th Grade' ? 'selected' : ''}>5th Grade</option>
                                <option value="6th Grade" ${user.grade === '6th Grade' ? 'selected' : ''}>6th Grade</option>
                                <option value="7th Grade" ${user.grade === '7th Grade' ? 'selected' : ''}>7th Grade</option>
                                <option value="8th Grade" ${user.grade === '8th Grade' ? 'selected' : ''}>8th Grade</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Academic Goals Card -->
                <div class="profile-section-card">
                    <h3>Academic & Career Goals</h3>
                    <div class="form-group" style="margin-bottom:0;">
                        <label class="form-label" for="profile-goals-input">Study Objectives</label>
                        <textarea class="form-input" id="profile-goals-input" rows="4" style="resize:vertical; line-height:1.5;">${user.goals || ''}</textarea>
                    </div>
                </div>

                <!-- Notification Preferences Card -->
                <div class="profile-section-card">
                    <h3>Notification Preferences</h3>
                    <div style="display:flex; flex-direction:column; gap: 14px;">
                        <div class="pref-toggle-row">
                            <div class="pref-toggle-info">
                                <span class="pref-title">Email Alerts</span>
                                <span class="pref-desc">Receive grading notifications and syllabus updates via email.</span>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="pref-email" ${user.preferences?.emailAlerts ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                        </div>
                        
                        <div class="pref-toggle-row" style="border-top:1px solid var(--border); padding-top:14px;">
                            <div class="pref-toggle-info">
                                <span class="pref-title">Live Class Reminders</span>
                                <span class="pref-desc">Get browser notifications 15 minutes before your batch class goes live.</span>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="pref-reminders" ${user.preferences?.classReminders ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                        </div>

                        <div class="pref-toggle-row" style="border-top:1px solid var(--border); padding-top:14px;">
                            <div class="pref-toggle-info">
                                <span class="pref-title">Weekly Growth Report</span>
                                <span class="pref-desc">Receive a personalized summary of study times and quiz grades.</span>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="pref-weekly" ${user.preferences?.weeklyReport ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Save Action Buttons -->
                <div style="display:flex; justify-content:flex-end; gap:12px; margin-bottom: 20px;">
                    <button class="btn btn-secondary" id="profile-cancel-btn">Reset Fields</button>
                    <button class="btn btn-primary" id="profile-save-btn">Save Profile Settings</button>
                </div>
            </div>
        `;

        // Initials avatar is dynamic based on user name

        // Reset Fields
        container.querySelector('#profile-cancel-btn').addEventListener('click', () => {
            EduApp.router.updateWorkspace();
            EduApp.toast.show('Profile changes reset.');
        });

        // Save profile logic
        container.querySelector('#profile-save-btn').addEventListener('click', () => {
            const name = container.querySelector('#profile-name-input').value.trim();
            const email = container.querySelector('#profile-email-input').value.trim();
            const grade = container.querySelector('#profile-grade-select').value;
            const goals = container.querySelector('#profile-goals-input').value.trim();
            const emailAlerts = container.querySelector('#pref-email').checked;
            const classReminders = container.querySelector('#pref-reminders').checked;
            const weeklyReport = container.querySelector('#pref-weekly').checked;

            if (!name || !email) {
                EduApp.toast.show('Name and email cannot be blank!');
                return;
            }

            // Update user properties
            user.name = name;
            user.email = email;
            user.grade = grade;
            user.goals = goals;
            user.preferences = {
                emailAlerts,
                classReminders,
                weeklyReport
            };

            // Save to database
            EduApp.db.saveUser(user);

            // Update UI elements in workspace
            container.querySelector('#profile-sidebar-display-name').textContent = name;
            const avatarContainer = container.querySelector('#profile-avatar-container');
            if (avatarContainer) {
                avatarContainer.innerHTML = EduApp.getAvatarHtml(name, 'width: 120px; height: 120px; font-size: 48px; border: 3px solid var(--primary);');
            }
            EduApp.toast.show('Profile changes saved successfully!');

            // Re-render layout to update header greeting and avatar
            setTimeout(() => {
                EduApp.router.updateWorkspace();
            }, 500);
        });

        return container;
    }
};
