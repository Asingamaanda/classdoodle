// ===================================
// ClassDoodle Textbook Interactions
// ===================================

// ===== QUIZ-BASED ANSWER UNLOCK SYSTEM =====
const quizState = {};

function initQuiz(quizId, answers) {
    quizState[quizId] = {
        answers: answers,
        selected: {},
        score: 0,
        submitted: false
    };
}

function selectAnswer(quizId, questionNum, selectedOption) {
    if (quizState[quizId].submitted) return;
    
    quizState[quizId].selected[questionNum] = selectedOption;
    
    // Update visual feedback
    const buttons = document.querySelectorAll(`#${quizId} .q${questionNum} button`);
    buttons.forEach(btn => {
        btn.style.background = '#334155';
        btn.style.transform = 'scale(1)';
    });
    
    const selectedBtn = document.querySelector(`#${quizId} .q${questionNum} .opt${selectedOption}`);
    if (selectedBtn) {
        selectedBtn.style.background = '#6366f1';
        selectedBtn.style.transform = 'scale(1.05)';
    }
    
    // Check if all questions answered
    const totalQuestions = Object.keys(quizState[quizId].answers).length;
    const answeredCount = Object.keys(quizState[quizId].selected).length;
    
    const submitBtn = document.getElementById(`submit-${quizId}`);
    if (answeredCount === totalQuestions) {
        submitBtn.disabled = false;
        submitBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
        submitBtn.style.cursor = 'pointer';
    }
}

function submitQuiz(quizId, solutionId) {
    const quiz = quizState[quizId];
    if (quiz.submitted) return;
    
    quiz.submitted = true;
    let correctCount = 0;
    
    // Grade each question
    Object.keys(quiz.answers).forEach(qNum => {
        const correctAnswer = quiz.answers[qNum];
        const userAnswer = quiz.selected[qNum];
        const isCorrect = userAnswer === correctAnswer;
        
        if (isCorrect) correctCount++;
        
        // Show feedback
        const buttons = document.querySelectorAll(`#${quizId} .q${qNum} button`);
        buttons.forEach((btn, idx) => {
            btn.disabled = true;
            btn.style.cursor = 'not-allowed';
            
            // Highlight correct answer in green
            if (idx + 1 === correctAnswer) {
                btn.style.background = '#16a34a';
                btn.style.border = '2px solid #22c55e';
                btn.innerHTML += ' ✓';
            }
            // Highlight wrong selection in red
            else if (idx + 1 === userAnswer && userAnswer !== correctAnswer) {
                btn.style.background = '#991b1b';
                btn.style.border = '2px solid #dc2626';
                btn.innerHTML += ' ✗';
            }
        });
    });
    
    quiz.score = correctCount;
    
    // Show results
    const resultDiv = document.getElementById(`result-${quizId}`);
    const solutionDiv = document.getElementById(solutionId);
    const submitBtn = document.getElementById(`submit-${quizId}`);
    
    submitBtn.style.display = 'none';
    resultDiv.style.display = 'block';
    
    if (correctCount >= 8) {
        resultDiv.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))';
        resultDiv.style.border = '2px solid #22c55e';
        resultDiv.innerHTML = `
            <div style="text-align: center; padding: 1rem;">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">🎉</div>
                <h3 style="color: #22c55e; margin-bottom: 0.5rem;">UNLOCKED!</h3>
                <p style="font-size: 1.2rem; margin-bottom: 0.5rem;">Score: <strong>${correctCount}/10</strong></p>
                <p style="color: #22c55e;">You've proven your understanding! Scroll down to see detailed solutions.</p>
            </div>
        `;
        
        setTimeout(() => {
            solutionDiv.style.display = 'block';
            solutionDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 1000);
    } else {
        resultDiv.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))';
        resultDiv.style.border = '2px solid #ef4444';
        resultDiv.innerHTML = `
            <div style="text-align: center; padding: 1rem;">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">🔒</div>
                <h3 style="color: #ef4444; margin-bottom: 0.5rem;">LOCKED</h3>
                <p style="font-size: 1.2rem; margin-bottom: 0.5rem;">Score: <strong>${correctCount}/10</strong></p>
                <p style="color: #ef4444;">You need 8/10 to unlock solutions. Review the chapter content above and try again!</p>
                <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #6366f1; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Try Again</button>
            </div>
        `;
    }
}

// ===== ACTIVE CHAPTER HIGHLIGHTING =====
// Automatically highlights the current chapter in sidebar as you scroll
const sections = document.querySelectorAll('.chapter');
const links = document.querySelectorAll('.chapter-list a');

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Remove active class from all links
        links.forEach(link => link.classList.remove('active'));
        
        // Add active class to current chapter link
        const activeLink = document.querySelector(
          `.chapter-list a[href="#${entry.target.id}"]`
        );
        if (activeLink) {
          activeLink.classList.add('active');
        }
      }
    });
  },
  { 
    threshold: 0.3,
    rootMargin: '-100px 0px -60% 0px'
  }
);

// Observe all chapter sections
sections.forEach(section => observer.observe(section));

// ===== SMOOTH SCROLL FOR CHAPTER LINKS =====
links.forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    const targetSection = document.querySelector(targetId);
    
    if (targetSection) {
      const offsetTop = targetSection.offsetTop - 100;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
      
      // Update URL without jumping
      history.pushState(null, null, targetId);
    }
  });
});

// ===== PRINT/DOWNLOAD FUNCTIONALITY =====
const downloadBtn = document.querySelector('.download-btn');
const downloadBtnLarge = document.querySelector('.download-btn-large');

function handleDownload() {
  // Trigger browser print dialog for PDF export
  window.print();
}

if (downloadBtn) {
  downloadBtn.addEventListener('click', handleDownload);
}

if (downloadBtnLarge) {
  downloadBtnLarge.addEventListener('click', handleDownload);
}

// ===== ANSWER REVEAL ANIMATIONS =====
const detailsElements = document.querySelectorAll('details');

detailsElements.forEach(details => {
  details.addEventListener('toggle', function() {
    if (this.open) {
      // Smooth expand animation
      const content = this.querySelector('summary').nextElementSibling;
      if (content) {
        content.style.animation = 'fadeIn 0.4s ease-in-out';
      }
    }
  });
});

// ===== COPY CODE EXAMPLES =====
// Add copy buttons to code examples if present
const codeBlocks = document.querySelectorAll('code, pre');
codeBlocks.forEach(block => {
  block.style.position = 'relative';
  block.style.cursor = 'pointer';
  block.setAttribute('title', 'Click to copy');
  
  block.addEventListener('click', function() {
    const text = this.textContent;
    navigator.clipboard.writeText(text).then(() => {
      // Visual feedback
      const originalBg = this.style.background;
      this.style.background = 'rgba(34, 197, 94, 0.2)';
      this.style.transition = 'background 0.3s ease';
      
      setTimeout(() => {
        this.style.background = originalBg;
      }, 500);
    });
  });
});

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', function(e) {
  // Ctrl/Cmd + P = Print/Download
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
    e.preventDefault();
    window.print();
  }
  
  // Arrow keys for chapter navigation
  if (e.key === 'ArrowDown' && e.altKey) {
    e.preventDefault();
    navigateChapter('next');
  }
  
  if (e.key === 'ArrowUp' && e.altKey) {
    e.preventDefault();
    navigateChapter('prev');
  }
});

function navigateChapter(direction) {
  const activeLink = document.querySelector('.chapter-list a.active');
  if (!activeLink) return;
  
  const currentIndex = Array.from(links).indexOf(activeLink);
  let targetLink;
  
  if (direction === 'next' && currentIndex < links.length - 1) {
    targetLink = links[currentIndex + 1];
  } else if (direction === 'prev' && currentIndex > 0) {
    targetLink = links[currentIndex - 1];
  }
  
  if (targetLink) {
    targetLink.click();
  }
}

// ===== SCROLL PROGRESS INDICATOR =====
function updateScrollProgress() {
  const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (winScroll / height) * 100;
  
  // Create or update progress bar
  let progressBar = document.querySelector('.scroll-progress');
  if (!progressBar) {
    progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    progressBar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 0%;
      height: 3px;
      background: linear-gradient(90deg, #6366f1, #22c55e);
      z-index: 9999;
      transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);
  }
  
  progressBar.style.width = scrolled + '%';
}

window.addEventListener('scroll', updateScrollProgress);
updateScrollProgress();

// ===== ANIMATIONS =====
// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;
document.head.appendChild(style);

// ===== INITIALIZE ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', function() {
  // Highlight first chapter by default if no hash in URL
  if (!window.location.hash && links.length > 0) {
    links[0].classList.add('active');
  }
  
  // If there's a hash, scroll to it
  if (window.location.hash) {
    setTimeout(() => {
      const target = document.querySelector(window.location.hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }
  
  console.log('✅ ClassDoodle Textbook Initialized');
  console.log('📚 Chapters:', sections.length);
  console.log('⌨️  Keyboard shortcuts:');
  console.log('   • Ctrl/Cmd + P: Download PDF');
  console.log('   • Alt + ↓: Next chapter');
  console.log('   • Alt + ↑: Previous chapter');
});
