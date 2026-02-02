// Technology Interactive Features
// Progress Tracking & Gamification System

class TechnologyLearning {
    constructor() {
        this.progress = this.loadProgress();
        this.init();
    }

    init() {
        this.setupQuizzes();
        this.setupVirtualTools();
        this.setupProgressTracking();
        this.setupAnimations();
        this.updateProgressBar();
        this.checkAchievements();
    }

    // ============ PROGRESS TRACKING & GAMIFICATION ============
    loadProgress() {
        const saved = localStorage.getItem('techProgress');
        return saved ? JSON.parse(saved) : {
            points: 0,
            level: 1,
            badges: [],
            completedQuizzes: [],
            completedActivities: [],
            streak: 0,
            lastVisit: new Date().toDateString()
        };
    }

    saveProgress() {
        localStorage.setItem('techProgress', JSON.stringify(this.progress));
    }

    addPoints(points, reason) {
        this.progress.points += points;
        this.showPointsPopup(points, reason);
        this.checkLevelUp();
        this.saveProgress();
        this.updateProgressBar();
    }

    checkLevelUp() {
        const newLevel = Math.floor(this.progress.points / 100) + 1;
        if (newLevel > this.progress.level) {
            this.progress.level = newLevel;
            this.showLevelUpAnimation(newLevel);
            this.unlockBadge(this.getLevelBadge(newLevel));
        }
    }

    getLevelBadge(level) {
        const badges = {
            1: { icon: '🔧', name: 'Beginner Builder', color: '#6366f1' },
            2: { icon: '🛠️', name: 'Apprentice Maker', color: '#ec4899' },
            3: { icon: '⚙️', name: 'Skilled Craftsperson', color: '#22c55e' },
            4: { icon: '🏗️', name: 'Expert Engineer', color: '#fbbf24' },
            5: { icon: '🏆', name: 'Master Innovator', color: '#a855f7' }
        };
        return badges[Math.min(level, 5)];
    }

    unlockBadge(badge) {
        if (!this.progress.badges.find(b => b.name === badge.name)) {
            this.progress.badges.push(badge);
            this.showBadgeUnlock(badge);
            this.saveProgress();
        }
    }

    showPointsPopup(points, reason) {
        const popup = document.createElement('div');
        popup.className = 'points-popup';
        popup.innerHTML = `
            <div class="points-animation">
                +${points} XP
                <div class="points-reason">${reason}</div>
            </div>
        `;
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 2000);
    }

    showLevelUpAnimation(level) {
        const overlay = document.createElement('div');
        overlay.className = 'level-up-overlay';
        overlay.innerHTML = `
            <div class="level-up-card">
                <div class="level-up-icon">🎉</div>
                <h2>LEVEL UP!</h2>
                <div class="new-level">Level ${level}</div>
                <div class="level-badge">${this.getLevelBadge(level).icon}</div>
                <div class="level-name">${this.getLevelBadge(level).name}</div>
                <button onclick="this.parentElement.parentElement.remove()" class="continue-btn">Continue Learning! 🚀</button>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    showBadgeUnlock(badge) {
        const notification = document.createElement('div');
        notification.className = 'badge-unlock';
        notification.innerHTML = `
            <div class="badge-content">
                <span class="badge-icon">${badge.icon}</span>
                <div>
                    <div class="badge-title">Badge Unlocked!</div>
                    <div class="badge-name">${badge.name}</div>
                </div>
            </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    updateProgressBar() {
        const progressContainer = document.getElementById('progress-tracker');
        if (!progressContainer) return;

        const pointsToNextLevel = ((this.progress.level) * 100) - this.progress.points;
        const progressPercent = ((this.progress.points % 100) / 100) * 100;

        progressContainer.innerHTML = `
            <div class="progress-header">
                <div class="player-info">
                    <span class="player-level">${this.getLevelBadge(this.progress.level).icon} Level ${this.progress.level}</span>
                    <span class="player-title">${this.getLevelBadge(this.progress.level).name}</span>
                </div>
                <div class="player-stats">
                    <span class="stat-item">⚡ ${this.progress.points} XP</span>
                    <span class="stat-item">🏆 ${this.progress.badges.length} Badges</span>
                </div>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${progressPercent}%"></div>
            </div>
            <div class="progress-info">${100 - Math.floor(progressPercent)} XP to Level ${this.progress.level + 1}</div>
            ${this.renderBadges()}
        `;
    }

    renderBadges() {
        if (this.progress.badges.length === 0) return '';
        return `
            <div class="badges-display">
                <h4>🏆 Your Badges</h4>
                <div class="badges-grid">
                    ${this.progress.badges.map(badge => `
                        <div class="badge-item" style="border-color: ${badge.color}">
                            <span class="badge-icon-large">${badge.icon}</span>
                            <span class="badge-name-small">${badge.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // ============ INTERACTIVE QUIZZES ============
    setupQuizzes() {
        document.querySelectorAll('.interactive-quiz').forEach(quiz => {
            const quizId = quiz.dataset.quizId;
            const questions = JSON.parse(quiz.dataset.questions);
            this.renderQuiz(quiz, questions, quizId);
        });
    }

    renderQuiz(container, questions, quizId) {
        let currentQuestion = 0;
        let score = 0;
        let answers = [];

        const render = () => {
            if (currentQuestion >= questions.length) {
                this.showQuizResults(container, score, questions.length, quizId, answers);
                return;
            }

            const q = questions[currentQuestion];
            container.innerHTML = `
                <div class="quiz-container">
                    <div class="quiz-header">
                        <div class="quiz-progress">Question ${currentQuestion + 1}/${questions.length}</div>
                        <div class="quiz-score">Score: ${score}/${currentQuestion}</div>
                    </div>
                    <div class="quiz-question">
                        <h4>${q.question}</h4>
                        ${q.image ? `<img src="${q.image}" alt="Question illustration" class="quiz-image">` : ''}
                    </div>
                    <div class="quiz-options">
                        ${q.options.map((option, idx) => `
                            <button class="quiz-option" data-index="${idx}">
                                <span class="option-letter">${String.fromCharCode(65 + idx)}</span>
                                <span class="option-text">${option}</span>
                            </button>
                        `).join('')}
                    </div>
                    <div class="quiz-feedback" style="display: none;"></div>
                </div>
            `;

            container.querySelectorAll('.quiz-option').forEach(btn => {
                btn.addEventListener('click', () => {
                    const selectedIndex = parseInt(btn.dataset.index);
                    const isCorrect = selectedIndex === q.correct;
                    
                    answers.push({
                        question: q.question,
                        selected: q.options[selectedIndex],
                        correct: q.options[q.correct],
                        isCorrect
                    });

                    // Disable all buttons
                    container.querySelectorAll('.quiz-option').forEach(b => b.disabled = true);

                    // Show feedback
                    if (isCorrect) {
                        btn.classList.add('correct');
                        score++;
                        this.showFeedback(container, true, q.explanation);
                        this.addPoints(10, 'Correct Answer! 🎯');
                    } else {
                        btn.classList.add('incorrect');
                        container.querySelectorAll('.quiz-option')[q.correct].classList.add('correct');
                        this.showFeedback(container, false, q.explanation);
                    }

                    // Next question button
                    setTimeout(() => {
                        const nextBtn = document.createElement('button');
                        nextBtn.className = 'quiz-next-btn';
                        nextBtn.textContent = currentQuestion < questions.length - 1 ? 'Next Question →' : 'See Results 🎉';
                        nextBtn.onclick = () => {
                            currentQuestion++;
                            render();
                        };
                        container.querySelector('.quiz-feedback').appendChild(nextBtn);
                    }, 1500);
                });
            });
        };

        render();
    }

    showFeedback(container, isCorrect, explanation) {
        const feedback = container.querySelector('.quiz-feedback');
        feedback.style.display = 'block';
        feedback.innerHTML = `
            <div class="feedback-content ${isCorrect ? 'correct' : 'incorrect'}">
                <div class="feedback-icon">${isCorrect ? '✅' : '❌'}</div>
                <div class="feedback-text">
                    <strong>${isCorrect ? 'Correct!' : 'Not quite!'}</strong>
                    <p>${explanation}</p>
                </div>
            </div>
        `;
    }

    showQuizResults(container, score, total, quizId, answers) {
        const percentage = Math.round((score / total) * 100);
        const passed = percentage >= 70;

        if (passed && !this.progress.completedQuizzes.includes(quizId)) {
            this.progress.completedQuizzes.push(quizId);
            this.addPoints(50, 'Quiz Completed! 🎓');
            this.saveProgress();
        }

        container.innerHTML = `
            <div class="quiz-results">
                <div class="results-icon">${passed ? '🏆' : '📚'}</div>
                <h3>${passed ? 'Excellent Work!' : 'Keep Learning!'}</h3>
                <div class="results-score">
                    <div class="score-circle">
                        <div class="score-number">${percentage}%</div>
                        <div class="score-label">${score}/${total} correct</div>
                    </div>
                </div>
                <div class="results-message">
                    ${passed 
                        ? '🎉 You\'ve mastered this topic! Ready for the next challenge?' 
                        : '💪 Review the material and try again to improve your score!'}
                </div>
                <div class="results-details">
                    <h4>Review Your Answers:</h4>
                    ${answers.map((ans, idx) => `
                        <div class="answer-review ${ans.isCorrect ? 'correct' : 'incorrect'}">
                            <div class="review-header">
                                <span class="review-icon">${ans.isCorrect ? '✅' : '❌'}</span>
                                <span>Question ${idx + 1}</span>
                            </div>
                            <div class="review-question">${ans.question}</div>
                            <div class="review-answer">
                                <span class="label">Your answer:</span> ${ans.selected}
                            </div>
                            ${!ans.isCorrect ? `
                                <div class="review-correct">
                                    <span class="label">Correct answer:</span> ${ans.correct}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
                <div class="results-actions">
                    <button onclick="location.reload()" class="retry-btn">🔄 Retake Quiz</button>
                    <button onclick="window.scrollTo({top: document.querySelector('.quiz-results').offsetTop + 1000, behavior: 'smooth'})" class="continue-btn">Continue Learning →</button>
                </div>
            </div>
        `;
    }

    // ============ VIRTUAL TOOLS ============
    setupVirtualTools() {
        this.setupForceCalculator();
        this.setupMaterialSelector();
        this.setupStrengthTester();
    }

    setupForceCalculator() {
        const calculator = document.getElementById('force-calculator');
        if (!calculator) return;

        calculator.innerHTML = `
            <div class="virtual-tool">
                <h3>🧮 Force Calculator</h3>
                <div class="tool-description">Calculate forces acting on structures</div>
                
                <div class="calculator-inputs">
                    <div class="input-group">
                        <label>Force Type:</label>
                        <select id="force-type" class="tool-select">
                            <option value="compression">Compression (Squeezing)</option>
                            <option value="tension">Tension (Pulling)</option>
                            <option value="shear">Shear (Sliding)</option>
                        </select>
                    </div>
                    
                    <div class="input-group">
                        <label>Load (kg):</label>
                        <input type="number" id="load-input" class="tool-input" value="10" min="1" max="1000">
                    </div>
                    
                    <div class="input-group">
                        <label>Area (cm²):</label>
                        <input type="number" id="area-input" class="tool-input" value="100" min="1" max="10000">
                    </div>
                    
                    <button onclick="techLearning.calculateForce()" class="calculate-btn">Calculate 🔍</button>
                </div>
                
                <div id="force-result" class="tool-result" style="display: none;"></div>
            </div>
        `;
    }

    calculateForce() {
        const forceType = document.getElementById('force-type').value;
        const load = parseFloat(document.getElementById('load-input').value);
        const area = parseFloat(document.getElementById('area-input').value);

        const force = (load * 9.8); // Convert kg to Newtons
        const pressure = force / (area / 10000); // Convert cm² to m²

        const resultDiv = document.getElementById('force-result');
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <div class="result-card">
                <div class="result-header">📊 Calculation Results</div>
                <div class="result-item">
                    <span class="result-label">Force:</span>
                    <span class="result-value">${force.toFixed(2)} N</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Pressure:</span>
                    <span class="result-value">${pressure.toFixed(2)} Pa</span>
                </div>
                <div class="result-visualization">
                    <div class="force-animation ${forceType}">
                        ${this.getForceVisualization(forceType)}
                    </div>
                </div>
                <div class="result-tip">
                    💡 <strong>Tip:</strong> ${this.getForceTip(forceType, pressure)}
                </div>
            </div>
        `;

        this.addPoints(5, 'Used Force Calculator 🧮');
    }

    getForceVisualization(type) {
        const visuals = {
            compression: '<div class="compression-demo">⬇️ ▬▬▬ ⬇️<br/>Squeezing Force</div>',
            tension: '<div class="tension-demo">⬆️ ▬▬▬ ⬆️<br/>Pulling Force</div>',
            shear: '<div class="shear-demo">➡️ ▬▬▬ ⬅️<br/>Sliding Force</div>'
        };
        return visuals[type] || '';
    }

    getForceTip(type, pressure) {
        if (pressure > 100000) {
            return 'High pressure! Consider using stronger materials or increasing the area.';
        } else if (pressure > 50000) {
            return 'Moderate pressure. Standard materials should work well.';
        } else {
            return 'Low pressure. Most materials will easily handle this load.';
        }
    }

    setupMaterialSelector() {
        const selector = document.getElementById('material-selector');
        if (!selector) return;

        const materials = [
            { name: 'Wood (Pine)', strength: 40, weight: 'Light', cost: '$', flexibility: 'Medium', icon: '🌲', description: 'Easy to work with, good for beginners' },
            { name: 'Steel', strength: 95, weight: 'Heavy', cost: '$$$', flexibility: 'Low', icon: '⚙️', description: 'Very strong, requires special tools' },
            { name: 'Aluminum', strength: 70, weight: 'Light', cost: '$$', flexibility: 'Medium', icon: '✨', description: 'Strong and lightweight, easy to shape' },
            { name: 'Plastic (PVC)', strength: 30, weight: 'Very Light', cost: '$', flexibility: 'High', icon: '🔷', description: 'Waterproof, easy to cut and join' },
            { name: 'Cardboard', strength: 15, weight: 'Very Light', cost: '$', flexibility: 'High', icon: '📦', description: 'Great for prototypes and models' },
            { name: 'Concrete', strength: 85, weight: 'Very Heavy', cost: '$$', flexibility: 'None', icon: '🏗️', description: 'Excellent compression strength' }
        ];

        selector.innerHTML = `
            <div class="virtual-tool">
                <h3>🔍 Material Selector</h3>
                <div class="tool-description">Compare properties of different materials</div>
                
                <div class="material-grid">
                    ${materials.map((mat, idx) => `
                        <div class="material-card" onclick="techLearning.showMaterialDetails(${idx})">
                            <div class="material-icon">${mat.icon}</div>
                            <div class="material-name">${mat.name}</div>
                            <div class="material-strength">
                                <div class="strength-bar">
                                    <div class="strength-fill" style="width: ${mat.strength}%"></div>
                                </div>
                                <span class="strength-label">Strength: ${mat.strength}/100</span>
                            </div>
                            <div class="material-props">
                                <span>⚖️ ${mat.weight}</span>
                                <span>💰 ${mat.cost}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div id="material-details" class="material-details" style="display: none;"></div>
            </div>
        `;

        this.materials = materials;
    }

    showMaterialDetails(index) {
        const mat = this.materials[index];
        const details = document.getElementById('material-details');
        details.style.display = 'block';
        details.innerHTML = `
            <div class="details-card">
                <div class="details-header">
                    <span class="details-icon">${mat.icon}</span>
                    <h4>${mat.name}</h4>
                </div>
                <p class="details-description">${mat.description}</p>
                <div class="details-properties">
                    <div class="property-item">
                        <span class="property-label">💪 Strength:</span>
                        <div class="property-bar">
                            <div class="property-fill" style="width: ${mat.strength}%; background: #22c55e;"></div>
                        </div>
                    </div>
                    <div class="property-row">
                        <span>⚖️ Weight: <strong>${mat.weight}</strong></span>
                        <span>💰 Cost: <strong>${mat.cost}</strong></span>
                        <span>🔄 Flexibility: <strong>${mat.flexibility}</strong></span>
                    </div>
                </div>
                <div class="details-recommendation">
                    💡 <strong>Best for:</strong> ${this.getMaterialUse(mat)}
                </div>
            </div>
        `;

        details.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        this.addPoints(3, 'Explored Materials 🔍');
    }

    getMaterialUse(mat) {
        const uses = {
            'Wood (Pine)': 'Furniture, structures, prototypes',
            'Steel': 'Buildings, bridges, heavy-duty structures',
            'Aluminum': 'Aircraft, lightweight frames, outdoor structures',
            'Plastic (PVC)': 'Pipes, waterproof containers, lightweight projects',
            'Cardboard': 'Models, prototypes, art projects',
            'Concrete': 'Foundations, walls, permanent structures'
        };
        return uses[mat.name] || 'General construction';
    }

    setupStrengthTester() {
        const tester = document.getElementById('strength-tester');
        if (!tester) return;

        tester.innerHTML = `
            <div class="virtual-tool">
                <h3>🎯 Virtual Strength Tester</h3>
                <div class="tool-description">Test how much weight different shapes can hold</div>
                
                <div class="tester-controls">
                    <div class="shape-selector">
                        <h4>Choose a Shape:</h4>
                        <div class="shape-options">
                            <button class="shape-btn active" data-shape="square" onclick="techLearning.selectShape('square')">
                                <div class="shape-icon">⬜</div>
                                <span>Square</span>
                            </button>
                            <button class="shape-btn" data-shape="triangle" onclick="techLearning.selectShape('triangle')">
                                <div class="shape-icon">🔺</div>
                                <span>Triangle</span>
                            </button>
                            <button class="shape-btn" data-shape="circle" onclick="techLearning.selectShape('circle')">
                                <div class="shape-icon">⭕</div>
                                <span>Circle</span>
                            </button>
                            <button class="shape-btn" data-shape="hexagon" onclick="techLearning.selectShape('hexagon')">
                                <div class="shape-icon">⬡</div>
                                <span>Hexagon</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="weight-control">
                        <h4>Add Weight (kg):</h4>
                        <input type="range" id="weight-slider" min="0" max="100" value="0" 
                               oninput="techLearning.updateWeight(this.value)" class="weight-slider">
                        <div class="weight-display" id="weight-display">0 kg</div>
                    </div>
                </div>
                
                <div id="strength-visualization" class="strength-visualization">
                    <div class="test-structure" id="test-structure">
                        <div class="structure-shape square">⬜</div>
                        <div class="applied-weight" id="applied-weight" style="display: none;">0kg</div>
                    </div>
                    <div class="test-result" id="test-result"></div>
                </div>
            </div>
        `;

        this.currentShape = 'square';
        this.currentWeight = 0;
    }

    selectShape(shape) {
        this.currentShape = shape;
        document.querySelectorAll('.shape-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-shape="${shape}"]`).classList.add('active');
        
        const icons = { square: '⬜', triangle: '🔺', circle: '⭕', hexagon: '⬡' };
        const shapeElement = document.querySelector('.structure-shape');
        shapeElement.textContent = icons[shape];
        shapeElement.className = `structure-shape ${shape}`;
        
        this.updateWeight(this.currentWeight);
    }

    updateWeight(weight) {
        this.currentWeight = parseInt(weight);
        document.getElementById('weight-display').textContent = `${weight} kg`;
        
        const weightElement = document.getElementById('applied-weight');
        weightElement.style.display = weight > 0 ? 'block' : 'none';
        weightElement.textContent = `${weight}kg`;
        
        const shapeElement = document.querySelector('.structure-shape');
        const resultElement = document.getElementById('test-result');
        
        const maxWeights = { square: 50, triangle: 80, circle: 65, hexagon: 75 };
        const maxWeight = maxWeights[this.currentShape];
        
        const stress = (weight / maxWeight) * 100;
        
        if (stress > 100) {
            shapeElement.style.transform = 'scale(0.5) rotate(15deg)';
            shapeElement.style.opacity = '0.3';
            resultElement.innerHTML = `
                <div class="result-fail">
                    ❌ <strong>STRUCTURE FAILED!</strong><br>
                    <span>Too much weight! Try a stronger shape.</span>
                </div>
            `;
            this.addPoints(2, 'Tested to failure! 💥');
        } else if (stress > 80) {
            shapeElement.style.transform = `scale(${1 - stress/200}) rotate(${stress/10}deg)`;
            shapeElement.style.opacity = '0.7';
            resultElement.innerHTML = `
                <div class="result-warning">
                    ⚠️ <strong>CRITICAL STRESS!</strong><br>
                    <span>Structure is near failure point.</span>
                </div>
            `;
        } else if (stress > 0) {
            shapeElement.style.transform = `scale(${1 - stress/400})`;
            shapeElement.style.opacity = '1';
            resultElement.innerHTML = `
                <div class="result-success">
                    ✅ <strong>HOLDING STRONG!</strong><br>
                    <span>Stress level: ${stress.toFixed(0)}%</span>
                </div>
            `;
        } else {
            shapeElement.style.transform = 'scale(1)';
            shapeElement.style.opacity = '1';
            resultElement.innerHTML = '';
        }
    }

    // ============ ANIMATIONS ============
    setupAnimations() {
        // Animate force demonstrations
        this.animateForces();
        
        // Scroll animations
        this.setupScrollAnimations();
        
        // Interactive diagrams
        this.setupInteractiveDiagrams();
    }

    animateForces() {
        document.querySelectorAll('.force-demo').forEach(demo => {
            demo.addEventListener('click', () => {
                demo.classList.add('animated');
                setTimeout(() => demo.classList.remove('animated'), 2000);
            });
        });
    }

    setupScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    }

    setupInteractiveDiagrams() {
        document.querySelectorAll('.clickable-diagram').forEach(diagram => {
            const parts = diagram.querySelectorAll('[data-info]');
            parts.forEach(part => {
                part.addEventListener('click', () => {
                    const info = part.dataset.info;
                    this.showDiagramInfo(diagram, info);
                    this.addPoints(2, 'Explored diagram 🔍');
                });
            });
        });
    }

    showDiagramInfo(diagram, info) {
        let infoBox = diagram.querySelector('.diagram-info');
        if (!infoBox) {
            infoBox = document.createElement('div');
            infoBox.className = 'diagram-info';
            diagram.appendChild(infoBox);
        }
        infoBox.innerHTML = info;
        infoBox.style.display = 'block';
        setTimeout(() => infoBox.style.display = 'none', 5000);
    }

    // ============ ACTIVITY TRACKING ============
    checkAchievements() {
        // Check streak
        const today = new Date().toDateString();
        if (this.progress.lastVisit !== today) {
            this.progress.streak++;
            this.progress.lastVisit = today;
            this.saveProgress();
            
            if (this.progress.streak === 3) {
                this.unlockBadge({ icon: '🔥', name: '3-Day Streak', color: '#ef4444' });
            } else if (this.progress.streak === 7) {
                this.unlockBadge({ icon: '⚡', name: 'Week Warrior', color: '#fbbf24' });
            }
        }
        
        // Check quiz achievements
        if (this.progress.completedQuizzes.length >= 3) {
            this.unlockBadge({ icon: '🎓', name: 'Quiz Master', color: '#6366f1' });
        }
        
        // Check points milestones
        if (this.progress.points >= 500) {
            this.unlockBadge({ icon: '💎', name: 'Point Collector', color: '#06b6d4' });
        }
    }
}

// Initialize when page loads
let techLearning;
document.addEventListener('DOMContentLoaded', () => {
    techLearning = new TechnologyLearning();
});
