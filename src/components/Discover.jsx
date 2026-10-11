import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Discover.css';
import { 
  rgbToHex, 
  rgbToHsl, 
  getRelativeLuminance, 
  getContrastColor, 
  getNaturalPigmentName, 
  generateReferenceNumber, 
  generateUUID 
} from '../utils/color';
import { saveSpecimen } from '../services/db';
import { suggestSpecimenNames, AI_MODEL_INFO } from '../services/aiAssistant';

export default function Discover({ onSaveSuccess, onCancel }) {
  // Image state
  const [imageSrc, setImageSrc] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Colour selection state
  const [selectedColor, setSelectedColor] = useState(null);
  const [pinPosition, setPinPosition] = useState(null); // { xPct, yPct, pxX, pxY }
  const [isSampling, setIsSampling] = useState(false);

  // Specimen form fields
  const [specimenName, setSpecimenName] = useState('');
  const [sourceDescription, setSourceDescription] = useState('');
  const [observation, setObservation] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // AI Assistant state (Gemma / Open-Weight)
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProviderInfo, setAiProviderInfo] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [customHfToken, setCustomHfToken] = useState('');

  // Refs
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const imgDisplayRef = useRef(null);
  const hiddenCanvasRef = useRef(null);
  const loupeCanvasRef = useRef(null);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Start live browser camera
  const handleStartCamera = async () => {
    setCameraError(null);
    setImageError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error('Video play error:', e));
        }
      }, 100);
    } catch (err) {
      console.warn('Camera request error:', err);
      setCameraError(err.message || 'Camera permission denied or camera unavailable. Please upload a photo instead.');
      setCameraActive(false);
    }
  };

  // Capture frame from camera
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    stopCameraStream();
    loadImage(dataUrl);
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Selected file is not an image. Please choose a valid photograph (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      loadImage(event.target.result);
    };
    reader.onerror = () => {
      setImageError('Failed to read the selected file. Please try another image.');
    };
    reader.readAsDataURL(file);
  };

  // Load image into memory & setup hidden canvas
  const loadImage = (src) => {
    setImageError(null);
    setImageSrc(src);
    setSelectedColor(null);
    setPinPosition(null);
    setAiSuggestions([]);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = hiddenCanvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);

      // Auto sample center pixel as initial discovery specimen
      const initialX = Math.floor(img.naturalWidth / 2);
      const initialY = Math.floor(img.naturalHeight / 2);
      samplePixelAt(initialX, initialY, 50, 50);

      // Initialize reference number
      setRefNumber(generateReferenceNumber());
    };
    img.onerror = () => {
      setImageError('Failed to decode image data. Please ensure the photograph is not corrupted.');
    };
    img.src = src;
  };

  // Sample pixel from hidden canvas
  const samplePixelAt = (origX, origY, pctX, pctY) => {
    const canvas = hiddenCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Clamp coordinates
    const x = Math.max(0, Math.min(canvas.width - 1, Math.round(origX)));
    const y = Math.max(0, Math.min(canvas.height - 1, Math.round(origY)));

    try {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const r = pixel[0];
      const g = pixel[1];
      const b = pixel[2];
      const hex = rgbToHex(r, g, b);
      const hsl = rgbToHsl(r, g, b);
      const lum = getRelativeLuminance(r, g, b);
      const contrast = getContrastColor(r, g, b);
      const pigmentDesc = getNaturalPigmentName(r, g, b);

      setSelectedColor({
        r, g, b,
        hex,
        hsl,
        luminance: Number(lum.toFixed(3)),
        contrastColor: contrast,
        pigmentDescriptor: pigmentDesc
      });

      setPinPosition({
        xPct: pctX,
        yPct: pctY,
        pixelX: x,
        pixelY: y
      });

      // Update default specimen name if user hasn't typed a custom one
      if (!specimenName || specimenName === selectedColor?.pigmentDescriptor) {
        setSpecimenName(pigmentDesc);
      }

      // Draw loupe zoom
      renderLoupe(x, y);
    } catch (err) {
      console.error('Error sampling canvas pixel:', err);
    }
  };

  // Render magnified 15x15 pixel grid in loupe
  const renderLoupe = (centerX, centerY) => {
    const loupe = loupeCanvasRef.current;
    const canvas = hiddenCanvasRef.current;
    if (!loupe || !canvas) return;

    const lCtx = loupe.getContext('2d');
    const radius = 7; // 15x15 pixel region
    const sampleSize = radius * 2 + 1;
    
    lCtx.imageSmoothingEnabled = false;
    lCtx.clearRect(0, 0, loupe.width, loupe.height);

    // Source coordinates
    const sx = Math.max(0, Math.min(canvas.width - sampleSize, centerX - radius));
    const sy = Math.max(0, Math.min(canvas.height - sampleSize, centerY - radius));

    // Draw enlarged onto loupe
    lCtx.drawImage(canvas, sx, sy, sampleSize, sampleSize, 0, 0, loupe.width, loupe.height);

    // Draw grid lines
    const cellSize = loupe.width / sampleSize;
    lCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    lCtx.lineWidth = 1;
    for (let i = 0; i <= sampleSize; i++) {
      lCtx.beginPath();
      lCtx.moveTo(i * cellSize, 0);
      lCtx.lineTo(i * cellSize, loupe.height);
      lCtx.stroke();
      lCtx.beginPath();
      lCtx.moveTo(0, i * cellSize);
      lCtx.lineTo(loupe.width, i * cellSize);
      lCtx.stroke();
    }

    // Highlight center target pixel
    const centerCellX = (centerX - sx) * cellSize;
    const centerCellY = (centerY - sy) * cellSize;
    lCtx.strokeStyle = '#ffffff';
    lCtx.lineWidth = 2;
    lCtx.strokeRect(centerCellX, centerCellY, cellSize, cellSize);
    lCtx.strokeStyle = '#000000';
    lCtx.lineWidth = 1;
    lCtx.strokeRect(centerCellX - 1, centerCellY - 1, cellSize + 2, cellSize + 2);
  };

  // Handle interaction on displayed image
  const handleImagePointer = (e) => {
    const img = imgDisplayRef.current;
    if (!img || !hiddenCanvasRef.current) return;

    const rect = img.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (clickX < 0 || clickX > rect.width || clickY < 0 || clickY > rect.height) return;

    const pctX = (clickX / rect.width) * 100;
    const pctY = (clickY / rect.height) * 100;

    const origX = (clickX / rect.width) * img.naturalWidth;
    const origY = (clickY / rect.height) * img.naturalHeight;

    samplePixelAt(origX, origY, pctX, pctY);
  };

  // AI Assistant Naming Request (Gemma / Naturalist distillation)
  const handleTriggerAiAssistant = async () => {
    if (!selectedColor) return;
    setAiLoading(true);
    try {
      const result = await suggestSpecimenNames({
        observation: observation || 'Outdoor specimen encounter',
        sourceDescription: sourceDescription || 'Found outdoors',
        hex: selectedColor.hex,
        rgb: { r: selectedColor.r, g: selectedColor.g, b: selectedColor.b },
        hfToken: customHfToken
      });
      setAiSuggestions(result.suggestions);
      setAiProviderInfo(`${result.model} · ${result.provider}`);
    } catch (err) {
      console.warn('AI suggestion issue:', err);
    } finally {
      setAiLoading(false);
    }
  };

  // Save specimen to IndexedDB
  const handleSaveSpecimen = async (e) => {
    e.preventDefault();
    if (!specimenName.trim()) {
      alert('Please provide a specimen name before preserving.');
      return;
    }
    if (!selectedColor || !imageSrc) {
      alert('Please select a colour from your photograph first.');
      return;
    }

    setIsSaving(true);
    try {
      const specimenId = generateUUID();
      const newSpecimen = {
        id: specimenId,
        refNumber: refNumber || generateReferenceNumber(),
        name: specimenName.trim(),
        hex: selectedColor.hex,
        rgb: { r: selectedColor.r, g: selectedColor.g, b: selectedColor.b },
        hsl: selectedColor.hsl,
        luminance: selectedColor.luminance,
        contrastColor: selectedColor.contrastColor,
        pigmentDescriptor: selectedColor.pigmentDescriptor,
        sourceDescription: sourceDescription.trim(),
        observation: observation.trim(),
        photoDataUrl: imageSrc,
        pinPosition: pinPosition,
        createdAt: new Date().toISOString()
      };

      await saveSpecimen(newSpecimen);
      setIsSaving(false);
      onSaveSuccess(specimenId);
    } catch (err) {
      console.error('Failed to preserve specimen:', err);
      alert('Error preserving specimen into local atlas: ' + err.message);
      setIsSaving(false);
    }
  };

  return (
    <div className="discover-screen">
      {/* Hidden processing canvas */}
      <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />

      <div className="discover-header-row">
        <div>
          <div className="discover-pills-row">
            <span className="retro-pill cyan">FIELD SPECIMEN DISCOVERY</span>
            <span className="retro-pill violet">CHROMATIC SAMPLER</span>
          </div>
          <h2 className="discover-title">Discover a Colour</h2>
          <p className="discover-instructions">
            Capture or upload a scene from outdoors. Select the colour that called to you.
          </p>
        </div>
        <button type="button" className="btn-retro white" onClick={onCancel}>
          ✕ Close
        </button>
      </div>

      {/* STEP A: CAMERA VIEW OR UPLOAD ZONE */}
      {!imageSrc && !cameraActive && (
        <div className="capture-methods-card retro-card">
          <div className="methods-grid">
            {/* Live Camera Option */}
            <div className="method-box">
              <div className="method-icon">📷</div>
              <h3>Photograph Outdoors</h3>
              <p>Point your camera at a flower, leaf, weathered brick, or tree bark.</p>
              <button 
                type="button" 
                className="btn-retro"
                onClick={handleStartCamera}
              >
                <span>●</span>
                <span>Open Camera</span>
              </button>
            </div>

            <div className="method-divider">
              <span>OR</span>
            </div>

            {/* File Upload Option */}
            <div className="method-box">
              <div className="method-icon">🖼️</div>
              <h3>Select Photograph</h3>
              <p>Pick a field photo from your phone library or computer.</p>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden-file-input"
                onChange={handleFileChange}
              />
              <button 
                type="button" 
                className="btn-retro white"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                <span>📂</span>
                <span>Choose Picture</span>
              </button>
            </div>
          </div>

          {cameraError && (
            <div className="notice-banner warning">
              <span>Notice: {cameraError}</span>
            </div>
          )}

          {imageError && (
            <div className="notice-banner error">
              <span>Notice: {imageError}</span>
            </div>
          )}
        </div>
      )}

      {/* ACTIVE CAMERA VIEWFINDER */}
      {cameraActive && (
        <div className="camera-viewfinder-card retro-card">
          <div className="viewfinder-header">
            <span className="live-badge">● LIVE VIEWFINDER</span>
            <button type="button" className="btn-text-close" onClick={stopCameraStream}>
              Cancel ✕
            </button>
          </div>
          <div className="video-wrapper">
            <video ref={videoRef} playsInline autoPlay muted className="camera-video" />
            <div className="camera-crosshairs">
              <div className="crosshair-h" />
              <div className="crosshair-v" />
              <div className="camera-center-pip" />
            </div>
          </div>
          <div className="viewfinder-controls">
            <button 
              type="button" 
              className="btn-retro mint btn-capture-shutter"
              onClick={handleCapturePhoto}
            >
              <span>📸</span>
              <span>CAPTURE FRAME</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP B & C: IMAGE DISPLAY + COLOUR SELECTION & CREATION */}
      {imageSrc && (
        <div className="discovery-workspace">
          {/* Left Column: Photograph with Sampling Loupe */}
          <div className="image-sampling-panel retro-card">
            <div className="panel-bar">
              <span className="panel-label">TARGET ANYWHERE TO SAMPLE SPECIMEN</span>
              <div className="panel-actions">
                <button 
                  type="button" 
                  className="btn-reset-photo"
                  onClick={() => { setImageSrc(null); setSelectedColor(null); }}
                >
                  Change Photo ↺
                </button>
              </div>
            </div>

            <div 
              className="image-interaction-viewport"
              onClick={handleImagePointer}
              onMouseMove={(e) => {
                if (e.buttons === 1) handleImagePointer(e);
              }}
            >
              <img 
                ref={imgDisplayRef}
                src={imageSrc} 
                alt="Subject for color extraction" 
                className="specimen-source-img"
              />

              {/* Pinpoint indicator with retro target ring */}
              {pinPosition && (
                <div 
                  className="sampling-pin-target"
                  style={{ 
                    left: `${pinPosition.xPct}%`, 
                    top: `${pinPosition.yPct}%` 
                  }}
                >
                  <div className="pin-pulse" />
                  <div className="pin-ring" />
                  <div 
                    className="pin-center" 
                    style={{ backgroundColor: selectedColor ? selectedColor.hex : '#fff' }} 
                  />
                </div>
              )}
            </div>

            <p className="sampling-tip">
              ✦ Tap or drag anywhere on the photograph to position the reticle over your outdoor finding
            </p>

            {/* Precision Loupe Preview */}
            <div className="loupe-bar">
              <div className="loupe-canvas-box">
                <canvas 
                  ref={loupeCanvasRef} 
                  width={90} 
                  height={90} 
                  className="loupe-canvas"
                  title="Pixel zoom lens"
                />
                <span className="loupe-tag">ZOOM LENS (15×)</span>
              </div>

              {selectedColor && (
                <div className="extracted-quick-specs">
                  <div className="swatch-strip" style={{ backgroundColor: selectedColor.hex }} />
                  <div>
                    <div className="quick-hex">{selectedColor.hex}</div>
                    <div className="quick-rgb">RGB: {selectedColor.r}, {selectedColor.g}, {selectedColor.b}</div>
                    <div className="quick-descriptor">{selectedColor.pigmentDescriptor}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Specimen Preserving Form */}
          <div className="specimen-form-panel retro-card">
            <form onSubmit={handleSaveSpecimen} className="preservation-form">
              <div className="form-header-bar">
                <span className="retro-pill cyan">PRESERVE SPECIMEN</span>
                <span className="form-ref-no">{refNumber}</span>
              </div>

              {/* Large Immersive Swatch Display */}
              {selectedColor && (
                <div 
                  className="specimen-live-swatch"
                  style={{ backgroundColor: selectedColor.hex }}
                >
                  <div 
                    className="swatch-annotations"
                    style={{ color: selectedColor.contrastColor }}
                  >
                    <span className="swatch-hex-display">{selectedColor.hex}</span>
                    <span className="swatch-hsl-display">
                      RGB: {selectedColor.r}, {selectedColor.g}, {selectedColor.b} · {selectedColor.pigmentDescriptor}
                    </span>
                  </div>
                </div>
              )}

              {/* Required Field: Specimen Name */}
              <div className="form-field required">
                <label htmlFor="specimen-name-input" className="form-field-label">
                  Specimen Name <span className="req-marker">*</span>
                </label>
                <input 
                  id="specimen-name-input"
                  type="text" 
                  value={specimenName}
                  onChange={(e) => setSpecimenName(e.target.value)}
                  placeholder="e.g. Faded Verdigris Gate, Damp Autumn Birch..."
                  required
                  className="retro-input"
                />
              </div>

              {/* Optional Field: Source Description */}
              <div className="form-field">
                <label htmlFor="source-desc-input" className="form-field-label">
                  Where was this spotted? <span className="opt-tag">(Optional)</span>
                </label>
                <input 
                  id="source-desc-input"
                  type="text" 
                  value={sourceDescription}
                  onChange={(e) => setSourceDescription(e.target.value)}
                  placeholder="e.g. North courtyard wall, beneath the ivy"
                  className="retro-input"
                />
              </div>

              {/* Optional Field: Personal Observation */}
              <div className="form-field">
                <label htmlFor="observation-input" className="form-field-label">
                  Field Note / Observation <span className="opt-tag">(Optional)</span>
                </label>
                <textarea 
                  id="observation-input"
                  rows={3}
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="What caught your eye? Describe the light, weather, or encounter..."
                  className="retro-textarea"
                />
              </div>

              {/* AI ASSISTANT (NATURALIST NAMING HELPER) */}
              <div className="ai-assistant-widget">
                <div className="ai-widget-header">
                  <span className="ai-badge">✦ Naturalist Naming Assistant</span>
                  <button 
                    type="button" 
                    className="btn-ai-query"
                    onClick={handleTriggerAiAssistant}
                    disabled={aiLoading}
                  >
                    {aiLoading ? 'Thinking...' : 'Suggest Specimen Names'}
                  </button>
                </div>

                {aiSuggestions.length > 0 && (
                  <div className="ai-suggestions-box">
                    <span className="ai-suggestions-lead">Click any name to select it:</span>
                    <div className="ai-chips">
                      {aiSuggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="ai-suggestion-chip"
                          onClick={() => setSpecimenName(sug)}
                        >
                          "{sug}"
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmation Button */}
              <div className="form-submit-row">
                <button 
                  type="submit" 
                  className="btn-retro mint btn-full-submit"
                  disabled={isSaving || !selectedColor}
                >
                  <span>✦</span>
                  <span>{isSaving ? 'Preserving...' : 'PRESERVE SPECIMEN'}</span>
                </button>
              </div>

              <div className="archival-guarantee">
                <p>Preserved safely to your device's private chromatic atlas.</p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
