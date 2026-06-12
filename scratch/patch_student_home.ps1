$path = "C:\Users\thaku\OneDrive\Desktop\edu-platform\components\StudentHome.js"
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

$startMarker = "    // Classroom simulator logic (popups/simulations)`r`n    launchClassroomSimulator(activeClass) {"
$startMarkerUnix = "    // Classroom simulator logic (popups/simulations)`n    launchClassroomSimulator(activeClass) {"
$endMarker = "    // View submitted student homework PDF`r`n    launchHomeworkViewer(hw) {"
$endMarkerUnix = "    // View submitted student homework PDF`n    launchHomeworkViewer(hw) {"

$startIdx = $content.IndexOf($startMarker)
if ($startIdx -eq -1) {
    $startIdx = $content.IndexOf($startMarkerUnix)
}

$endIdx = $content.IndexOf($endMarker)
if ($endIdx -eq -1) {
    $endIdx = $content.IndexOf($endMarkerUnix)
}

if ($startIdx -eq -1 -or $endIdx -eq -1) {
    Write-Error "Markers not found! Start: $startIdx, End: $endIdx"
    exit 1
}

$newImpl = @"
    // Classroom simulator logic (popups/simulations)
    launchClassroomSimulator(activeClass) {
        // Create full screen classroom backdrop
        const backdrop = document.createElement('div');
        backdrop.style.position = 'fixed';
        backdrop.style.top = '0';
        backdrop.style.left = '0';
        backdrop.style.width = '100vw';
        backdrop.style.height = '100vh';
        backdrop.style.backgroundColor = '#0b0f19';
        backdrop.style.zIndex = '9999';
        backdrop.style.display = 'flex';
        backdrop.style.flexDirection = 'column';
        backdrop.style.color = '#ffffff';
        backdrop.id = 'classroom-simulator';

        const user = EduApp.db.getCurrentUser() || { id: 'std_001', name: 'Student' };

        backdrop.innerHTML = `
            <!-- Top bar -->
            <div style="padding: 16px 24px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; background-color: #0f172a;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 12px; height: 12px; background-color: var(--accent); border-radius: 50%; animation: pulse 1s infinite alternate;"></div>
                    <span style="font-family: var(--font-heading); font-weight: 800; font-size: 18px;">LIVE CLASSROOM</span>
                </div>
                <div style="font-weight: 600; font-size: 15px; background-color: rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 6px;">
                    \${activeClass.title} - \${activeClass.instructor}
                </div>
                <button class="btn btn-accent" id="leave-class-btn" style="padding: 8px 16px; font-weight: 700; border-radius: 6px;">
                    Leave Classroom
                </button>
            </div>

            <!-- Webcam Bar -->
            <div style="padding: 12px 24px; background-color: #0d1323; border-bottom: 1px solid #1e293b; display: flex; gap: 20px; align-items: center; justify-content: center;">
                <!-- Student Video Container (Local) -->
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="position: relative; width: 140px; height: 90px; background-color: #1e293b; border-radius: 8px; overflow: hidden; border: 2px solid var(--primary); display: flex; align-items: center; justify-content: center;">
                        <video id="student-webcam-video" autoplay playsinline muted style="width: 100%; height: 100%; object-fit: cover;"></video>
                        <div id="student-webcam-avatar" style="position: absolute; font-size: 24px;">🎒</div>
                        <div style="position: absolute; bottom: 4px; left: 4px; background-color: rgba(0,0,0,0.6); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">\${user.name} (You)</div>
                    </div>
                </div>
                <!-- Teacher Video Container (Simulated Host) -->
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="position: relative; width: 140px; height: 90px; background-color: #1e293b; border-radius: 8px; overflow: hidden; border: 2px solid #334155; display: flex; align-items: center; justify-content: center;">
                        <!-- Simulated video feed with pulsing effect -->
                        <div id="teacher-webcam-placeholder" style="width: 100%; height: 100%; background: linear-gradient(45deg, #1e1b4b, #1e293b); display: flex; flex-direction: column; align-items: center; justify-content: center; animation: pulse 2s infinite alternate;">
                            <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256" style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--primary); object-fit: cover; margin-bottom: 4px;" alt="Teacher">
                            <div style="font-size: 8px; color: #a5b4fc; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Live Host Feed</div>
                        </div>
                        <div style="position: absolute; bottom: 4px; left: 4px; background-color: rgba(0,0,0,0.6); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">\${activeClass.instructor}</div>
                    </div>
                </div>
            </div>

            <!-- Main view (Whiteboard presentation + chat) -->
            <div style="flex: 1; display: grid; grid-template-columns: 3fr 1.2fr; overflow: hidden; background-color: #020617;">
                
                <!-- Main screen: blackboard/webcam -->
                <div style="position: relative; display: flex; flex-direction: column; justify-content: center; align-items: center; border-right: 1px solid #1e293b; padding: 20px; gap: 16px;">
                    
                    <!-- Whiteboard Slide Container -->
                    <div style="width: 100%; max-width: 820px; aspect-ratio: 16/10; background-color: #1e293b; border-radius: 12px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: var(--shadow-lg); border: 2px solid rgba(255,255,255,0.05); position: relative; overflow: hidden;">
                        
                        <!-- Slide Content Container -->
                        <div id="whiteboard-slide" style="flex: 1; padding: 40px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: radial-gradient(circle, #223048 0%, #0d131e 100%); position: relative;">
                            
                            <!-- Drawing Canvas Overlay -->
                            <canvas id="whiteboard-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; pointer-events: none;"></canvas>

                            <div style="z-index: 2; pointer-events: none; user-select: none;">
                                <h2 id="slide-title" style="font-size: 26px; font-family: var(--font-heading); color: #60a5fa; margin-bottom: 20px;">Slide Title</h2>
                                <p id="slide-description" style="font-family: monospace; font-size: 16px; color: #a1a1aa; max-width: 600px; line-height: 2;">
                                    Slide Description Content
                                </p>
                            </div>
                        </div>

                        <!-- Whiteboard Controls Footer (View Only for Student) -->
                        <div style="background-color: #0f172a; padding: 12px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #1e293b; z-index: 20;">
                            <span style="font-size: 11px; color: #60a5fa; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Whiteboard Synced with Instructor</span>
                            <span id="slide-index" style="font-size: 12px; font-family: monospace;">Slide 1 / 3</span>
                        </div>

                    </div>

                    <!-- Webcam buttons / controls -->
                    <div style="display: flex; gap: 16px; margin-top: 8px;">
                        <button class="btn btn-secondary" style="border-radius: 6px; padding: 10px 20px; border-color: #334155; color: white;" id="student-mic-toggle">
                            Mute Mic
                        </button>
                        <button class="btn btn-secondary" style="border-radius: 6px; padding: 10px 20px; border-color: #334155; color: white;" id="webcam-toggle-btn">
                            Stop Video
                        </button>
                        <button class="btn btn-secondary" style="border-radius: 6px; padding: 10px 20px; border-color: #334155; color: white;" id="classroom-raise-hand">
                            Raise Hand
                        </button>
                    </div>
                </div>

                <!-- Chat sidebar -->
                <div style="display: flex; flex-direction: column; background-color: #0f172a; border-left: 1px solid #1e293b; overflow: hidden;">
                    <div style="padding: 16px; border-bottom: 1px solid #1e293b; font-weight: 700; font-size: 14px; letter-spacing: 0.5px;">
                        CLASSROOM CHAT
                    </div>
                    
                    <!-- Chat Messages List -->
                    <div id="classroom-chat-list" style="flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; font-size: 13px;">
                        <!-- messages -->
                    </div>

                    <!-- Chat input -->
                    <div style="padding: 16px; border-top: 1px solid #1e293b; display: flex; gap: 8px;">
                        <input type="text" id="classroom-chat-input" placeholder="Type a message..." style="flex:1; background-color: #1e293b; border: 1px solid #334155; color: white; padding: 8px 12px; border-radius: 6px; outline:none; font-size:13px;">
                        <button class="btn btn-primary" id="classroom-send-chat" style="padding: 8px 12px; border-radius: 6px; font-size:13px;">Send</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(backdrop);
        document.body.style.overflow = 'hidden'; // Lock scrolling

        // Select slides based on subject
        const subject = activeClass.subject || 'Mathematics';
        let slides = [];
        if (subject === 'Chemistry') {
            slides = [
                {
                    title: "1. IUPAC Organic Nomenclature",
                    description: "Rules:\\n1. Longest carbon chain is parent.\\n2. Number chain starting nearest substituents.\\n3. Write substituents alphabetically.\\n\\nProblem: Name CH3-CH(OH)-CH2-CH3"
                },
                {
                    title: "2. Common Functional Groups",
                    description: "Priority List:\\n1. Carboxylic Acids (-oic acid)\\n2. Aldehydes (-al)\\n3. Ketones (-one)\\n4. Alcohols (-ol)\\n5. Alkenes/Alkynes"
                },
                {
                    title: "3. Benzene Derivatives",
                    description: "Ortho- (1,2-), Meta- (1,3-), Para- (1,4-)\\ndisubstituted rings.\\nExample: 1,2-dimethylbenzene (o-xylene)"
                }
            ];
        } else if (subject === 'Physics') {
            slides = [
                {
                    title: "1. Newton's Incline Equations",
                    description: "Forces parallel to incline (angle theta):\\nF_gravity = m * g * sin(theta)\\nF_friction = mu * m * g * cos(theta)\\n\\nProblem: Find acceleration of 5kg block on 30° incline"
                },
                {
                    title: "2. Kinetic and Potential Energy",
                    description: "Conservation of mechanical energy:\\nE_initial = E_final\\n1/2 m v_1^2 + m g h_1 = 1/2 m v_2^2 + m g h_2"
                },
                {
                    title: "3. Elastic Collisions",
                    description: "Conservation of linear momentum:\\nm_1 u_1 + m_2 u_2 = m_1 v_1 + m_2 v_2\\nCoefficient of Restitution (e = 1)"
                }
            ];
        } else if (subject === 'Computer Science') {
            slides = [
                {
                    title: "1. Python Data Structures",
                    description: "Lists: x = [1, 2, 3] (mutable)\\nTuples: y = (1, 2, 3) (immutable)\\nDicts: z = {'key': 'val'} (key-value mapping)\\nSets: w = {1, 2} (unique, unordered)"
                },
                {
                    title: "2. Scope & LEGB Rule",
                    description: "Variable resolution order:\\n1. Local scope\\n2. Enclosing scope\\n3. Global scope\\n4. Built-in scope"
                },
                {
                    title: "3. Object-Oriented Principles",
                    description: "Class definition, inheritance, encapsulation:\\nclass Dog(Animal):\\n    def __init__(self, name):\\n        super().__init__()\\n        self.name = name"
                }
            ];
        } else {
            // Default Mathematics
            slides = [
                {
                    title: "1. The Chain Rule & Derivatives",
                    description: "Formulas:\\nLet y = f(u) where u = g(x).\\ndy/dx = dy/du * du/dx\\n\\nProblem 1: Find dy/dx for y = ln(cos(x^2))"
                },
                {
                    title: "2. Solving Example 1",
                    description: "Let u = cos(x^2)\\ndy/du = 1/u = 1/cos(x^2)\\ndu/dx = -sin(x^2) * 2x\\n\\ndy/dx = [1/cos(x^2)] * [-2x * sin(x^2)] = -2x * tan(x^2)"
                },
                {
                    title: "3. Direct Substitution & Squeeze",
                    description: "Squeeze Theorem:\\nIf g(x) <= f(x) <= h(x) near c\\nand lim g(x) = lim h(x) = L\\nthen lim f(x) = L"
                }
            ];
        }

        const canvas = backdrop.querySelector('#whiteboard-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1000;
        canvas.height = 625;

        // Register participant to state
        const registerParticipant = () => {
            const state = EduApp.db.getLiveClassState();
            state.participants = state.participants || [];
            if (!state.participants.some(p => p.studentId === user.id)) {
                state.participants.push({ studentId: user.id, name: user.name });
                EduApp.db.updateLiveClassState({ participants: state.participants });
            }
        };
        registerParticipant();

        // 1. Mark attendance on entry
        const markSelfPresent = () => {
            const todayStatusStr = localStorage.getItem('edu_teacher_attendance_today');
            let todayStatus = todayStatusStr ? JSON.parse(todayStatusStr) : {};
            
            const currentRecord = todayStatus[user.id] || {};
            const existingSeconds = typeof currentRecord === 'object' ? (currentRecord.staySeconds || 0) : 0;
            const existingTimeStr = typeof currentRecord === 'object' ? (currentRecord.stayTimeStr || '0 secs') : '0 secs';
            
            todayStatus[user.id] = {
                present: true,
                staySeconds: existingSeconds,
                stayTimeStr: existingTimeStr
            };
            
            localStorage.setItem('edu_teacher_attendance_today', JSON.stringify(todayStatus));
            
            // Sync with global attendance DB
            const attendance = EduApp.db.getAttendance();
            if (!attendance.today) attendance.today = [];
            const index = attendance.today.findIndex(r => r.studentId === user.id);
            if (index !== -1) {
                attendance.today[index].status = 'present';
            } else {
                attendance.today.push({
                    studentId: user.id,
                    studentName: user.name,
                    name: user.name,
                    status: 'present'
                });
            }
            localStorage.setItem(EduApp.db.KEYS.ATTENDANCE, JSON.stringify(attendance));
        };
        markSelfPresent();

        // 2. Stay Tracker Heartbeat
        let staySeconds = 0;
        const checkInitialStay = () => {
            const todayStatusStr = localStorage.getItem('edu_teacher_attendance_today');
            if (todayStatusStr) {
                const todayStatus = JSON.parse(todayStatusStr);
                const currentRecord = todayStatus[user.id];
                if (currentRecord && typeof currentRecord === 'object') {
                    staySeconds = currentRecord.staySeconds || 0;
                }
            }
        };
        checkInitialStay();

        const saveStayTime = () => {
            const todayStatusStr = localStorage.getItem('edu_teacher_attendance_today');
            let todayStatus = todayStatusStr ? JSON.parse(todayStatusStr) : {};
            
            let timeStr = '';
            if (staySeconds < 60) {
                timeStr = `\${staySeconds} secs`;
            } else {
                timeStr = `\${Math.floor(staySeconds / 60)} mins \${staySeconds % 60} secs`;
            }
            
            todayStatus[user.id] = {
                present: true,
                staySeconds: staySeconds,
                stayTimeStr: timeStr
            };
            localStorage.setItem('edu_teacher_attendance_today', JSON.stringify(todayStatus));
        };

        const stayInterval = setInterval(() => {
            staySeconds++;
            if (staySeconds % 5 === 0) {
                saveStayTime();
            }
        }, 1000);

        // Beforeunload backup
        const onUnload = () => {
            saveStayTime();
        };
        window.addEventListener('beforeunload', onUnload);

        // Media Stream Variables
        let localStream = null;

        // Start local video webcam stream
        const startCamera = async () => {
            try {
                localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                const videoElement = backdrop.querySelector('#student-webcam-video');
                if (videoElement) {
                    videoElement.srcObject = localStream;
                    backdrop.querySelector('#student-webcam-avatar').style.display = 'none';
                }
            } catch (err) {
                console.warn("Student camera access failed or blocked: ", err);
                const avatarElement = backdrop.querySelector('#student-webcam-avatar');
                if (avatarElement) avatarElement.style.display = 'block';
                const videoElement = backdrop.querySelector('#student-webcam-video');
                if (videoElement) videoElement.style.display = 'none';
            }
        };

        // Start camera stream immediately
        setTimeout(startCamera, 200);

        // Video and Audio toggle buttons
        const videoToggleBtn = backdrop.querySelector('#webcam-toggle-btn');
        let videoEnabled = true;
        videoToggleBtn.addEventListener('click', () => {
            videoEnabled = !videoEnabled;
            if (localStream) {
                localStream.getVideoTracks().forEach(track => track.enabled = videoEnabled);
            }
            videoToggleBtn.textContent = videoEnabled ? 'Stop Video' : 'Start Video';
            videoToggleBtn.style.color = videoEnabled ? 'white' : '#f43f5e';
            backdrop.querySelector('#student-webcam-avatar').style.display = videoEnabled ? 'none' : 'block';
            const videoElement = backdrop.querySelector('#student-webcam-video');
            if (videoElement) {
                videoElement.style.display = videoEnabled ? 'block' : 'none';
            }
        });

        const micToggleBtn = backdrop.querySelector('#student-mic-toggle');
        let audioEnabled = true;
        micToggleBtn.addEventListener('click', () => {
            audioEnabled = !audioEnabled;
            if (localStream) {
                localStream.getAudioTracks().forEach(track => track.enabled = audioEnabled);
            }
            micToggleBtn.textContent = audioEnabled ? 'Mute Mic' : 'Unmute Mic';
            micToggleBtn.style.color = audioEnabled ? 'white' : '#f43f5e';
        });

        let currentSlide = -1;
        let lastChatLength = 0;
        const raiseHandBtn = backdrop.querySelector('#classroom-raise-hand');

        // Draw whiteboard canvas drawings
        const drawAllStrokes = (drawings) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (!drawings) return;
            drawings.forEach(stroke => {
                ctx.beginPath();
                ctx.strokeStyle = stroke.color;
                ctx.lineWidth = stroke.width;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                if (stroke.points && stroke.points.length > 0) {
                    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
                    for (let j = 1; j < stroke.points.length; j++) {
                        ctx.lineTo(stroke.points[j].x, stroke.points[j].y);
                    }
                    ctx.stroke();
                }
            });
        };

        // Sync local UI to local storage state
        const syncFromStorage = () => {
            const state = EduApp.db.getLiveClassState();

            // 1. Session Ended Overlay
            if (state.status !== 'live' || state.classId !== activeClass.id) {
                cleanup();
                backdrop.remove();
                document.body.style.overflow = '';
                
                // Show fullscreen end-class overlay
                const endOverlay = document.createElement('div');
                endOverlay.className = 'modal-backdrop active';
                endOverlay.style.zIndex = '10000';
                endOverlay.innerHTML = `
                    <div class="modal-container" style="max-width: 400px; text-align: center; padding: 40px 30px; border-radius: var(--radius-lg);">
                        <div style="font-size: 48px; margin-bottom: 20px;">🎓</div>
                        <h2 style="font-family: var(--font-heading); font-size: 22px; margin-bottom: 12px;">Class Has Ended</h2>
                        <p class="text-secondary" style="font-size: 14px; margin-bottom: 24px; line-height: 1.5;">The instructor has closed this live classroom session. All blackboard annotations and chat streams have been saved to progress logs.</p>
                        <button class="btn btn-primary" id="end-overlay-close-btn" style="width: 100%; padding: 12px; font-weight: 700;">Back to Dashboard</button>
                    </div>
                `;
                document.body.appendChild(endOverlay);
                endOverlay.querySelector('#end-overlay-close-btn').addEventListener('click', () => {
                    endOverlay.remove();
                    // Force refresh Student Home dashboard to clear live banner
                    EduApp.router.updateWorkspace();
                });
                return;
            }

            // 2. Slide Advancement
            if (state.currentSlide !== currentSlide) {
                currentSlide = state.currentSlide;
                if (slides[currentSlide]) {
                    backdrop.querySelector('#slide-title').textContent = slides[currentSlide].title;
                    backdrop.querySelector('#slide-description').innerHTML = slides[currentSlide].description.replace(/\\\\n/g, '<br/>');
                    backdrop.querySelector('#slide-index').textContent = \`Slide \\\${currentSlide + 1} / \\\${slides.length}\`;
                }
            }

            // 3. Drawings Redraw
            drawAllStrokes(state.drawings);

            // 4. Chat messages Sync
            const chatList = backdrop.querySelector('#classroom-chat-list');
            if (state.chat && state.chat.length > lastChatLength) {
                for (let i = lastChatLength; i < state.chat.length; i++) {
                    const msg = state.chat[i];
                    const item = document.createElement('div');
                    const color = msg.isHost ? '#60a5fa' : '#a78bfa';
                    item.innerHTML = `
                        <strong style="color: \${color};">\${msg.sender}\dots\${msg.isHost ? ' (Host)' : ''}:</strong>
                        <p style="margin-top: 2px; color: #e2e8f0;">\${msg.message}</p>
                    `;
                    chatList.appendChild(item);
                }
                chatList.scrollTop = chatList.scrollHeight;
                lastChatLength = state.chat.length;
            }

            // 5. Hand Raise button sync
            const handRaises = state.handRaises || [];
            const isHandRaised = handRaises.some(hr => hr.studentId === user.id);
            if (isHandRaised) {
                raiseHandBtn.textContent = 'Hand Raised';
                raiseHandBtn.style.color = '#fbbf24';
                raiseHandBtn.style.borderColor = '#fbbf24';
                raiseHandBtn.style.boxShadow = '0 0 10px rgba(251,191,36,0.4)';
            } else {
                raiseHandBtn.textContent = 'Raise Hand';
                raiseHandBtn.style.color = 'white';
                raiseHandBtn.style.borderColor = '#334155';
                raiseHandBtn.style.boxShadow = 'none';
            }

            // 6. Screen Share Overlay Sync
            let screenOverlay = backdrop.querySelector('#student-screen-share-overlay');
            if (state.isScreenSharing) {
                if (!screenOverlay) {
                    screenOverlay = document.createElement('div');
                    screenOverlay.id = 'student-screen-share-overlay';
                    screenOverlay.style.position = 'absolute';
                    screenOverlay.style.top = '0';
                    screenOverlay.style.left = '0';
                    screenOverlay.style.width = '100%';
                    screenOverlay.style.height = '100%';
                    screenOverlay.style.backgroundColor = '#0b0f19';
                    screenOverlay.style.zIndex = '30';
                    screenOverlay.style.display = 'flex';
                    screenOverlay.style.flexDirection = 'column';
                    screenOverlay.style.alignItems = 'center';
                    screenOverlay.style.justifyContent = 'center';
                    screenOverlay.style.gap = '16px';
                    screenOverlay.innerHTML = `
                        <div style="font-size: 40px; animation: pulse 1s infinite alternate;">🖥️</div>
                        <h3 style="font-family: var(--font-heading); font-size: 18px; color: #60a5fa;">Instructor is Sharing Screen</h3>
                        <p class="text-secondary" style="font-size: 12px; max-width: 300px; text-align: center; line-height: 1.5;">The presenter is currently sharing their screen/window. Whiteboard draw overlays are temporarily paused.</p>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="width: 8px; height: 8px; background-color: #34d399; border-radius: 50%; animation: pulse 0.5s infinite alternate;"></span>
                            <span style="font-size: 11px; font-weight: 700; color: #34d399; text-transform: uppercase;">Streaming Live</span>
                        </div>
                    `;
                    backdrop.querySelector('#whiteboard-slide').appendChild(screenOverlay);
                }
                screenOverlay.style.display = 'flex';
            } else {
                if (screenOverlay) {
                    screenOverlay.style.display = 'none';
                }
            }
        };

        // Hand Raise Button Event
        raiseHandBtn.addEventListener('click', () => {
            const state = EduApp.db.getLiveClassState();
            state.handRaises = state.handRaises || [];
            const isHandRaised = state.handRaises.some(hr => hr.studentId === user.id);
            
            if (!isHandRaised) {
                state.handRaises.push({
                    studentId: user.id,
                    studentName: user.name,
                    timestamp: Date.now()
                });
                EduApp.toast.show('You raised your hand.');
            } else {
                state.handRaises = state.handRaises.filter(hr => hr.studentId !== user.id);
                EduApp.toast.show('You lowered your hand.');
            }
            EduApp.db.updateLiveClassState({ handRaises: state.handRaises });
            syncFromStorage();
        });

        // Chat send trigger
        const sendChat = () => {
            const input = backdrop.querySelector('#classroom-chat-input');
            const val = input.value.trim();
            if (val) {
                const state = EduApp.db.getLiveClassState();
                state.chat = state.chat || [];
                state.chat.push({
                    sender: user.name,
                    message: val,
                    isHost: false,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });
                EduApp.db.updateLiveClassState({ chat: state.chat });
                syncFromStorage();
                input.value = '';
            }
        };

        // Bind chat buttons
        backdrop.querySelector('#classroom-send-chat').addEventListener('click', sendChat);
        backdrop.querySelector('#classroom-chat-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendChat();
        });

        // Storage Event Listener for cross-tab updates
        const onStorageChange = (e) => {
            if (e.key === EduApp.db.KEYS.LIVE_CLASS_STATE) {
                syncFromStorage();
            }
        };
        window.addEventListener('storage', onStorageChange);

        const cleanup = () => {
            clearInterval(stayInterval);
            saveStayTime();
            window.removeEventListener('beforeunload', onUnload);
            window.removeEventListener('storage', onStorageChange);
            
            // Remove student from participants list
            const state = EduApp.db.getLiveClassState();
            state.participants = (state.participants || []).filter(p => p.studentId !== user.id);
            EduApp.db.updateLiveClassState({ participants: state.participants });
            
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
                localStream = null;
            }
        };

        // Leave Classroom
        backdrop.querySelector('#leave-class-btn').addEventListener('click', () => {
            cleanup();
            backdrop.remove();
            document.body.style.overflow = '';
            EduApp.toast.show('You left the classroom.');
        });

        // Initial sync call
        syncFromStorage();
    },
"@

$updatedContent = $content.Substring(0, $startIdx) + $newImpl + $content.Substring($endIdx)
[System.IO.File]::WriteAllText($path, $updatedContent, [System.Text.Encoding]::UTF8)

Write-Host "Replacement successful!"
