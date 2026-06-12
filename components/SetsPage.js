window.EduApp = window.EduApp || {};

EduApp.SetsPage = {
    searchQuery: '',
    selectedSubject: 'All',

    render() {
        const container = document.createElement('div');
        container.className = 'container';
        container.style.padding = '40px 24px';
        container.style.flex = '1';

        // Fetch user context
        const user = EduApp.db.getCurrentUser();
        const documentSets = EduApp.db.getDocumentSets();

        // Dynamically extract unique subjects
        const subjects = ['All', ...new Set(documentSets.map(set => set.subject))];

        // Add document set button for teacher
        let addSetBtnHtml = '';
        if (user && user.role === 'teacher') {
            addSetBtnHtml = `
                <button class="btn btn-primary" id="add-set-btn" style="padding: 8px 16px; font-size:13px; font-weight:700; border-radius:var(--radius-md); display:flex; align-items:center; gap:6px;">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" style="margin-top:-1px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Add Document Set
                </button>
            `;
        }

        // Header Title
        const headerHtml = `
            <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="font-size: 36px; font-family: var(--font-heading); margin-bottom: 8px;">Academic Document Sets</h1>
                <p class="text-secondary" style="max-width: 600px; margin: 0 auto;">Access high-quality study materials, practice problems, formula sheets, and mock exams. Try our free trial sets first!</p>
            </div>
        `;

        // Search and Filters Bar
        const filtersHtml = `
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; margin-bottom: 32px; background-color: var(--bg-surface); padding: 16px; border: 1px solid var(--border); border-radius: var(--radius-md);">
                
                <!-- Search -->
                <div style="position: relative; flex: 1; min-width: 250px;">
                    <input class="form-input" type="text" id="sets-search-input" placeholder="Search by title or subject..." value="${this.searchQuery}" style="padding-left: 36px; background-color: var(--bg-main);">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="var(--text-muted)" stroke-width="2" fill="none" style="position: absolute; left: 12px; top: 12px;">
                        <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </div>

                <!-- Subject Buttons -->
                <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="subject-filter-group">
                    ${subjects.map(subj => {
                        const activeClass = this.selectedSubject === subj ? 'btn-primary' : 'btn-secondary';
                        return `<button class="btn ${activeClass}" style="padding: 8px 16px; font-size:13px; border-radius:var(--radius-full);" data-subject="${subj}">${subj}</button>`;
                    }).join('')}
                </div>

                <!-- Teacher Actions -->
                ${addSetBtnHtml}
            </div>
        `;

        // Apply filters
        const filteredSets = documentSets.filter(set => {
            const matchesSearch = set.title.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                                  set.subject.toLowerCase().includes(this.searchQuery.toLowerCase());
            const matchesSubject = this.selectedSubject === 'All' || set.subject === this.selectedSubject;
            return matchesSearch && matchesSubject;
        });

        // Separate Free Trial & Premium
        const trialSets = filteredSets.filter(s => s.type === 'trial');
        const premiumSets = filteredSets.filter(s => s.type === 'premium');

        const renderSetCard = (set) => {
            const accessControl = EduApp.db.getAccessControl() || {};
            const isAccessGranted = user && accessControl[user.id] && accessControl[user.id].includes(set.id);
            const isPurchased = (user && user.purchasedSets && user.purchasedSets.includes(set.id)) || isAccessGranted;
            
            let badgeHtml = '';
            let btnText = '';
            let btnClass = '';
            let lockIconHtml = '';

            if (set.type === 'trial') {
                badgeHtml = `<span style="background-color: #34D399; color: white; padding: 2px 8px; border-radius: var(--radius-full); font-size:10px; font-weight:700; text-transform:uppercase;">Free Trial</span>`;
                btnText = 'Open PDF Preview';
                btnClass = 'btn-outline';
            } else {
                if (isPurchased) {
                    badgeHtml = `<span style="background-color: var(--primary); color: white; padding: 2px 8px; border-radius: var(--radius-full); font-size:10px; font-weight:700; text-transform:uppercase;">Unlocked</span>`;
                    btnText = 'Open Full Document';
                    btnClass = 'btn-primary';
                } else {
                    badgeHtml = `<span style="background-color: var(--accent); color: white; padding: 2px 8px; border-radius: var(--radius-full); font-size:10px; font-weight:700; text-transform:uppercase;">Locked ($${set.price.toFixed(2)})</span>`;
                    btnText = `Buy Now &bull; $${set.price.toFixed(2)}`;
                    btnClass = 'btn-accent';
                    lockIconHtml = `
                        <div style="position: absolute; top:0; left:0; width:100%; height:100%; background-color: rgba(15,23,42,0.03); display:flex; align-items:center; justify-content:center;">
                            <div style="background-color: rgba(255,255,255,0.9); width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow: var(--shadow-sm); border:1px solid var(--border);">
                                <svg viewBox="0 0 24 24" width="18" height="18" stroke="var(--text-secondary)" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            </div>
                        </div>
                    `;
                }
            }

            return `
                <div class="class-card" style="position:relative; min-height: 200px;">
                    <div style="height: 100px; background-color: var(--primary-light); position: relative; overflow: hidden; display:flex; align-items:center; justify-content:center; border-bottom:1px solid var(--border);">
                        <svg viewBox="0 0 24 24" width="36" height="36" stroke="var(--primary)" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        ${lockIconHtml}
                    </div>
                    <div class="class-info" style="padding: 18px; display: flex; flex-direction: column; flex: 1;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <span class="class-subject-tag" style="position:static; padding:2px 8px; font-size:10px;">${set.subject}</span>
                            ${badgeHtml}
                        </div>
                        <h3 class="class-title" style="font-size:15px; margin-bottom: 12px; height: 38px; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">${set.title}</h3>
                        <div style="display:flex; gap:16px; font-size:12px; color: var(--text-secondary); margin-bottom: 16px;">
                            <span>Pages: <strong>${set.pages}</strong></span>
                            <span>Size: <strong>${set.size}</strong></span>
                        </div>
                        <button class="btn ${btnClass}" style="width: 100%; font-size: 13px; padding: 8px 16px;" id="action-btn-${set.id}">${btnText}</button>
                    </div>
                </div>
            `;
        };

        // Render Trial list
        let trialsHtml = '';
        if (trialSets.length === 0) {
            trialsHtml = `<p class="text-secondary" style="grid-column: span 3; padding: 20px 0;">No free trial documents match your filters.</p>`;
        } else {
            trialsHtml = trialSets.map(s => renderSetCard(s)).join('');
        }

        // Render Premium list
        let premiumHtml = '';
        if (premiumSets.length === 0) {
            premiumHtml = `<p class="text-secondary" style="grid-column: span 3; padding: 20px 0;">No premium documents match your filters.</p>`;
        } else {
            premiumHtml = premiumSets.map(s => renderSetCard(s)).join('');
        }

        container.innerHTML = `
            ${headerHtml}
            ${filtersHtml}

            <!-- Free Trial Section -->
            <div style="margin-bottom: 48px;">
                <h2 class="dashboard-sec-title" style="border-bottom: 1px solid var(--border); padding-bottom: 8px; margin-bottom:24px;">Free Trial Document Sets (5 Trial Sheets)</h2>
                <div class="classes-grid" id="trials-grid">
                    ${trialsHtml}
                </div>
            </div>

            <!-- Premium Section -->
            <div>
                <h2 class="dashboard-sec-title" style="border-bottom: 1px solid var(--border); padding-bottom: 8px; margin-bottom:24px;">Premium Document Packs</h2>
                <div class="classes-grid" id="premium-grid">
                    ${premiumHtml}
                </div>
            </div>
        `;

        // Bind Search Input
        const searchInput = container.querySelector('#sets-search-input');
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            // Delay rendering to prevent double input lag
            if (this.searchTimeout) clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                EduApp.router.updateWorkspace();
            }, 300);
        });

        // Bind Subject Filters
        const subGroup = container.querySelector('#subject-filter-group');
        subGroup.addEventListener('click', (e) => {
            const targetBtn = e.target.closest('button');
            if (targetBtn) {
                this.selectedSubject = targetBtn.getAttribute('data-subject');
                EduApp.router.updateWorkspace();
            }
        });

        // Bind Add Set Button
        const addSetBtn = container.querySelector('#add-set-btn');
        if (addSetBtn) {
            addSetBtn.addEventListener('click', () => {
                this.showAddSetModal();
            });
        }

        // Bind Card Action Buttons
        filteredSets.forEach(set => {
            const btn = container.querySelector(`#action-btn-${set.id}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    const accessControl = EduApp.db.getAccessControl() || {};
                    const isAccessGranted = user && accessControl[user.id] && accessControl[user.id].includes(set.id);
                    const isPurchased = (user && user.purchasedSets && user.purchasedSets.includes(set.id)) || isAccessGranted;

                    if (set.type === 'trial' || isPurchased) {
                        // Open PDF viewer modal
                        this.launchPdfViewer(set);
                    } else {
                        // Buy flow
                        if (!user) {
                            EduApp.toast.show('Please log in or sign up first to purchase premium sets!');
                            EduApp.AuthModal.show('login');
                        } else {
                            // Launch Checkout Modal
                            this.launchCheckoutModal(set, user);
                        }
                    }
                });
            }
        });

        return container;
    },

    // Displays mock transaction checkout screen
    launchCheckoutModal(set, user) {
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.id = 'checkout-modal-backdrop';

        backdrop.innerHTML = `
            <div class="modal-container" style="max-width: 460px;">
                <button class="modal-close" id="checkout-close-btn">&times;</button>
                
                <h2 style="font-size:20px; font-family:var(--font-heading); margin-bottom:12px; text-align:center;">Checkout</h2>
                <p class="text-secondary text-center" style="font-size:13px; margin-bottom:24px;">Unlock premium study material files instantly.</p>

                <div style="background-color: var(--bg-main); padding: 16px; border:1px solid var(--border); border-radius: var(--radius-md); margin-bottom: 24px;">
                    <div style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">Purchase Item</div>
                    <div style="font-size:15px; font-weight:700; margin-top:4px; font-family:var(--font-heading);">${set.title}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; border-top: 1px dashed var(--border); padding-top:12px;">
                        <span style="font-weight:600; font-size:14px;">Total Price:</span>
                        <span style="font-size:18px; font-weight:800; color:var(--primary); font-family:var(--font-heading);">$${set.price.toFixed(2)}</span>
                    </div>
                </div>

                <form id="checkout-payment-form">
                    <div class="form-group">
                        <label class="form-label" for="card-holder">Cardholder Name</label>
                        <input class="form-input" type="text" id="card-holder" value="${user.name}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="card-number">Card Number</label>
                        <input class="form-input" type="text" id="card-number" placeholder="4111 2222 3333 4444" maxlength="19" required>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                        <div class="form-group">
                            <label class="form-label" for="card-expiry">Expiry Date</label>
                            <input class="form-input" type="text" id="card-expiry" placeholder="MM/YY" maxlength="5" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="card-cvv">CVV</label>
                            <input class="form-input" type="password" id="card-cvv" placeholder="•••" maxlength="3" required>
                        </div>
                    </div>
                    
                    <button class="btn btn-primary" type="submit" style="width: 100%; margin-top: 16px; padding: 12px 24px; font-weight:700;">
                        Pay & Unlock Document
                    </button>
                </form>
            </div>
        `;

        document.body.appendChild(backdrop);

        // Auto space card number formatting
        const cardNumInput = backdrop.querySelector('#card-number');
        cardNumInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            let matches = val.match(/\d{4,16}/g);
            let match = matches && matches[0] || '';
            let parts = [];

            for (let i=0, len=match.length; i<len; i+=4) {
                parts.push(match.substring(i, i+4));
            }

            if (parts.length > 0) {
                e.target.value = parts.join(' ');
            } else {
                e.target.value = val;
            }
        });

        // Auto format expiry / slash
        const expiryInput = backdrop.querySelector('#card-expiry');
        expiryInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/[^0-9]/gi, '');
            if (val.length >= 2) {
                e.target.value = val.substring(0, 2) + '/' + val.substring(2, 4);
            } else {
                e.target.value = val;
            }
        });

        let hashListener;
        const closeCheckout = () => {
            if (hashListener) window.removeEventListener('hashchange', hashListener);
            backdrop.classList.remove('active');
            setTimeout(() => backdrop.remove(), 250);
        };

        hashListener = () => {
            closeCheckout();
        };
        window.addEventListener('hashchange', hashListener);

        backdrop.querySelector('#checkout-close-btn').addEventListener('click', closeCheckout);
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeCheckout();
        });

        backdrop.querySelector('#checkout-payment-form').addEventListener('submit', (e) => {
            e.preventDefault();
            // Call purchase
            const success = EduApp.db.purchaseSet(user.id, set.id);
            if (success) {
                closeCheckout();
                EduApp.toast.show(`Payment approved! "${set.title}" is now unlocked!`);
                EduApp.router.updateWorkspace(); // Re-render grid updates
            } else {
                EduApp.toast.show('Payment transaction failed. Please try again.');
            }
        });

        // Trigger visual show transition
        setTimeout(() => backdrop.classList.add('active'), 10);
    },

    // Displays teacher upload document set modal
    showAddSetModal() {
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.id = 'add-set-modal-backdrop';

        backdrop.innerHTML = `
            <div class="modal-container" style="max-width: 500px;">
                <button class="modal-close" id="add-set-close-btn">&times;</button>
                
                <h2 style="font-size:20px; font-family:var(--font-heading); margin-bottom:12px; text-align:center;">Add Document Set</h2>
                <p class="text-secondary text-center" style="font-size:13px; margin-bottom:24px;">Upload study materials, formula sheets, or practice questions as PDF.</p>

                <form id="add-set-form">
                    <div class="form-group">
                        <label class="form-label" for="set-title">Set Title</label>
                        <input class="form-input" type="text" id="set-title" placeholder="e.g. Calculus Integration Formulas" required>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                        <div class="form-group">
                            <label class="form-label" for="set-subject">Subject</label>
                            <select class="form-input" id="set-subject" required>
                                <option value="Mathematics">Mathematics</option>
                                <option value="Physics">Physics</option>
                                <option value="Chemistry">Chemistry</option>
                                <option value="Biology">Biology</option>
                                <option value="Science">Science</option>
                                <option value="English">English</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="set-type">Set Type</label>
                            <select class="form-input" id="set-type" required>
                                <option value="trial">Free Trial</option>
                                <option value="premium">Premium Pack</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group" id="set-price-group" style="display:none;">
                        <label class="form-label" for="set-price">Price ($)</label>
                        <input class="form-input" type="number" id="set-price" step="0.01" min="0.99" value="9.99">
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="set-pdf-file">PDF Document File</label>
                        <input class="form-input" type="file" id="set-pdf-file" accept=".pdf" required style="padding: 6px;">
                        <span style="font-size: 11px; color: var(--text-muted); display: block; margin-top: 4px;">Upload files up to 10MB in size.</span>
                    </div>
                    
                    <button class="btn btn-primary" type="submit" style="width: 100%; margin-top: 24px; padding: 12px 24px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:8px;">
                        Create and Upload Set
                    </button>
                </form>
            </div>
        `;

        document.body.appendChild(backdrop);

        const typeSelect = backdrop.querySelector('#set-type');
        const priceGroup = backdrop.querySelector('#set-price-group');
        const priceInput = backdrop.querySelector('#set-price');
        
        typeSelect.addEventListener('change', () => {
            if (typeSelect.value === 'premium') {
                priceGroup.style.display = 'block';
                priceInput.setAttribute('required', 'true');
            } else {
                priceGroup.style.display = 'none';
                priceInput.removeAttribute('required');
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

        backdrop.querySelector('#add-set-close-btn').addEventListener('click', closeModal);
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeModal();
        });

        backdrop.querySelector('#add-set-form').addEventListener('submit', (e) => {
            e.preventDefault();

            const fileInput = backdrop.querySelector('#set-pdf-file');
            const file = fileInput.files[0];
            if (!file) {
                EduApp.toast.show('Please select a PDF file first!');
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                EduApp.toast.show('File is too large! Maximum limit is 10MB.');
                return;
            }

            const reader = new FileReader();
            reader.onload = async (event) => {
                const pdfDataUrl = event.target.result;
                const title = backdrop.querySelector('#set-title').value;
                const subject = backdrop.querySelector('#set-subject').value;
                const type = backdrop.querySelector('#set-type').value;
                const price = type === 'trial' ? 0 : parseFloat(priceInput.value || 0);
                const fileSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

                // Show loading state
                const submitBtn = backdrop.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.innerText = 'Uploading...';

                try {
                    const success = await EduApp.db.addDocumentSet(title, subject, type, price, file.name, fileSize, pdfDataUrl);
                    if (success) {
                        closeModal();
                        EduApp.toast.show(`Successfully uploaded document set "${title}"!`);
                        EduApp.router.updateWorkspace();
                    } else {
                        EduApp.toast.show('Failed to save document set.');
                        submitBtn.disabled = false;
                        submitBtn.innerText = 'Create and Upload Set';
                    }
                } catch (err) {
                    EduApp.toast.show('Error: ' + err.message);
                    submitBtn.disabled = false;
                    submitBtn.innerText = 'Create and Upload Set';
                }
            };
            reader.readAsDataURL(file);
        });

        setTimeout(() => backdrop.classList.add('active'), 10);
    },

    // Renders custom fullscreen PDF document reader simulator
    launchPdfViewer(set) {
        if (set.pdfDataUrl) {
            const readerBackdrop = document.createElement('div');
            readerBackdrop.style.position = 'fixed';
            readerBackdrop.style.top = '0';
            readerBackdrop.style.left = '0';
            readerBackdrop.style.width = '100vw';
            readerBackdrop.style.height = '100vh';
            readerBackdrop.style.backgroundColor = '#1e293b';
            readerBackdrop.style.zIndex = '9999';
            readerBackdrop.style.display = 'flex';
            readerBackdrop.style.flexDirection = 'column';
            readerBackdrop.style.color = 'white';
            readerBackdrop.id = 'pdf-reader-overlay';

            readerBackdrop.innerHTML = `
                <!-- Reader Top Bar -->
                <div style="padding: 12px 24px; border-bottom: 1px solid #1f2937; display: flex; justify-content: space-between; align-items: center; background-color: #0f172a; color: white;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--accent)" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                        <span style="font-family: var(--font-heading); font-weight: 700; font-size: 15px; max-width:350px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${set.title}</span>
                    </div>

                    <button class="btn btn-accent" id="pdf-close-reader" style="padding: 6px 14px; font-size:13px; font-weight: 700; border-radius: 6px;">
                        Close Reader
                    </button>
                </div>

                <!-- Reader PDF Embed/IFrame Content -->
                <div style="flex: 1; width: 100%; height: 100%; overflow: hidden; background-color: #334155;">
                    <iframe src="${set.pdfDataUrl}" style="width: 100%; height: 100%; border: none;" type="application/pdf"></iframe>
                </div>
            `;

            let hashListener;
            const closeReader = () => {
                if (hashListener) window.removeEventListener('hashchange', hashListener);
                readerBackdrop.remove();
                document.body.style.overflow = '';
            };

            hashListener = () => {
                closeReader();
            };
            window.addEventListener('hashchange', hashListener);

            readerBackdrop.querySelector('#pdf-close-reader').addEventListener('click', closeReader);
            document.body.appendChild(readerBackdrop);
            document.body.style.overflow = 'hidden';
            return;
        }

        // Otherwise fallback to simulated paging (legacy mock text content)
        let currentPageIdx = 0;

        const readerBackdrop = document.createElement('div');
        readerBackdrop.style.position = 'fixed';
        readerBackdrop.style.top = '0';
        readerBackdrop.style.left = '0';
        readerBackdrop.style.width = '100vw';
        readerBackdrop.style.height = '100vh';
        readerBackdrop.style.backgroundColor = '#2c3540'; // PDF workspace background
        readerBackdrop.style.zIndex = '9999';
        readerBackdrop.style.display = 'flex';
        readerBackdrop.style.flexDirection = 'column';
        readerBackdrop.style.color = '#111827';
        readerBackdrop.id = 'pdf-reader-overlay';

        const updateReaderContent = () => {
            // Left sidebar items
            let sidebarItemsHtml = '';
            for (let i = 0; i < set.pages; i++) {
                const isActive = i === currentPageIdx;
                sidebarItemsHtml += `
                    <div style="border: 2px solid ${isActive ? 'var(--primary)' : '#e2e8f0'}; padding: 12px; border-radius: 6px; background-color: white; cursor: pointer; text-align: center; font-size:12px; font-weight:600; display:flex; flex-direction:column; justify-content:center; align-items:center; aspect-ratio: 1/1.3;" class="sidebar-thumb" data-idx="${i}">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="#94a3b8" stroke-width="2" fill="none" style="margin-bottom:6px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                        Page ${i + 1}
                    </div>
                `;
            }

            // Document page content
            const pageText = set.content[currentPageIdx] || `Page ${currentPageIdx + 1} details are loaded. Please read the section materials carefully.`;

            readerBackdrop.innerHTML = `
                <!-- Reader Top Bar -->
                <div style="padding: 12px 24px; border-bottom: 1px solid #1f2937; display: flex; justify-content: space-between; align-items: center; background-color: #0f172a; color: white;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--accent)" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                        <span style="font-family: var(--font-heading); font-weight: 700; font-size: 15px; max-width:350px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${set.title}</span>
                    </div>

                    <!-- Page navigator controls -->
                    <div style="display: flex; align-items: center; gap: 12px; font-size:14px; background-color:rgba(255,255,255,0.08); padding: 4px 12px; border-radius:6px;">
                        <button class="btn btn-secondary" id="pdf-prev-page" style="padding:4px 8px; border-radius:4px; font-size:11px; background-color:transparent; color:white; border-color:rgba(255,255,255,0.15);" ${currentPageIdx === 0 ? 'disabled' : ''}>Prev</button>
                        <span>Page ${currentPageIdx + 1} of ${set.pages}</span>
                        <button class="btn btn-secondary" id="pdf-next-page" style="padding:4px 8px; border-radius:4px; font-size:11px; background-color:transparent; color:white; border-color:rgba(255,255,255,0.15);" ${currentPageIdx === set.pages - 1 ? 'disabled' : ''}>Next</button>
                    </div>

                    <button class="btn btn-accent" id="pdf-close-reader" style="padding: 6px 14px; font-size:13px; font-weight: 700; border-radius: 6px;">
                        Close Reader
                    </button>
                </div>

                <!-- Reader Split Content (Sidebar + Page Area) -->
                <div style="flex: 1; display: grid; grid-template-columns: 200px 1fr; overflow: hidden; background-color: #2c3540;">
                    
                    <!-- Left Sidebar Thumbnails list -->
                    <div style="border-right: 1px solid #3f4a56; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; background-color: #1a222c;">
                        <div style="font-size: 10px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; margin-bottom: 4px;">Thumbnails</div>
                        ${sidebarItemsHtml}
                    </div>

                    <!-- Main Sheet view -->
                    <div style="padding: 40px; overflow-y: auto; display: flex; justify-content: center; align-items: flex-start; scroll-behavior: smooth;">
                        
                        <!-- Paper Sheet -->
                        <div style="width: 100%; max-width: 720px; background-color: white; border-radius: 4px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); padding: 50px 60px; min-height: 800px; display: flex; flex-direction: column; justify-content: flex-start; position: relative;">
                            
                            <!-- Document Header -->
                            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid var(--border); padding-bottom: 20px; margin-bottom: 30px;">
                                <div style="font-family: var(--font-heading); font-size: 11px; text-transform: uppercase; color: var(--text-secondary); letter-spacing:1px;">CM Thakur Classes Library</div>
                                <div style="font-family: var(--font-heading); font-size: 11px; text-transform: uppercase; color: var(--text-secondary); letter-spacing:1px;">Subject: ${set.subject}</div>
                            </div>

                            <!-- Page Main Title -->
                            <h2 style="font-family: var(--font-heading); font-size: 20px; margin-bottom: 24px; color: var(--text-primary); font-weight:800;">${set.title}</h2>
                            
                            <!-- Page Body Content -->
                            <div style="flex:1; font-size: 15px; color: var(--text-primary); line-height: 1.8; text-align: justify; white-space: pre-line;">
                                ${pageText}
                                
                                <div style="margin-top: 40px; padding: 20px; border-radius: 6px; background-color: var(--bg-main); border: 1px solid var(--border); font-size: 14px;">
                                    <h4 style="font-family: var(--font-heading); font-weight:700; margin-bottom:8px; color: var(--primary);">Interactive Study Note:</h4>
                                    <p class="text-secondary" style="margin:0;">Make sure to memorize these derivations and rules. Click on the progress assessments on your dashboard to review this unit's equations.</p>
                                </div>
                            </div>

                            <!-- Page footer number -->
                            <div style="border-top: 1px solid var(--border); padding-top: 15px; margin-top: 40px; display:flex; justify-content:space-between; align-items:center; font-size: 12px; color: var(--text-secondary);">
                                <span>&copy; CM Thakur Classes Document System</span>
                                <span>Page ${currentPageIdx + 1}</span>
                            </div>
                        </div>

                    </div>
                </div>
            `;

            // Bind page Prev/Next
            const prevBtn = readerBackdrop.querySelector('#pdf-prev-page');
            const nextBtn = readerBackdrop.querySelector('#pdf-next-page');

            if (prevBtn && currentPageIdx > 0) {
                prevBtn.addEventListener('click', () => {
                    currentPageIdx--;
                    updateReaderContent();
                });
            }

            if (nextBtn && currentPageIdx < set.pages - 1) {
                nextBtn.addEventListener('click', () => {
                    currentPageIdx++;
                    updateReaderContent();
                });
            }

            // Bind Sidebar Thumbnails click
            const thumbs = readerBackdrop.querySelectorAll('.sidebar-thumb');
            thumbs.forEach(thumb => {
                thumb.addEventListener('click', () => {
                    currentPageIdx = parseInt(thumb.getAttribute('data-idx'));
                    updateReaderContent();
                });
            });

            // Close Reader Event
            readerBackdrop.querySelector('#pdf-close-reader').addEventListener('click', closeReader);
        };

        let hashListener;
        const closeReader = () => {
            if (hashListener) window.removeEventListener('hashchange', hashListener);
            readerBackdrop.remove();
            document.body.style.overflow = '';
        };

        hashListener = () => {
            closeReader();
        };
        window.addEventListener('hashchange', hashListener);

        document.body.appendChild(readerBackdrop);
        document.body.style.overflow = 'hidden';

        updateReaderContent();
    }
};
