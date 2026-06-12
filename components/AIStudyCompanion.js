window.EduApp = window.EduApp || {};

EduApp.AIStudyCompanion = {
    isOpen: false,
    selectedSubject: 'Fractions & Decimals',
    chatHistory: [],

    render() {
        const widget = document.createElement('div');
        widget.id = 'ai-companion-widget';
        widget.className = 'ai-companion-collapsed';
        
        // Initialize default greeting if history is empty
        if (this.chatHistory.length === 0) {
            this.chatHistory.push({
                sender: 'ai',
                text: "Hello! I am your AI Study Companion. How can I help you master your classes today? Choose a subject below to customize my explanations!",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
        }

        this.updateWidgetContent(widget);
        return widget;
    },

    updateWidgetContent(widget) {
        if (!this.isOpen) {
            widget.className = 'ai-companion-collapsed';
            widget.innerHTML = `
                <button class="ai-trigger-btn" id="ai-trigger-btn" title="Open AI Study Companion">
                    <span class="ai-sparkle-icon">✨</span>
                    <span class="ai-btn-text">AI Study Companion</span>
                </button>
            `;
            
            widget.querySelector('#ai-trigger-btn').addEventListener('click', () => {
                this.isOpen = true;
                this.updateWidgetContent(widget);
            });
            return;
        }

        widget.className = 'ai-companion-expanded';
        
        // Generate chat history HTML
        const chatHtml = this.chatHistory.map(msg => {
            const isAi = msg.sender === 'ai';
            const bubbleClass = isAi ? 'ai-bubble' : 'user-bubble';
            const senderName = isAi ? 'AI Tutor' : 'You';
            return `
                <div class="chat-message-row ${isAi ? 'chat-row-ai' : 'chat-row-user'}">
                    <div style="font-size: 10px; color: var(--text-secondary); margin-bottom: 2px; font-weight: 700;">${senderName} &bull; ${msg.timestamp}</div>
                    <div class="chat-bubble ${bubbleClass}">${msg.text}</div>
                </div>
            `;
        }).join('');

        widget.innerHTML = `
            <!-- Chat Header -->
            <div class="ai-chat-header">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 18px;">✨</span>
                    <div>
                        <div style="font-family: var(--font-heading); font-weight: 800; font-size: 14px; color: white;">AI STUDY COMPANION</div>
                        <div style="font-size: 10px; color: #a5b4fc; font-weight: 600; text-transform: uppercase;">Active Tutor Mode</div>
                    </div>
                </div>
                <button class="ai-close-chat" id="ai-close-chat" title="Minimize chat">&times;</button>
            </div>

            <!-- Subject Toggles -->
            <div class="ai-subject-selector" style="display: flex; gap: 6px; flex-wrap: wrap; padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); background-color: rgba(255,255,255,0.02);">
                <span class="ai-subject-pill ${this.selectedSubject === 'Fractions & Decimals' ? 'active' : ''}" data-subject="Fractions & Decimals">🍕 Fractions & Decimals</span>
                <span class="ai-subject-pill ${this.selectedSubject === 'Integers & Algebra' ? 'active' : ''}" data-subject="Integers & Algebra">🔢 Integers & Algebra</span>
                <span class="ai-subject-pill ${this.selectedSubject === 'Geometry & Shapes' ? 'active' : ''}" data-subject="Geometry & Shapes">📐 Geometry & Shapes</span>
                <span class="ai-subject-pill ${this.selectedSubject === 'Factors & Multiples' ? 'active' : ''}" data-subject="Factors & Multiples">🧮 Factors & Multiples</span>
            </div>

            <!-- Chat Area -->
            <div class="ai-chat-body" id="ai-chat-body">
                ${chatHtml}
                <div id="ai-typing-indicator" class="ai-typing-indicator" style="display: none;">
                    <span></span><span></span><span></span>
                </div>
            </div>

            <!-- Suggestion Prompts -->
            <div class="ai-suggestions" id="ai-suggestions">
                <!-- Filled dynamically by active subject -->
            </div>

            <!-- Chat Input -->
            <div class="ai-chat-footer">
                <input type="text" id="ai-chat-input" placeholder="Ask a question about ${this.selectedSubject}..." autocomplete="off">
                <button id="ai-send-btn">Send</button>
            </div>
        `;

        // Scroll body to bottom
        const body = widget.querySelector('#ai-chat-body');
        body.scrollTop = body.scrollHeight;

        // Bind events
        widget.querySelector('#ai-close-chat').addEventListener('click', () => {
            this.isOpen = false;
            this.updateWidgetContent(widget);
        });

        // Subject selector pills
        const pills = widget.querySelectorAll('.ai-subject-pill');
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                this.selectedSubject = pill.getAttribute('data-subject');
                this.updateWidgetContent(widget);
            });
        });

        // Populate suggestions
        this.renderSuggestions(widget);

        // Send chat triggers
        const input = widget.querySelector('#ai-chat-input');
        const sendBtn = widget.querySelector('#ai-send-btn');

        const triggerSend = () => {
            const val = input.value.trim();
            if (val) {
                this.handleUserMessage(val, widget);
                input.value = '';
            }
        };

        sendBtn.addEventListener('click', triggerSend);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') triggerSend();
        });
    },

    renderSuggestions(widget) {
        const wrapper = widget.querySelector('#ai-suggestions');
        if (!wrapper) return;

        let suggestions = [];
        if (this.selectedSubject === 'Fractions & Decimals') {
            suggestions = [
                "How to add fractions",
                "What is a proper fraction?",
                "Convert 3/5 into a decimal"
            ];
        } else if (this.selectedSubject === 'Integers & Algebra') {
            suggestions = [
                "What is an integer?",
                "Evaluate (-5) + 8",
                "How to solve x - 4 = 10"
            ];
        } else if (this.selectedSubject === 'Geometry & Shapes') {
            suggestions = [
                "What is a ray in geometry?",
                "Perimeter of rectangle with length 8 and width 5",
                "Types of angles (acute/obtuse)"
            ];
        } else {
            // Factors & Multiples
            suggestions = [
                "Find HCF of 12 and 18",
                "Find LCM of 8 and 12",
                "What is a prime number?"
            ];
        }

        wrapper.innerHTML = suggestions.map(s => `
            <div class="ai-suggestion-bubble">${s}</div>
        `).join('');

        // Bind click events on suggestions
        wrapper.querySelectorAll('.ai-suggestion-bubble').forEach(bubble => {
            bubble.addEventListener('click', () => {
                this.handleUserMessage(bubble.textContent, widget);
            });
        });
    },

    handleUserMessage(text, widget) {
        // Append user message
        this.chatHistory.push({
            sender: 'user',
            text: text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

        this.updateWidgetContent(widget);

        // Show typing indicator
        const indicator = widget.querySelector('#ai-typing-indicator');
        if (indicator) indicator.style.display = 'block';

        const body = widget.querySelector('#ai-chat-body');
        body.scrollTop = body.scrollHeight;

        // Simulate AI response delay
        setTimeout(() => {
            const responseText = this.generateAIResponse(text);
            
            // Append AI response
            this.chatHistory.push({
                sender: 'ai',
                text: responseText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });

            this.updateWidgetContent(widget);
        }, 1200);
    },

    generateAIResponse(query) {
        const text = query.toLowerCase();
        const subject = this.selectedSubject;

        // 1. FRACTIONS & DECIMALS
        if (subject === 'Fractions & Decimals') {
            if (text.includes('add') || text.includes('subtract')) {
                return `<strong>Adding and Subtracting Fractions:</strong>
                <br><br>
                1. <strong>Same Denominators:</strong> Keep the denominator and add/subtract the numerators.
                <br>
                Example: <code>1/5 + 2/5 = (1+2)/5 = 3/5</code>
                <br><br>
                2. <strong>Unlike Denominators:</strong> Find the Least Common Denominator (LCD), convert to equivalent fractions, and then add/subtract.
                <br>
                Example: <code>1/2 + 1/3</code>
                <br>
                The LCD is 6.
                <br>
                Equivalent fractions: <code>1/2 = 3/6</code> and <code>1/3 = 2/6</code>.
                <br>
                Sum: <code>3/6 + 2/6 = 5/6</code>.`;
            }
            if (text.includes('proper') || text.includes('improper') || text.includes('type')) {
                return `Here are the types of fractions:
                <ul style="margin-left: 20px; margin-top: 8px; line-height: 1.6;">
                    <li><strong>Proper Fractions:</strong> Numerator is smaller than denominator. Represents a value less than 1. E.g., <code>2/3, 5/8</code>.</li>
                    <li><strong>Improper Fractions:</strong> Numerator is equal to or larger than denominator. Represents a value equal to or greater than 1. E.g., <code>7/4, 5/5</code>.</li>
                    <li><strong>Mixed Numbers:</strong> A whole number combined with a proper fraction. E.g., <code>1 3/4</code> (which is equivalent to <code>7/4</code>).</li>
                </ul>`;
            }
            if (text.includes('convert') || text.includes('decimal')) {
                return `To convert a fraction to a decimal, divide the numerator (top) by the denominator (bottom):
                <br><br>
                <strong>Examples:</strong>
                <ul>
                    <li><code>1/2 = 1 ÷ 2 = 0.5</code></li>
                    <li><code>3/4 = 3 ÷ 4 = 0.75</code></li>
                    <li><code>3/5 = 3 ÷ 5 = 0.6</code></li>
                    <li><code>5/8 = 5 ÷ 8 = 0.625</code></li>
                </ul>`;
            }
            return `Here is a helpful tip for Fractions: To find <strong>equivalent fractions</strong>, multiply or divide both the numerator and the denominator by the same non-zero number. E.g., <code>1/3 = 2/6 = 3/9</code>.
            <br><br>
            What fraction question would you like to solve next?`;
        }

        // 2. INTEGERS & ALGEBRA
        if (subject === 'Integers & Algebra') {
            if (text.includes('what is') && (text.includes('integer') || text.includes('integers'))) {
                return `<strong>Integers</strong> are whole numbers and their negative opposites.
                <br><br>
                They include:
                <ul>
                    <li><strong>Positive integers:</strong> 1, 2, 3, 4, 5...</li>
                    <li><strong>Negative integers:</strong> -1, -2, -3, -4...</li>
                    <li><strong>Zero:</strong> Neither positive nor negative.</li>
                </ul>
                Negative numbers represent values less than zero, like temperatures below freezing (-5°C) or money owed.`;
            }
            if (text.includes('(-5) + 8') || text.includes('-5 + 8') || text.includes('evaluate') || text.includes('add')) {
                return `Let's solve <code>(-5) + 8</code> step-by-step:
                <br><br>
                1. <strong>Think of a number line:</strong> Start at 0, move 5 steps to the left (representing -5), then move 8 steps to the right (representing +8). You will land on <strong>3</strong>.
                <br><br>
                2. <strong>Using signs rule:</strong> Since the signs are different, subtract their absolute values: <code>8 - 5 = 3</code>. The sign of the larger absolute value (8 is positive) determines the result sign, so the answer is <strong>+3</strong>.`;
            }
            if (text.includes('solve') || text.includes('equation') || text.includes('x - 4')) {
                return `To solve a simple equation like <code>x - 4 = 10</code>:
                <br><br>
                1. We want to isolate the variable (x) on one side of the equation.
                <br>
                2. Perform the inverse (opposite) operation. The opposite of subtracting 4 is adding 4.
                <br>
                3. Add 4 to both sides:
                <br>
                <code>x - 4 + 4 = 10 + 4</code>
                <br>
                <code>x = 14</code>
                <br><br>
                Thus, the solution is <strong>x = 14</strong>!`;
            }
            return `Here is a useful tip for Integers: The **absolute value** of an integer is its distance from zero on the number line, which is always positive or zero. E.g., <code>|-10| = 10</code> and <code>|4| = 4</code>.
            <br><br>
            What equation or integer problem can I help you with today?`;
        }

        // 3. GEOMETRY & SHAPES
        if (subject === 'Geometry & Shapes') {
            if (text.includes('ray')) {
                return `In geometry, let's understand lines, segments, and rays:
                <ul>
                    <li><strong>Line:</strong> Extends infinitely in both directions (has zero endpoints).</li>
                    <li><strong>Line Segment:</strong> A straight path with two fixed endpoints. It has a measurable length.</li>
                    <li><strong>Ray:</strong> Starts at one endpoint and extends infinitely in the other direction (has one endpoint).</li>
                </ul>`;
            }
            if (text.includes('perimeter') || text.includes('rectangle') || text.includes('length')) {
                return `Let's find the perimeter of a rectangle with length 8 cm and width 5 cm:
                <br><br>
                <strong>Formula:</strong> <code>Perimeter = 2 * (length + width)</code>
                <br><br>
                1. Add the length and width: <code>8 + 5 = 13</code>
                <br>
                2. Multiply the sum by 2: <code>2 * 13 = 26</code>
                <br><br>
                So, the perimeter is <strong>26 cm</strong>!`;
            }
            if (text.includes('angle') || text.includes('acute') || text.includes('obtuse')) {
                return `Angles are classified based on their measures:
                <ul>
                    <li><strong>Acute Angle:</strong> Greater than 0° and less than 90°.</li>
                    <li><strong>Right Angle:</strong> Exactly 90°.</li>
                    <li><strong>Obtuse Angle:</strong> Greater than 90° and less than 180°.</li>
                    <li><strong>Straight Angle:</strong> Exactly 180°.</li>
                    <li><strong>Reflex Angle:</strong> Greater than 180° and less than 360°.</li>
                </ul>`;
            }
            return `Here is a geometry formula lookup:
            <br>
            - <strong>Perimeter of Square:</strong> <code>4 * side</code>
            <br>
            - <strong>Area of Square:</strong> <code>side * side</code>
            <br>
            - <strong>Area of Rectangle:</strong> <code>length * width</code>
            <br><br>
            Would you like to solve a specific geometry problem?`;
        }

        // 4. FACTORS & MULTIPLES
        if (subject === 'Factors & Multiples') {
            if (text.includes('hcf') || text.includes('12 and 18')) {
                return `Let's find the Highest Common Factor (HCF) of 12 and 18:
                <br><br>
                1. <strong>Factors of 12:</strong> 1, 2, 3, 4, 6, 12
                <br>
                2. <strong>Factors of 18:</strong> 1, 2, 3, 6, 9, 18
                <br>
                3. <strong>Common Factors:</strong> 1, 2, 3, 6
                <br>
                4. The largest common factor is <strong>6</strong>.
                <br><br>
                So, the HCF of 12 and 18 is <strong>6</strong>.`;
            }
            if (text.includes('lcm') || text.includes('8 and 12')) {
                return `Let's find the Least Common Multiple (LCM) of 8 and 12:
                <br><br>
                1. <strong>Multiples of 8:</strong> 8, 16, 24, 32, 40, 48...
                <br>
                2. <strong>Multiples of 12:</strong> 12, 24, 36, 48, 60...
                <br>
                3. <strong>Common Multiples:</strong> 24, 48...
                <br>
                4. The smallest common multiple is <strong>24</strong>.
                <br><br>
                So, the LCM of 8 and 12 is <strong>24</strong>.`;
            }
            if (text.includes('prime') || text.includes('composite')) {
                return `Numbers are classified based on their factors:
                <ul>
                    <li><strong>Prime Numbers:</strong> Numbers greater than 1 that have exactly two factors: 1 and themselves (e.g., <code>2, 3, 5, 7, 11, 13, 17...</code>).</li>
                    <li><strong>Composite Numbers:</strong> Numbers that have more than two factors (e.g., <code>4, 6, 8, 9, 10, 12...</code>).</li>
                    <li><strong>Note:</strong> 1 is neither prime nor composite because it has only one factor (itself).</li>
                </ul>`;
            }
            return `Here is a tip for Factors & Multiples: You can use the **Factor Tree** method for prime factorization. E.g., for 12, split it into <code>2 * 6</code>, then split 6 into <code>2 * 3</code>, which gives the prime factors: <code>2 * 2 * 3</code> (or <code>2<sup>2</sup> * 3</code>).
            <br><br>
            What factors or multiples question can we work on?`;
        }

        return `I'm on it! That sounds like an interesting topic. Can you rephrase or ask something specific about **${subject}**? I can explain equations, core rules, or solve step-by-step examples!`;
    }
};
