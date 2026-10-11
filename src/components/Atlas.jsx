import React, { useState, useMemo } from 'react';
import './Atlas.css';
import { formatArchivalDate, getColorVibeAndRarity } from '../utils/color';

export default function Atlas({ 
  specimens = [], 
  onSelect, 
  onDiscover,
  loading = false,
  error = null 
}) {
  const [activeView, setActiveView] = useState('plates'); // 'plates' | 'register'
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest' | 'hue' | 'luminance'
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort specimens
  const processedSpecimens = useMemo(() => {
    let result = [...specimens];

    // Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item => 
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.refNumber && item.refNumber.toLowerCase().includes(q)) ||
        (item.sourceDescription && item.sourceDescription.toLowerCase().includes(q)) ||
        (item.hex && item.hex.toLowerCase().includes(q)) ||
        (item.pigmentDescriptor && item.pigmentDescriptor.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOrder) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'hue':
          return (a.hsl?.h || 0) - (b.hsl?.h || 0);
        case 'luminance':
          return (b.luminance ?? 0) - (a.luminance ?? 0);
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return result;
  }, [specimens, searchQuery, sortOrder]);

  return (
    <div className="atlas-game-screen">
      {/* Top Banner Row */}
      <div className="atlas-banner-row">
        <div>
          <div className="banner-pills-row">
            <span className="retro-pill cyan">THE ATLAS</span>
            <span className="retro-pill violet">TOTAL: {specimens.length} SPECIMENS</span>
          </div>
          <h2 className="atlas-pixel-title">The Chromatic Atlas</h2>
          <p className="atlas-subheading">
            Preserved colour specimens from outdoor encounters.
          </p>
        </div>

        <div className="atlas-header-actions">
          <button 
            type="button" 
            className="btn-retro"
            onClick={onDiscover}
          >
            <span>✦</span>
            <span>+ DISCOVER A COLOUR</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="atlas-state-card retro-card">
          <p>Loading chromatic atlas...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="atlas-state-card retro-card error">
          <p>Notice: {error}</p>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && specimens.length === 0 && (
        <div className="atlas-empty-card retro-card">
          <div className="empty-game-icon">📖</div>
          <span className="retro-pill amber">ATLAS AWAITING SPECIMENS</span>
          <h3 className="empty-title">Your chromatic atlas is empty</h3>
          <p className="empty-description">
            Head outside and photograph a leaf, a weathered wall, or sky to preserve your first specimen.
          </p>
          <button 
            type="button" 
            className="btn-retro"
            onClick={onDiscover}
          >
            <span>✦</span>
            <span>PRESERVE YOUR FIRST SPECIMEN</span>
          </button>
        </div>
      )}

      {/* POPULATED ATLAS */}
      {!loading && specimens.length > 0 && (
        <div className="atlas-content">
          {/* Color Wheel Strip */}
          <div className="color-wheel-card retro-card">
            <div className="wheel-header">
              <span className="wheel-title">
                DISCOVERED COLOUR SPECTRUM ({specimens.length} SPECIMENS)
              </span>
              <span className="wheel-hint">ORGANIZED BY CHROMATIC HUE</span>
            </div>
            
            <div className="retro-wheel-strip">
              {[...specimens]
                .sort((a, b) => (a.hsl?.h || 0) - (b.hsl?.h || 0))
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="wheel-cell-btn"
                    style={{ backgroundColor: item.hex }}
                    onClick={() => onSelect(item.id)}
                    title={`${item.name} (${item.hex})`}
                    aria-label={`View ${item.name}`}
                  />
                ))}
            </div>
          </div>

          {/* Controls Bar: Search, View Mode, Sorting */}
          <div className="atlas-control-deck retro-card">
            {/* Search */}
            <div className="deck-search-box">
              <span className="search-symbol">🔍</span>
              <input 
                type="text" 
                placeholder="Search specimen name, location, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="deck-search-input"
              />
              {searchQuery && (
                <button 
                  type="button" 
                  className="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="deck-sort-group">
              <label htmlFor="sort-select" className="deck-label">SORT:</label>
              <select 
                id="sort-select"
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)}
                className="deck-dropdown"
              >
                <option value="newest">Latest Discovered</option>
                <option value="oldest">Earliest Discovered</option>
                <option value="hue">Chromatic Rainbow (Hue)</option>
                <option value="luminance">Light to Dark</option>
              </select>
            </div>

            {/* View Switcher */}
            <div className="deck-view-pills">
              <button 
                type="button" 
                className={`view-pill-btn ${activeView === 'plates' ? 'active' : ''}`}
                onClick={() => setActiveView('plates')}
              >
                Card Deck
              </button>
              <button 
                type="button" 
                className={`view-pill-btn ${activeView === 'register' ? 'active' : ''}`}
                onClick={() => setActiveView('register')}
              >
                Register Table
              </button>
            </div>
          </div>

          {/* Filter Match Count */}
          {searchQuery && (
            <div className="search-match-alert">
              Showing {processedSpecimens.length} of {specimens.length} matching "{searchQuery}"
            </div>
          )}

          {/* VIEW A: CARD DECK (Retro Swatch Cards) */}
          {activeView === 'plates' && (
            <div className="atlas-deck-grid">
              {processedSpecimens.map((specimen) => {
                const { rarity, vibe } = getColorVibeAndRarity(specimen.rgb?.r, specimen.rgb?.g, specimen.rgb?.b);
                return (
                  <article 
                    key={specimen.id}
                    className="atlas-game-card retro-card"
                    onClick={() => onSelect(specimen.id)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => { if (e.key === 'Enter') onSelect(specimen.id); }}
                  >
                    {/* Card Rarity Bar */}
                    <div className="card-top-bar">
                      <span className="card-rarity-chip">{rarity}</span>
                      <span className="card-ref-chip">{specimen.refNumber}</span>
                    </div>

                    {/* Color Swatch Screen */}
                    <div 
                      className="card-swatch-screen"
                      style={{ backgroundColor: specimen.hex }}
                    >
                      <span className="swatch-hex-pill">
                        {specimen.hex}
                      </span>

                      {/* Photo Thumbnail */}
                      {specimen.photoDataUrl && (
                        <div className="card-photo-pip" title="Photo encounter">
                          <img src={specimen.photoDataUrl} alt={specimen.name} />
                        </div>
                      )}
                    </div>

                    {/* Card Text Content */}
                    <div className="card-info-wrap">
                      <div className="card-vibe-row">
                        <span className="card-vibe-pill">{vibe}</span>
                        <time className="card-time-pill">{formatArchivalDate(specimen.createdAt)}</time>
                      </div>

                      <h3 className="card-title-name">{specimen.name}</h3>

                      {specimen.sourceDescription && (
                        <p className="card-source-p">
                          <strong>Found:</strong> {specimen.sourceDescription}
                        </p>
                      )}

                      {specimen.observation && (
                        <p className="card-quote-p">
                          "{specimen.observation}"
                        </p>
                      )}

                      <div className="card-footer-pills">
                        <span className="pill-small">
                          RGB: {specimen.rgb?.r}, {specimen.rgb?.g}, {specimen.rgb?.b}
                        </span>
                        {specimen.pigmentDescriptor && (
                          <span className="pill-small mint">
                            {specimen.pigmentDescriptor}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* VIEW B: LIST VIEW (Clean Table) */}
          {activeView === 'register' && (
            <div className="atlas-table-card retro-card">
              <table className="retro-list-table">
                <thead>
                  <tr>
                    <th>Color</th>
                    <th>Ref No.</th>
                    <th>Color Name</th>
                    <th>Hex / RGB</th>
                    <th>Where Spotted</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {processedSpecimens.map((specimen) => (
                    <tr 
                      key={specimen.id}
                      onClick={() => onSelect(specimen.id)}
                      className="table-game-row"
                    >
                      <td className="table-swatch-td">
                        <div 
                          className="table-swatch-pip"
                          style={{ backgroundColor: specimen.hex }}
                        />
                      </td>
                      <td className="table-ref-td">{specimen.refNumber}</td>
                      <td className="table-name-td">
                        <strong>{specimen.name}</strong>
                      </td>
                      <td className="table-color-td">
                        <code>{specimen.hex}</code>
                        <span className="sub-rgb-text">({specimen.rgb?.r}, {specimen.rgb?.g}, {specimen.rgb?.b})</span>
                      </td>
                      <td className="table-source-td">
                        {specimen.sourceDescription || '—'}
                      </td>
                      <td className="table-date-td">
                        {formatArchivalDate(specimen.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
