import React from 'react';
import './Header.css';

export default function Header({ 
  currentPage, 
  onNavigate, 
  specimenCount = 0, 
  treasureCount = 0,
  onOpenAbout
}) {
  return (
    <header className="game-hud-header">
      <div className="hud-container">
        {/* Standout Brand Block in Left Corner */}
        <div 
          className="hud-brand" 
          onClick={() => onNavigate('home')} 
          role="button" 
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') onNavigate('home'); }}
          aria-label="Hues — Return to Home"
        >
          <div className="brand-header-badge">
            <span className="brand-category-chip">CHROMATIC FIELD JOURNAL</span>
            <span className="brand-edition-tag">OUTDOOR ATLAS</span>
          </div>
          <div className="brand-main-anchor">
            <div className="brand-chroma-mark" aria-hidden="true">
              <span className="mark-pip p-cyan" />
              <span className="mark-pip p-mint" />
              <span className="mark-pip p-violet" />
            </div>
            <h1 className="brand-title-standout">HUES</h1>
          </div>
          <p className="brand-tagline-text">An atlas of concealed colour palettes.</p>
        </div>

        {/* Navigation Pills */}
        <nav className="hud-nav" aria-label="Main Navigation">
          <button 
            type="button"
            className={`hud-pill-btn ${currentPage === 'atlas' || currentPage === 'detail' ? 'active' : ''}`}
            onClick={() => onNavigate('atlas')}
          >
            <span className="hud-icon">📖</span>
            <span className="hud-label">The Atlas</span>
            <span className="hud-count">{specimenCount}</span>
          </button>

          <button 
            type="button"
            className={`hud-pill-btn btn-find-color ${currentPage === 'discover' ? 'active' : ''}`}
            onClick={() => onNavigate('discover')}
          >
            <span className="hud-icon">✦</span>
            <span className="hud-label">+ Discover</span>
          </button>

          <button 
            type="button"
            className={`hud-pill-btn ${currentPage === 'treasures' ? 'active' : ''}`}
            onClick={() => onNavigate('treasures')}
          >
            <span className="hud-icon">🌿</span>
            <span className="hud-label">Tiny Treasures</span>
            {treasureCount > 0 && <span className="hud-count mint">{treasureCount}</span>}
          </button>

          <button 
            type="button"
            className="hud-pill-btn btn-info"
            onClick={onOpenAbout}
            title="Field Guide & Instructions"
          >
            <span className="hud-icon">ⓘ</span>
            <span className="hud-label">Field Guide</span>
          </button>
        </nav>
      </div>
      <div className="hud-bottom-border" />
    </header>
  );
}
