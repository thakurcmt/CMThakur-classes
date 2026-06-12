window.EduApp = window.EduApp || {};

EduApp.TeacherProfile = {
    render() {
        const wrapper = document.createElement('div');
        wrapper.className = 'teacher-profile-wrapper';

        const user = EduApp.db.getCurrentUser() || { name: 'Dr. Clara Oswald', email: 'teacher@edu.com', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256' };
        
        // Fetch recordings (lectures) taught by this instructor
        const lectures = EduApp.db.getLectures().filter(l => l.instructor === user.name);
        
        // Fetch drafted tests
        const tests = EduApp.db.getTests();

        // 1. Render layout html
        wrapper.innerHTML = `
            <div style="margin-bottom: 24px;">
                <h1 style="font-size: 24px; font-family: var(--font-heading); margin-bottom: 8px;">Educator Profile & Workspace Settings</h1>
                <p class="text-secondary" style="font-size: 14px;">Modify your credentials, manage content repositories, and rename recorded lectures or assessments.</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 32px; align-items: start;">
                
                <!-- Account details section -->
                <div style="background-color: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm);">
                    <h3 style="font-size: 18px; font-family: var(--font-heading); margin-bottom: 16px; border-bottom: 1px dashed var(--border); padding-bottom: 10px;">Account Details</h3>
                    
                    <div style="display:flex; flex-direction:column; align-items:center; gap:12px; margin-bottom:24px;" id="profile-avatar-container">
                        ${EduApp.getAvatarHtml(user.name, 'width: 80px; height: 80px; font-size: 32px; border: 2px solid var(--primary);')}
                    </div>

                    <form id="profile-details-form" novalidate>
                        <div class="form-group">
                            <label class="form-label" for="profile-name">Full Name</label>
                            <input class="form-input" type="text" id="profile-name" value="${user.name}" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="profile-email">Email Address</label>
                            <input class="form-input" type="email" id="profile-email" value="${user.email}" required>
                        </div>

                        <button class="btn btn-primary" type="submit" style="width:100%; margin-top:10px;">
                            Save Profile Settings
                        </button>
                    </form>
                </div>

                <!-- Content Repository section -->
                <div style="background-color: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm); display:flex; flex-direction:column; gap:24px;">
                    
                    <!-- Recorded lectures repo -->
                    <div>
                        <h3 style="font-size:18px; font-family:var(--font-heading); margin-bottom:12px;">Your Recorded Lectures</h3>
                        <p class="text-secondary" style="font-size:12px; margin-bottom:16px;">Rename recordings linked to your educator account.</p>
                        
                        <div id="lectures-repo-list" style="display:flex; flex-direction:column; gap:10px;">
                            <!-- Lectures mapping -->
                        </div>
                    </div>

                    <!-- Drafted tests repo -->
                    <div>
                        <h3 style="font-size:18px; font-family:var(--font-heading); margin-bottom:12px;">Drafted Assessments & Tests</h3>
                        <p class="text-secondary" style="font-size:12px; margin-bottom:16px;">Rename drafted tests and exams in the portal.</p>
                        
                        <div id="tests-repo-list" style="display:flex; flex-direction:column; gap:10px;">
                            <!-- Tests mapping -->
                        </div>
                    </div>

                </div>

            </div>
        `;

        // 2. Map Lectures list
        const lecturesContainer = wrapper.querySelector('#lectures-repo-list');
        if (lectures.length > 0) {
            lectures.forEach(lec => {
                const row = document.createElement('div');
                row.style.cssText = 'display:flex; align-items:center; gap:8px; border: 1px solid var(--border); padding: 10px; border-radius: var(--radius-sm); background-color: var(--bg-main);';
                row.innerHTML = `
                    <div style="flex:1;">
                        <input type="text" id="lec-title-${lec.id}" value="${lec.title}" class="form-input" style="padding: 6px 10px; font-size:13px; margin-bottom: 0;">
                        <div style="font-size:10px; color: var(--text-muted); margin-top: 4px;">Subject: ${lec.subject} &bull; Date: ${lec.date}</div>
                    </div>
                    <button class="btn btn-secondary" style="padding: 6px 12px; font-size:12px;" id="lec-save-${lec.id}">Save</button>
                `;

                // Bind renaming event natively
                row.querySelector(`#lec-save-${lec.id}`).addEventListener('click', () => {
                    const newTitle = row.querySelector(`#lec-title-${lec.id}`).value.trim();
                    if (!newTitle) {
                        EduApp.toast.show('Title cannot be empty.');
                        return;
                    }
                    const success = EduApp.db.renameLecture(lec.id, newTitle);
                    if (success) {
                        EduApp.toast.show('Lecture title updated successfully.');
                        EduApp.router.updateWorkspace(); // Refresh
                    } else {
                        EduApp.toast.show('Failed to rename lecture.');
                    }
                });

                lecturesContainer.appendChild(row);
            });
        } else {
            lecturesContainer.innerHTML = `
                <div style="text-align:center; padding: 20px; color: var(--text-muted); font-size:12px; border: 1px dashed var(--border); border-radius: var(--radius-sm);">
                    No recorded lectures associated with your account name yet.
                </div>
            `;
        }

        // 3. Map Tests list
        const testsContainer = wrapper.querySelector('#tests-repo-list');
        if (tests.length > 0) {
            tests.forEach(tst => {
                const row = document.createElement('div');
                row.style.cssText = 'display:flex; align-items:center; gap:8px; border: 1px solid var(--border); padding: 10px; border-radius: var(--radius-sm); background-color: var(--bg-main);';
                row.innerHTML = `
                    <div style="flex:1;">
                        <input type="text" id="tst-title-${tst.id}" value="${tst.title}" class="form-input" style="padding: 6px 10px; font-size:13px; margin-bottom: 0;">
                        <div style="font-size:10px; color: var(--text-muted); margin-top: 4px;">Subject: ${tst.subject} &bull; Questions: ${tst.questionsCount}</div>
                    </div>
                    <button class="btn btn-secondary" style="padding: 6px 12px; font-size:12px;" id="tst-save-${tst.id}">Save</button>
                `;

                // Bind renaming event natively
                row.querySelector(`#tst-save-${tst.id}`).addEventListener('click', () => {
                    const newTitle = row.querySelector(`#tst-title-${tst.id}`).value.trim();
                    if (!newTitle) {
                        EduApp.toast.show('Title cannot be empty.');
                        return;
                    }
                    const success = EduApp.db.renameTest(tst.id, newTitle);
                    if (success) {
                        EduApp.toast.show('Assessment title updated successfully.');
                        EduApp.router.updateWorkspace();
                    } else {
                        EduApp.toast.show('Failed to rename assessment.');
                    }
                });

                testsContainer.appendChild(row);
            });
        } else {
            testsContainer.innerHTML = `
                <div style="text-align:center; padding: 20px; color: var(--text-muted); font-size:12px; border: 1px dashed var(--border); border-radius: var(--radius-sm);">
                    No tests seeded.
                </div>
            `;
        }

        // 4. Bind Account Details Form Save natively
        // Save form handler
        wrapper.querySelector('#profile-details-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const newName = wrapper.querySelector('#profile-name').value.trim();
            const newEmail = wrapper.querySelector('#profile-email').value.trim();

            if (!newName || !newEmail) {
                EduApp.toast.show('Name and email fields cannot be empty.');
                return;
            }

            // Sync user object
            const updatedUser = { ...user, name: newName, email: newEmail };
            EduApp.db.saveUser(updatedUser);
            
            const avatarContainer = wrapper.querySelector('#profile-avatar-container');
            if (avatarContainer) {
                avatarContainer.innerHTML = EduApp.getAvatarHtml(newName, 'width: 80px; height: 80px; font-size: 32px; border: 2px solid var(--primary);');
            }
            
            EduApp.toast.show('Profile updated successfully.');
            
            // Trigger routing / global layout re-render to propagate name change to layout header
            EduApp.router.updateWorkspace();
        });

        return wrapper;
    }
};
