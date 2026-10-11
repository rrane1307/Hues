import React, { useState, useEffect, useRef } from 'react';
import './TinyTreasures.css';
import { getAllTreasures, saveTreasure, deleteTreasure } from '../services/db';
import { generateUUID, formatArchivalDate } from '../utils/color';

export default function TinyTreasures({ onReturnToAtlas }) {
  const [treasures, setTreasures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [observation, setObservation] = useState('');
  const [photoSrc, setPhotoSrc] = useState(null);
  const [photoError, setPhotoError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);

  // Load treasures on mount
  useEffect(() => {
    loadTreasures();
  }, []);

  const loadTreasures = async () => {
    setLoading(true);
    try {
      const items = await getAllTreasures();
      setTreasures(items);
    } catch (err) {
      console.error('Failed to load curiosities:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle photo file selection
  const handlePhotoSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoSrc(event.target.result);
      setPhotoError(null);
    };
    reader.onerror = () => setPhotoError('Failed to read image.');
    reader.readAsDataURL(file);
  };

  // Save new treasure
  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !photoSrc) {
      alert('Please provide a title and photo for this curiosity.');
      return;
    }

    setIsSaving(true);
    try {
      const newTreasure = {
        id: generateUUID(),
        title: title.trim(),
        observation: observation.trim(),
        photoDataUrl: photoSrc,
        createdAt: new Date().toISOString()
      };

      await saveTreasure(newTreasure);
      setTitle('');
      setObservation('');
      setPhotoSrc(null);
      setIsAdding(false);
      await loadTreasures();
    } catch (err) {
      alert('Could not save curiosity: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete treasure
  const handleDelete = async (id, treasureTitle) => {
    if (!window.confirm(`Delete "${treasureTitle}" from your curiosities?`)) return;
    try {
      await deleteTreasure(id);
      await loadTreasures();
    } catch (err) {
      alert('Could not remove curiosity: ' + err.message);
    }
  };

  return (
    <div className="treasures-game-screen">
      <div className="treasures-banner-row">
        <div>
          <div className="treasures-pills-row">
            <span className="retro-pill mint">OUTDOOR CURIOSITIES</span>
            <span className="retro-pill cyan">TOTAL: {treasures.length}</span>
          </div>
          <h2 className="treasures-pixel-title">Tiny Treasures</h2>
          <p className="treasures-subheading">
            Interesting textures, leaf outlines, and nature patterns you spotted outdoors.
          </p>
        </div>

        <div className="treasures-actions">
          <button 
            type="button" 
            className="btn-retro white"
            onClick={onReturnToAtlas}
          >
            ← My Collection
          </button>
          {!isAdding && (
            <button 
              type="button" 
              className="btn-retro mint"
              onClick={() => setIsAdding(true)}
            >
              <span>+</span>
              <span>RECORD CURIOSITY</span>
            </button>
          )}
        </div>
      </div>

      {/* Record New Treasure Card */}
      {isAdding && (
        <div className="add-treasure-card retro-card">
          <div className="card-top-bar">
            <span className="retro-pill mint">NEW OUTDOOR CURIOSITY</span>
            <button type="button" className="btn-close-form" onClick={() => setIsAdding(false)}>
              Cancel ✕
            </button>
          </div>

          <form onSubmit={handleSave} className="treasure-form">
            <div className="treasure-form-grid">
              {/* Photo Area */}
              <div className="treasure-photo-picker">
                {photoSrc ? (
                  <div className="photo-preview-box">
                    <img src={photoSrc} alt="Preview" className="treasure-preview-img" />
                    <button 
                      type="button" 
                      className="btn-reselect-photo pixel-text"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    >
                      Change Photo ↺
                    </button>
                  </div>
                ) : (
                  <div 
                    className="photo-drop-zone"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    <span className="camera-icon">📸</span>
                    <span className="drop-label pixel-text">SELECT PHOTO</span>
                    <span className="drop-hint">JPG, PNG, WebP</span>
                  </div>
                )}
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }}
                  onChange={handlePhotoSelect}
                />
                {photoError && <p className="field-err">{photoError}</p>}
              </div>

              {/* Text Fields */}
              <div className="treasure-fields">
                <div className="form-group">
                  <label htmlFor="treasure-title-input" className="pixel-label">What is this? *</label>
                  <input 
                    id="treasure-title-input"
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Star-shaped leaf, Roman brick texture..."
                    required
                    className="retro-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="treasure-obs-input" className="pixel-label">Story / Observation (Optional)</label>
                  <textarea 
                    id="treasure-obs-input"
                    rows={3}
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    placeholder="Describe where you noticed this or what made it special..."
                    className="retro-textarea"
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn-retro mint"
                  disabled={isSaving || !photoSrc}
                >
                  <span>✓</span>
                  <span>{isSaving ? 'Saving...' : 'SAVE CURIOSITY'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Treasures */}
      {treasures.length === 0 && !isAdding && (
        <div className="treasures-empty-card retro-card">
          <span className="retro-pill mint">NO CURIOSITIES YET</span>
          <p className="empty-text">No outdoor details saved yet.</p>
          <button 
            type="button" 
            className="btn-retro mint"
            onClick={() => setIsAdding(true)}
          >
            <span>+</span>
            <span>Record Your First Curiosity</span>
          </button>
        </div>
      )}

      {treasures.length > 0 && (
        <div className="treasures-game-grid">
          {treasures.map((item) => (
            <article key={item.id} className="treasure-retro-plate retro-card">
              <div className="treasure-img-box">
                <img src={item.photoDataUrl} alt={item.title} className="treasure-img" />
              </div>

              <div className="treasure-body">
                <div className="treasure-meta-row">
                  <time className="treasure-date pixel-text">{formatArchivalDate(item.createdAt)}</time>
                  <button 
                    type="button" 
                    className="btn-delete-treasure"
                    onClick={() => handleDelete(item.id, item.title)}
                    title="Delete curiosity"
                  >
                    🗑
                  </button>
                </div>

                <h3 className="treasure-name">{item.title}</h3>

                {item.observation && (
                  <p className="treasure-quote">"{item.observation}"</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
