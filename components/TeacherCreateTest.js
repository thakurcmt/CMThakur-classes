window.EduApp = window.EduApp || {};

EduApp.TeacherCreateTest = {
    render() {
        const wrapper = document.createElement('div');
        wrapper.className = 'create-test-wrapper';
        wrapper.style.cssText = 'min-height: 100vh; background-color: var(--bg-main); padding: 40px 20px; color: var(--text-primary); font-family: var(--font-main);';

        // Initialize state for questions
        this.questions = [
            {
                id: Date.now(),
                q: '',
                opts: ['', '', '', ''],
                correctIdx: 0
            }
        ];

        this.renderLayout(wrapper);
        return wrapper;
    },

    renderLayout(wrapper) {
        wrapper.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto; background-color: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 32px; box-shadow: var(--shadow-lg);">
                
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border); padding-bottom: 20px; margin-bottom: 28px;">
                    <div>
                        <h1 style="font-size: 24px; font-family: var(--font-heading); margin: 0; color: var(--primary);">Create Custom Test</h1>
                        <p class="text-secondary" style="font-size: 13px; margin: 4px 0 0 0;">Add questions, options, and select the correct answers for evaluation.</p>
                    </div>
                    <button class="btn btn-secondary" id="btn-close-window" style="padding: 8px 16px; font-size: 12px; border-color: rgba(244,63,94,0.3); color: #f43f5e;">
                        Close Window
                    </button>
                </div>

                <!-- Test metadata fields -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; margin-bottom: 32px; background: var(--bg-main); padding: 20px; border-radius: var(--radius-md); border: 1px solid var(--border);">
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" for="test-title-input">Test Title</label>
                        <input class="form-input" type="text" id="test-title-input" placeholder="e.g. Fractions Mini Quiz" style="margin-bottom: 0;" required>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" for="test-subject-select">Subject</label>
                        <select class="form-input" id="test-subject-select" style="margin-bottom: 0; background-color: var(--bg-surface);">
                            <option value="Mathematics">Mathematics</option>
                        </select>
                    </div>

                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" for="test-duration-input">Duration (Time Limit)</label>
                        <input class="form-input" type="text" id="test-duration-input" value="20 mins" placeholder="e.g. 15 mins" style="margin-bottom: 0;" required>
                    </div>

                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" for="test-due-input">Due Date</label>
                        <input class="form-input" type="date" id="test-due-input" style="margin-bottom: 0;" required>
                    </div>
                </div>

                <!-- Questions Title & Add Button -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="font-size: 18px; margin: 0; font-family: var(--font-heading);">Assessment Questions</h3>
                    <button class="btn btn-primary" id="btn-add-question" style="padding: 8px 16px; font-size: 12px; font-weight: 700; border-radius: var(--radius-sm);">
                        + Add Question
                    </button>
                </div>

                <!-- Questions Viewport -->
                <div id="questions-viewport" style="display: flex; flex-direction: column; gap: 24px; margin-bottom: 32px;"></div>

                <!-- Action Footer -->
                <div style="display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--border); padding-top: 24px;">
                    <button class="btn btn-secondary" id="btn-cancel-test">Cancel & Exit</button>
                    <button class="btn btn-primary" id="btn-publish-test" style="padding: 12px 28px; font-weight: 700;">Publish & Save Test</button>
                </div>

            </div>
        `;

        // Default Date (today + 3 days)
        const dateInput = wrapper.querySelector('#test-due-input');
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 3);
        dateInput.value = defaultDate.toISOString().split('T')[0];

        // Bind main events
        wrapper.querySelector('#btn-close-window').addEventListener('click', () => {
            if (confirm('Are you sure you want to close this window? Any unsaved progress will be lost.')) {
                window.close();
            }
        });

        wrapper.querySelector('#btn-cancel-test').addEventListener('click', () => {
            if (confirm('Cancel test creation? This tab/window will close.')) {
                window.close();
            }
        });

        wrapper.querySelector('#btn-add-question').addEventListener('click', () => {
            this.questions.push({
                id: Date.now() + Math.random(),
                q: '',
                opts: ['', '', '', ''],
                correctIdx: 0
            });
            this.syncAndRenderQuestions(wrapper);
        });

        wrapper.querySelector('#btn-publish-test').addEventListener('click', () => {
            this.handlePublish(wrapper);
        });

        // Initial render of questions
        this.syncAndRenderQuestions(wrapper);
    },

    syncAndRenderQuestions(wrapper) {
        const viewport = wrapper.querySelector('#questions-viewport');
        viewport.innerHTML = '';

        this.questions.forEach((qItem, qIdx) => {
            const card = document.createElement('div');
            card.className = 'class-card';
            card.style.cssText = 'padding: 24px; display: flex; flex-direction: column; gap: 16px; border: 1px solid var(--border); background-color: var(--bg-main); border-radius: var(--radius-md); position: relative;';

            card.innerHTML = `
                <!-- Delete Button -->
                ${this.questions.length > 1 ? `
                    <button style="position: absolute; top: 16px; right: 16px; background: none; border: none; color: #f43f5e; font-size: 20px; cursor: pointer;" class="btn-del-q" title="Delete Question">&times;</button>
                ` : ''}

                <div style="font-weight: 700; font-size: 14px; color: var(--primary);">Question #${qIdx + 1}</div>

                <!-- Question Input -->
                <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="font-size: 12px;">Question Text</label>
                    <input class="form-input q-text-input" type="text" placeholder="e.g. Solve: 3/5 + 1/10" value="${qItem.q}" style="margin-bottom: 0;" required>
                </div>

                <!-- Options Grid -->
                <div>
                    <label class="form-label" style="font-size: 12px; margin-bottom: 8px;">Answers Options (Choose one correct index)</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        ${qItem.opts.map((opt, optIdx) => {
                            const isCorrect = qItem.correctIdx === optIdx;
                            const optionChar = String.fromCharCode(65 + optIdx); // A, B, C, D
                            return `
                                <div style="display: flex; align-items: center; gap: 8px; background-color: var(--bg-surface); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid ${isCorrect ? 'var(--primary)' : 'var(--border)'};">
                                    <input type="radio" name="correct-radio-${qItem.id}" class="correct-radio" data-opt-idx="${optIdx}" ${isCorrect ? 'checked' : ''} style="cursor: pointer; accent-color: var(--primary);">
                                    <span style="font-size: 12px; font-weight: 700; color: ${isCorrect ? 'var(--primary)' : 'var(--text-secondary)'};">${optionChar}:</span>
                                    <input type="text" class="form-input opt-val-input" data-opt-idx="${optIdx}" placeholder="Option ${optionChar}" value="${opt}" style="margin-bottom: 0; padding: 4px 8px; font-size: 13px; flex: 1;">
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;

            // Bind delete event
            if (this.questions.length > 1) {
                card.querySelector('.btn-del-q').addEventListener('click', () => {
                    this.questions.splice(qIdx, 1);
                    this.syncAndRenderQuestions(wrapper);
                });
            }

            // Sync Question text change
            card.querySelector('.q-text-input').addEventListener('input', (e) => {
                qItem.q = e.target.value;
            });

            // Sync Options values change
            card.querySelectorAll('.opt-val-input').forEach(optInp => {
                optInp.addEventListener('input', (e) => {
                    const optIdx = parseInt(e.target.getAttribute('data-opt-idx'), 10);
                    qItem.opts[optIdx] = e.target.value;
                });
            });

            // Sync Correct Radio choice change
            card.querySelectorAll('.correct-radio').forEach(radio => {
                radio.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        const optIdx = parseInt(e.target.getAttribute('data-opt-idx'), 10);
                        qItem.correctIdx = optIdx;
                        // Trigger render update to highlight the borders
                        this.syncAndRenderQuestions(wrapper);
                    }
                });
            });

            viewport.appendChild(card);
        });
    },

    handlePublish(wrapper) {
        const titleInput = wrapper.querySelector('#test-title-input');
        const subjectSelect = wrapper.querySelector('#test-subject-select');
        const durationInput = wrapper.querySelector('#test-duration-input');
        const dueInput = wrapper.querySelector('#test-due-input');

        const title = titleInput.value.trim();
        const subject = subjectSelect.value;
        const duration = durationInput.value.trim();
        const dueDate = dueInput.value;

        // Validation 1: Header Meta
        if (!title || !duration || !dueDate) {
            alert('Please fill out all test details (Title, Duration, and Due Date).');
            return;
        }

        // Validation 2: Questions contents
        for (let i = 0; i < this.questions.length; i++) {
            const q = this.questions[i];
            if (!q.q.trim()) {
                alert(`Question #${i + 1} has no text.`);
                return;
            }
            for (let j = 0; j < q.opts.length; j++) {
                if (!q.opts[j].trim()) {
                    alert(`Question #${i + 1} is missing Option ${String.fromCharCode(65 + j)}.`);
                    return;
                }
            }
        }

        // Create the questions collection
        const finalQuestions = this.questions.map(q => ({
            q: q.q.trim(),
            opts: q.opts.map(o => o.trim()),
            correctIdx: q.correctIdx
        }));

        // Store test using global db helper
        const success = EduApp.db.createTest(
            title,
            subject,
            finalQuestions.length,
            duration,
            new Date(dueDate),
            finalQuestions
        );

        if (success) {
            alert(`Test "${title}" published successfully! This window will now close.`);
            window.close();
        } else {
            alert('Error creating assessment. Please check fields.');
        }
    }
};
