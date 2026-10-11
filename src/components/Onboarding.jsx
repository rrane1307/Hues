import React, { useState } from 'react';
import './Onboarding.css';

const STEPS = [
  {
    tag: 'STEP 01 · HUNT',
    title: 'Find a Color Outside',
    body: 'Notice a shade in your everyday surroundings—a green moss patch, a bright flower petal, or a weathered painted door. Take a quick photo or pick a saved image.',
    icon: '📸'
  },
  {
    tag: 'STEP 02 · AIM',
    title: 'Tap to Lock In',
    body: 'Tap anywhere on your picture. The pixel zoom lens targets individual spots so you can grab the exact shade with pinpoint accuracy.',
    icon: '🎯'
  },
  {
    tag: 'STEP 03 · COLLECT',
    title: 'Save to Your Deck',
    body: 'Give your color a title, note where you found it, and save it to your pocket journal. Each color reveals 3 matching harmonious companion shades!',
    icon: '🎨'
  }
];

export default function Onboarding({ onComplete, onStartDiscovery }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish(false);
    }
  };

  const handleFinish = (andDiscover = false) => {
    localStorage.setItem('huesOnboardingCompleted', 'true');
    if (andDiscover) {
      onStartDiscovery();
    } else {
      onComplete();
    }
  };

  const step = STEPS[currentStep];

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-labelledby="onboarding-heading">
      <div className="onboarding-game-card retro-card">
        <div className="onboarding-header">
          <div className="onboarding-meta">
            <span className="retro-pill cyan">HOW TO PLAY</span>
            <span className="onboarding-step-counter pixel-text">{currentStep + 1} OF {STEPS.length}</span>
          </div>
          <button 
            type="button" 
            className="onboarding-skip-btn pixel-text" 
            onClick={() => handleFinish(false)}
            aria-label="Skip Guide"
          >
            Skip ✕
          </button>
        </div>

        <div className="onboarding-body">
          <div className="onboarding-icon-plate">
            <span className="step-icon">{step.icon}</span>
          </div>
          <span className="onboarding-tag pixel-text">{step.tag}</span>
          <h2 id="onboarding-heading" className="onboarding-title">{step.title}</h2>
          <p className="onboarding-text">{step.body}</p>
        </div>

        <div className="onboarding-progress-dots">
          {STEPS.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`dot ${idx === currentStep ? 'active' : ''}`}
              onClick={() => setCurrentStep(idx)}
              aria-label={`Go to step ${idx + 1}`}
            />
          ))}
        </div>

        <div className="onboarding-footer">
          {currentStep > 0 ? (
            <button 
              type="button" 
              className="btn-retro white btn-sm" 
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <div className="onboarding-actions-right">
            {currentStep === STEPS.length - 1 ? (
              <button 
                type="button" 
                className="btn-retro mint" 
                onClick={() => handleFinish(true)}
              >
                Start Playing! →
              </button>
            ) : (
              <button 
                type="button" 
                className="btn-retro" 
                onClick={handleNext}
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
