import React from 'react';
import './Home.css';
import { formatArchivalDate, getColorVibeAndRarity } from '../utils/color';

export default function Home({ 
  onDiscover, 
  onAtlas, 
  onSelectSpecimen,
  specimens = [],
  onOpenTreasures
}) {
  const hasSpecimens = specimens && specimens.length > 0;
  const recentSpecimens = specimens.slice(0, 6);

  return (
    <main className="home-game-canvas">
      {!hasSpecimens ? (
        /* FIRST VISIT OR EMPTY ATLAS STATE — CHROMATIC FIELD ATLAS HERO */
        <section className="home-quest-card retro-card" aria-labelledby="home-title">
          {/* Top Quest Badges */}
          <div className="quest-header-pills">
            <span className="retro-pill cyan">OUTDOOR SPECIMEN ATLAS</span>
            <span className="retro-pill violet">CHROMATIC EXPEDITION</span>
          </div>

          <div className="home-title-group">
            <h1 id="home-title" className="home-hero-brand">HUES</h1>
            <p className="home-hero-tagline">An atlas of concealed colour palettes.</p>
          </div>

          {/* Chromatic Swatch Row */}
          <div className="retro-swatch-row" aria-hidden="true">
            <span className="pixel-dot" style={{ backgroundColor: '#38bdf8' }} />
            <span className="pixel-dot" style={{ backgroundColor: '#34d399' }} />
            <span className="pixel-dot" style={{ backgroundColor: '#f59e0b' }} />
            <span className="pixel-dot" style={{ backgroundColor: '#ec4899' }} />
            <span className="pixel-dot" style={{ backgroundColor: '#8b5cf6' }} />
          </div>

          <div className="quest-body-box">
            <h2 className="quest-callout-title">TODAY, LOOK CLOSER.</h2>
            <div className="quest-prose">
              <p>The world is full of colours hiding in plain sight.</p>
              <p className="prose-accent">A weathered wall. A fallen leaf. A doorway faded by time.</p>
              <p className="prose-prompt">Find a shade worth remembering.</p>
            </div>
          </div>

          <div className="quest-actions">
            <button 
              type="button" 
              className="btn-retro"
              onClick={onDiscover}
            >
              <span>✦</span>
              <span>DISCOVER A COLOUR</span>
            </button>
            <button 
              type="button" 
              className="btn-retro white"
              onClick={onAtlas}
            >
              <span>📖</span>
              <span>EXPLORE YOUR ATLAS</span>
            </button>
          </div>

          <footer className="quest-footer">
            <span className="footer-motto">Preserve the colour. Remember the encounter.</span>
          </footer>
        </section>
      ) : (
        /* RETURNING VISIT STATE — PERSONAL CHROMATIC ATLAS HUB */
        <section className="home-collection-hub">
          {/* Top Banner Card */}
          <div className="hub-header-card retro-card">
            <div className="hub-top-pills">
              <span className="retro-pill cyan">PERSONAL ATLAS</span>
              <span className="retro-pill mint">● {specimens.length} SPECIMENS PRESERVED</span>
            </div>

            <h1 className="hub-headline">Your Personal Atlas</h1>
            <p className="hub-subtext">
              Real-world colours discovered in ordinary surroundings and preserved as personal specimens.
            </p>

            <div className="hub-primary-actions">
              <button 
                type="button" 
                className="btn-retro"
                onClick={onDiscover}
              >
                <span>✦</span>
                <span>DISCOVER ANOTHER COLOUR</span>
              </button>
              <button 
                type="button" 
                className="btn-retro white"
                onClick={onAtlas}
              >
                <span>📖</span>
                <span>EXPLORE YOUR ATLAS ({specimens.length})</span>
              </button>
            </div>
          </div>

          {/* Color Inventory Ribbon */}
          <div className="inventory-strip-card retro-card">
            <div className="strip-card-header">
              <span className="strip-title">COLLECTED COLOUR SPECTRUM</span>
              <span className="strip-hint">CLICK ANY SWATCH TO VIEW SPECIMEN ↗</span>
            </div>
            
            <div className="retro-inventory-grid">
              {specimens.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  className="inventory-slot-btn"
                  style={{ backgroundColor: item.hex }}
                  onClick={() => onSelectSpecimen(item.id)}
                  title={`${item.name} (${item.hex})`}
                  aria-label={`View ${item.name}`}
                >
                  <span 
                    className="slot-number"
                    style={{ color: item.contrastColor || '#fff' }}
                  >
                    #{idx + 1}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Color Cards Section */}
          <section className="recent-cards-section">
            <div className="recent-section-bar">
              <span className="section-pixel-title">RECENTLY PRESERVED SPECIMENS</span>
              <button 
                type="button" 
                className="btn-view-all-link" 
                onClick={onAtlas}
              >
                Explore full atlas →
              </button>
            </div>

            <div className="retro-cards-grid">
              {recentSpecimens.map((specimen) => {
                const { rarity, vibe } = getColorVibeAndRarity(specimen.rgb?.r, specimen.rgb?.g, specimen.rgb?.b);
                return (
                  <article 
                    key={specimen.id} 
                    className="retro-game-card retro-card"
                    onClick={() => onSelectSpecimen(specimen.id)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => { if (e.key === 'Enter') onSelectSpecimen(specimen.id); }}
                  >
                    {/* Top Rarity Row */}
                    <div className="card-rarity-row">
                      <span className="card-rarity-tag">{rarity}</span>
                      <span className="card-vibe-tag">{vibe}</span>
                    </div>

                    {/* Dark inner screen with color swatch */}
                    <div className="card-screen-swatch" style={{ backgroundColor: specimen.hex }}>
                      <div className="swatch-overlay-chip">
                        <span className="overlay-hex">{specimen.hex}</span>
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div className="card-text-body">
                      <div className="card-meta-line">
                        <span className="card-ref-badge">{specimen.refNumber}</span>
                        <time className="card-date-text">{formatArchivalDate(specimen.createdAt)}</time>
                      </div>

                      <h3 className="card-color-title">{specimen.name}</h3>

                      {specimen.sourceDescription && (
                        <p className="card-source-snippet">
                          <strong>Found at:</strong> {specimen.sourceDescription}
                        </p>
                      )}

                      {specimen.observation && (
                        <p className="card-note-bubble">
                          "{specimen.observation}"
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Subordinate Curiosities Box */}
          <div className="home-curiosities-card retro-card">
            <div className="curiosity-info">
              <span className="retro-pill mint">🌿 TINY TREASURES</span>
              <p className="curiosity-text">
                Curiosities, textures, and subtle impressions noticed along the way outdoors.
              </p>
            </div>
            <button 
              type="button" 
              className="btn-retro white"
              onClick={onOpenTreasures}
            >
              Explore Tiny Treasures →
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
