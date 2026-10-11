import React, { useState, useEffect, useMemo } from 'react';
import './SpecimenDetail.css';
import { getSpecimenById, updateSpecimen, deleteSpecimen } from '../services/db';
import { 
  formatArchivalDate, 
  getHarmoniousCompanions, 
  getColorVibeAndRarity 
} from '../utils/color';

export default function SpecimenDetail({ 
  specimenId, 
  onBack, 
  onDiscoverAnother,
  onSpecimenDeleted,
  onSpecimenUpdated
}) {
  const [specimen, setSpecimen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSource, setEditSource] = useState('');
  const [editObservation, setEditObservation] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copy feedback
  const [copiedHex, setCopiedHex] = useState(false);
  const [sharedToast, setSharedToast] = useState(false);

  // Load specimen
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!specimenId) {
        setError('No specimen identifier provided.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await getSpecimenById(specimenId);
        if (!isMounted) return;
        if (!data) {
          setError(`Specimen record "${specimenId}" was not found.`);
        } else {
          setSpecimen(data);
          setEditName(data.name || '');
          setEditSource(data.sourceDescription || '');
          setEditObservation(data.observation || '');
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Could not load color.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [specimenId]);

  // Compute harmonious companions
  const companionColors = useMemo(() => {
    if (!specimen?.rgb) return [];
    return getHarmoniousCompanions(specimen.rgb.r, specimen.rgb.g, specimen.rgb.b);
  }, [specimen]);

  // Compute rarity and vibe
  const { rarity, vibe } = useMemo(() => {
    if (!specimen?.rgb) return { rarity: 'EPIC ★★★', vibe: 'DEEP VELVET' };
    return getColorVibeAndRarity(specimen.rgb.r, specimen.rgb.g, specimen.rgb.b);
  }, [specimen]);

  // Handle in-place edit save
  const handleSaveEdits = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert('Color name cannot be empty.');
      return;
    }

    setIsSavingEdit(true);
    try {
      const updated = await updateSpecimen(specimen.id, {
        name: editName.trim(),
        sourceDescription: editSource.trim(),
        observation: editObservation.trim()
      });
      setSpecimen(updated);
      setIsEditing(false);
      if (onSpecimenUpdated) onSpecimenUpdated(updated);
    } catch (err) {
      alert('Could not save changes: ' + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle delete
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteSpecimen(specimen.id);
      setShowDeleteModal(false);
      if (onSpecimenDeleted) onSpecimenDeleted(specimen.id);
      onBack();
    } catch (err) {
      alert('Could not remove color: ' + err.message);
      setIsDeleting(false);
    }
  };

  // Copy Hex to clipboard
  const handleCopyHex = () => {
    if (!specimen?.hex) return;
    navigator.clipboard.writeText(specimen.hex);
    setCopiedHex(true);
    setTimeout(() => setCopiedHex(false), 2000);
  };

  // Share Card Toast
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Hues Color: ${specimen.name}`,
        text: `Found ${specimen.name} (${specimen.hex}) outdoors with Hues!`,
        url: window.location.href
      }).catch(() => {});
    } else {
      handleCopyHex();
      setSharedToast(true);
      setTimeout(() => setSharedToast(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="specimen-detail-canvas">
        <div className="detail-state-card retro-card">
          <p className="pixel-text">Loading color card...</p>
        </div>
      </div>
    );
  }

  if (error || !specimen) {
    return (
      <div className="specimen-detail-canvas">
        <div className="detail-state-card retro-card error">
          <span className="retro-pill amber">NOTICE</span>
          <h3>Color Not Found</h3>
          <p>{error || 'This color could not be located in your collection.'}</p>
          <button type="button" className="btn-retro" onClick={onBack}>
            ← Back to Collection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="specimen-detail-canvas">
      {/* Top Navigation Row */}
      <div className="detail-hud-nav">
        <button type="button" className="btn-hud-back" onClick={onBack}>
          <span className="back-chevron">❮</span>
          <span>Return to Atlas</span>
        </button>

        <div className="hud-right-icons">
          <button 
            type="button" 
            className="hud-icon-btn" 
            onClick={handleShare}
            title="Share specimen card"
          >
            ↗
          </button>
          <button 
            type="button" 
            className="hud-icon-btn" 
            onClick={() => setIsEditing(!isEditing)}
            title="Edit specimen notes"
          >
            ✎
          </button>
          <button 
            type="button" 
            className="hud-icon-btn delete-btn" 
            onClick={() => setShowDeleteModal(true)}
            title="Delete specimen"
          >
            🗑
          </button>
        </div>
      </div>

      {sharedToast && (
        <div className="share-toast-pill">
          ✓ Specimen hex copied to clipboard for sharing!
        </div>
      )}

      {/* Main Specimen Stack */}
      <div className="specimen-game-stack">
        
        {/* Top Pills Row */}
        <div className="specimen-zone-bar">
          <span className="retro-pill mint">
            🌿 LOCATION: {specimen.sourceDescription ? specimen.sourceDescription.toUpperCase() : 'OUTDOOR ENCOUNTER'}
          </span>
          <span className="retro-pill cyan">{rarity}</span>
        </div>

        {/* CARD 1: HERO COLOR SPECIMEN CARD */}
        <section className="hero-specimen-card retro-card">
          {/* Header Pills */}
          <div className="specimen-card-header">
            <span className="retro-pill cyan">SPECIMEN #{specimen.refNumber}</span>
            <span className="retro-pill violet">{vibe}</span>
            <span className="retro-pill mint">● PRESERVED</span>
          </div>

          {/* Dark Inner Screen with Color & Dropper */}
          <div className="specimen-dark-screen">
            <div className="screen-header-line">
              <div className="dropper-group">
                <div 
                  className="dropper-circle-icon"
                  style={{ backgroundColor: specimen.hex }}
                >
                  ✎
                </div>
                <div className="dropper-text">
                  <span className="pixel-label">NATURAL SPECIMEN</span>
                  <h2 className="screen-color-name">{specimen.name}</h2>
                </div>
              </div>

              <div className="pixel-leaf-badge">
                <span className="leaf-glyph">🍃</span>
                <span className="pixel-badge-text">OUTDOOR SHADE</span>
              </div>
            </div>

            {/* Middle values row + Magnified Swatch Pip */}
            <div className="screen-middle-row">
              <div className="screen-specs-column">
                <div className="hex-capsule-box">
                  <span className="hex-label pixel-text">HEX</span>
                  <span className="hex-val-text">{specimen.hex}</span>
                </div>
                <div className="rgb-capsule-box">
                  <span className="rgb-label pixel-text">RGB</span>
                  <span className="rgb-val-text">
                    {specimen.rgb?.r} · {specimen.rgb?.g} · {specimen.rgb?.b}
                  </span>
                </div>
              </div>

              {/* Big Round Magnified Swatch Pip */}
              <div className="magnified-swatch-ring" style={{ borderColor: specimen.hex }}>
                <div 
                  className="magnified-swatch-fill" 
                  style={{ backgroundColor: specimen.hex }}
                >
                  <span className="pip-search-icon">🔍</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Card Actions: Density & Copy Hex */}
          <div className="specimen-card-bottom-row">
            <div className="optical-density-pill">
              <span className="density-bars">░▒▓</span>
              <span className="density-text">
                {specimen.pigmentDescriptor ? specimen.pigmentDescriptor.toUpperCase() : 'NATURAL PIGMENT'}
              </span>
            </div>

            <button 
              type="button" 
              className="btn-retro btn-copy-action"
              onClick={handleCopyHex}
            >
              <span>📋</span>
              <span>{copiedHex ? 'COPIED!' : 'COPY HEX'}</span>
            </button>
          </div>
        </section>

        {/* CARD 2: SPOTTED IN NATURE (PHOTO & TARGET RETICLE) */}
        {specimen.photoDataUrl && (
          <section className="spotted-photo-card retro-card">
            <div className="photo-card-top-bar">
              <span className="retro-pill mint">● SPOTTED IN NATURE</span>
              <span className="retro-pill cyan">FIELD PHOTOGRAPH</span>
            </div>

            <div className="photo-viewport-frame">
              <img 
                src={specimen.photoDataUrl} 
                alt={specimen.name} 
                className="spotted-photo-img"
              />

              {/* Retro HUD targeting reticle */}
              {specimen.pinPosition && (
                <div 
                  className="retro-hud-reticle"
                  style={{ 
                    left: `${specimen.pinPosition.xPct}%`, 
                    top: `${specimen.pinPosition.yPct}%` 
                  }}
                >
                  <div className="reticle-dashed-ring" />
                  <div className="reticle-crosshair-h" />
                  <div className="reticle-crosshair-v" />
                  <div 
                    className="reticle-center-dot" 
                    style={{ backgroundColor: specimen.hex }}
                  />
                  <span className="reticle-tag">SPOTTED PIN</span>
                </div>
              )}

              {/* Bottom Photo Overlay Badges */}
              <div className="photo-hud-footer">
                <span className="hud-place-badge">
                  📍 {specimen.sourceDescription || 'Outdoor Encounter'}
                </span>
                <span className="hud-coord-badge">
                  {specimen.pinPosition 
                    ? `${Math.round(specimen.pinPosition.xPct)}% , ${Math.round(specimen.pinPosition.yPct)}%` 
                    : 'PIN POINT'}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* CARD 3: FIELD NOTEBOOK & OBSERVATION LOG */}
        <section className="notebook-log-card retro-card">
          <div className="notebook-top-pill-row">
            <span className="retro-pill violet">📖 FIELD NOTEBOOK · SPECIMEN #{specimen.refNumber.slice(-4)}</span>
            <span className="log-archive-tag">ARCHIVAL OBSERVATION</span>
          </div>

          {/* EDIT FORM OR READ VIEW */}
          {isEditing ? (
            <form onSubmit={handleSaveEdits} className="game-edit-form">
              <div className="edit-form-group">
                <label className="pixel-label">Specimen Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="retro-input"
                  required
                />
              </div>

              <div className="edit-form-group">
                <label className="pixel-label">Where did you spot it?</label>
                <input 
                  type="text" 
                  value={editSource}
                  onChange={(e) => setEditSource(e.target.value)}
                  className="retro-input"
                />
              </div>

              <div className="edit-form-group">
                <label className="pixel-label">Field Note / Observation Story</label>
                <textarea 
                  rows={4}
                  value={editObservation}
                  onChange={(e) => setEditObservation(e.target.value)}
                  className="retro-textarea"
                />
              </div>

              <div className="edit-btn-row">
                <button type="submit" className="btn-retro mint" disabled={isSavingEdit}>
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="btn-retro white" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="notebook-content">
              {/* Dual Identity & Timestamp Pills */}
              <div className="notebook-identity-row">
                <div className="identity-subcard">
                  <span className="subcard-label">SPECIMEN IDENTITY</span>
                  <span className="subcard-val">{specimen.name}</span>
                </div>
                <div className="identity-subcard">
                  <span className="subcard-label">PRESERVATION DATE</span>
                  <span className="subcard-val">{formatArchivalDate(specimen.createdAt)}</span>
                </div>
              </div>

              {/* Observation Log Box */}
              <div className="observation-log-bubble">
                <div className="log-heading-row">
                  <span className="log-icon">💬</span>
                  <span className="log-title">OBSERVATION LOG</span>
                </div>
                <p className="log-story-text">
                  {specimen.observation || 'No extra notes recorded for this color encounter.'}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* CARD 4: HARMONIOUS COMPANIONS (Matching User Reference Image!) */}
        <section className="companions-card retro-card">
          <div className="companions-header-row">
            <div className="companions-title-group">
              <span className="comp-icon">🌐</span>
              <h3 className="companions-h3">HARMONIOUS COMPANIONS</h3>
            </div>
            <span className="retro-pill cyan">TRIO BLEND</span>
          </div>

          <div className="companion-pills-list">
            {companionColors.map((comp, idx) => (
              <div key={idx} className="companion-swatch-row">
                <div className="companion-left">
                  <div 
                    className="comp-circle-swatch"
                    style={{ backgroundColor: comp.hex }}
                  />
                  <div className="comp-name-group">
                    <span className="comp-color-name">{comp.name}</span>
                    <span className="comp-hex-code">{comp.hex}</span>
                  </div>
                </div>
                <span className="comp-ratio-pill">{comp.ratio}</span>
              </div>
            ))}
          </div>
        </section>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="specimen-bottom-actions">
          <button 
            type="button" 
            className="btn-retro btn-large-share"
            onClick={handleShare}
          >
            <span>⬆</span>
            <span>SHARE SPECIMEN CARD ↗</span>
          </button>

          <button 
            type="button" 
            className="btn-retro white btn-resample"
            onClick={onDiscoverAnother}
          >
            <span>✦</span>
            <span>DISCOVER ANOTHER COLOUR</span>
          </button>
        </div>

      </div>

      {/* CONFIRM DELETE MODAL */}
      {showDeleteModal && (
        <div className="modal-game-backdrop" role="dialog" aria-modal="true">
          <div className="delete-game-card retro-card">
            <span className="retro-pill amber">CONFIRM ACTION</span>
            <h3>Remove this specimen?</h3>
            <p>
              Are you sure you want to delete <strong>"{specimen.name}"</strong> from your chromatic atlas?
            </p>
            <div className="delete-btn-actions">
              <button 
                type="button" 
                className="btn-retro"
                style={{ backgroundColor: '#e11d48' }}
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button 
                type="button" 
                className="btn-retro white"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
