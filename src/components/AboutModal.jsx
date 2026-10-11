import React from 'react';
import './AboutModal.css';

export default function AboutModal({ onClose }) {
  return (
    <div className="about-game-backdrop" role="dialog" aria-modal="true" aria-labelledby="about-dialog-title">
      <div className="about-game-card retro-card">
        {/* Header */}
        <div className="about-card-header">
          <div className="about-badge-row">
            <span className="retro-pill cyan">PLAYER'S GUIDE</span>
            <span className="retro-pill violet">HOW TO PLAY</span>
          </div>
          <button 
            type="button" 
            className="about-close-btn" 
            onClick={onClose}
            aria-label="Close Guide"
          >
            ✕
          </button>
        </div>

        <div className="about-card-body">
          {/* Section 1: What is Hues */}
          <section className="about-dialog-section">
            <h2 id="about-dialog-title" className="about-game-title">About Hues</h2>
            <p className="about-game-quote pixel-text">
              "Preserve the colour. Remember the encounter."
            </p>
            <p className="about-game-text">
              Hues is a pocket game and field journal for discovering extraordinary colors hiding in 
              your everyday surroundings. A weathered brick wall, an autumn leaf, or a painted doorway 
              holds shades you will never find in a generic paint catalog.
            </p>
          </section>

          {/* Section 2: How to Hunt for Colors */}
          <section className="about-dialog-section">
            <h3 className="section-game-subtitle pixel-text">🎮 3 Simple Steps</h3>
            <div className="game-steps-list">
              <div className="game-step-item">
                <span className="step-num-bubble">1</span>
                <div>
                  <strong>Head Outdoors:</strong> Look closely at nature, flowers, morning skies, or old buildings.
                </div>
              </div>
              <div className="game-step-item">
                <span className="step-num-bubble">2</span>
                <div>
                  <strong>Aim & Sample:</strong> Use your phone camera or upload a photo, then tap the pixel zoom lens to target any color spot.
                </div>
              </div>
              <div className="game-step-item">
                <span className="step-num-bubble">3</span>
                <div>
                  <strong>Save to Your Deck:</strong> Give it a custom name and write down your memory. Each color unlocks 3 matching harmonious shades!
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Safe, Private & Offline */}
          <section className="about-dialog-section">
            <h3 className="section-game-subtitle pixel-text">🔒 100% Private & Safe</h3>
            <div className="privacy-game-callout">
              <span className="callout-game-icon">🛡️</span>
              <p>
                <strong>Saved on your device:</strong> Your photos, colors, and notes never leave your phone 
                or computer. No accounts, no logins, and no tracking. You can play completely offline anytime!
              </p>
            </div>
          </section>

          {/* Section 4: Color Naming Helper */}
          <section className="about-dialog-section">
            <h3 className="section-game-subtitle pixel-text">✨ Color Name Helper</h3>
            <p className="about-game-text">
              Need inspiration for what to call a shade? Tap the <strong>Pixel Name Helper</strong> in the color scanner 
              to get creative, poetic names inspired by your notes and the color's natural mood.
            </p>
          </section>
        </div>

        <div className="about-card-footer">
          <button type="button" className="btn-retro" onClick={onClose}>
            <span>✓</span>
            <span>GOT IT, LET'S PLAY!</span>
          </button>
        </div>
      </div>
    </div>
  );
}
