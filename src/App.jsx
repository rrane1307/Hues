import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Header from './components/Header';
import Home from './components/Home';
import Discover from './components/Discover';
import Atlas from './components/Atlas';
import SpecimenDetail from './components/SpecimenDetail';
import TinyTreasures from './components/TinyTreasures';
import Onboarding from './components/Onboarding';
import AboutModal from './components/AboutModal';
import { getAllSpecimens, getAllTreasures } from './services/db';

export const PAGE = {
  HOME: 'home',
  DISCOVER: 'discover',
  ATLAS: 'atlas',
  DETAIL: 'detail',
  TREASURES: 'treasures'
};

export default function App() {
  const [currentPage, setCurrentPage] = useState(PAGE.HOME);
  const [selectedSpecimenId, setSelectedSpecimenId] = useState(null);
  
  // Data state
  const [specimens, setSpecimens] = useState([]);
  const [treasureCount, setTreasureCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Refresh specimens from IndexedDB
  const refreshData = useCallback(async () => {
    try {
      const [specimenList, treasureList] = await Promise.all([
        getAllSpecimens(),
        getAllTreasures()
      ]);
      setSpecimens(specimenList);
      setTreasureCount(treasureList.length);
      setError(null);
    } catch (err) {
      console.error('Failed to load atlas data from IndexedDB:', err);
      setError(err.message || 'Database access issue');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshData();

    // Check onboarding status
    const completed = localStorage.getItem('huesOnboardingCompleted');
    if (!completed) {
      setShowOnboarding(true);
    }
  }, [refreshData]);

  // Navigation helper
  const navigate = (page, specimenId = null) => {
    setCurrentPage(page);
    if (specimenId) {
      setSelectedSpecimenId(specimenId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handlers for specimen lifecycle
  const handleSaveSuccess = async (newSpecimenId) => {
    await refreshData();
    navigate(PAGE.DETAIL, newSpecimenId);
  };

  const handleSpecimenDeleted = async () => {
    await refreshData();
    navigate(PAGE.ATLAS);
  };

  const handleSpecimenUpdated = async () => {
    await refreshData();
  };

  return (
    <div className="atlas-app-root">
      {/* Editorial Header */}
      <Header 
        currentPage={currentPage}
        onNavigate={(page) => navigate(page)}
        specimenCount={specimens.length}
        treasureCount={treasureCount}
        onOpenAbout={() => setShowAboutModal(true)}
      />

      {/* Main View Router */}
      <div className="atlas-main-content">
        {currentPage === PAGE.HOME && (
          <Home 
            specimens={specimens}
            onDiscover={() => navigate(PAGE.DISCOVER)}
            onAtlas={() => navigate(PAGE.ATLAS)}
            onSelectSpecimen={(id) => navigate(PAGE.DETAIL, id)}
            onOpenTreasures={() => navigate(PAGE.TREASURES)}
          />
        )}

        {currentPage === PAGE.DISCOVER && (
          <Discover 
            onSaveSuccess={handleSaveSuccess}
            onCancel={() => navigate(specimens.length > 0 ? PAGE.ATLAS : PAGE.HOME)}
          />
        )}

        {currentPage === PAGE.ATLAS && (
          <Atlas 
            specimens={specimens}
            loading={loading}
            error={error}
            onSelect={(id) => navigate(PAGE.DETAIL, id)}
            onDiscover={() => navigate(PAGE.DISCOVER)}
          />
        )}

        {currentPage === PAGE.DETAIL && (
          <SpecimenDetail 
            specimenId={selectedSpecimenId}
            onBack={() => navigate(PAGE.ATLAS)}
            onDiscoverAnother={() => navigate(PAGE.DISCOVER)}
            onSpecimenDeleted={handleSpecimenDeleted}
            onSpecimenUpdated={handleSpecimenUpdated}
          />
        )}

        {currentPage === PAGE.TREASURES && (
          <TinyTreasures 
            onReturnToAtlas={() => navigate(PAGE.ATLAS)}
          />
        )}
      </div>

      {/* Contextual Onboarding Guide */}
      {showOnboarding && (
        <Onboarding 
          onComplete={() => setShowOnboarding(false)}
          onStartDiscovery={() => {
            setShowOnboarding(false);
            navigate(PAGE.DISCOVER);
          }}
        />
      )}

      {/* Help / About Modal */}
      {showAboutModal && (
        <AboutModal 
          onClose={() => setShowAboutModal(false)}
        />
      )}

      {/* Colophon Footer */}
      <footer className="atlas-colophon">
        <div className="colophon-inner">
          <div className="colophon-bottom-left">
            <button 
              type="button" 
              className="btn-retro white footer-field-guide-btn"
              onClick={() => setShowAboutModal(true)}
              aria-label="Open Field Guide"
            >
              <span className="footer-guide-icon">📖</span>
              <span>Field Guide</span>
            </button>
          </div>
          <div className="colophon-brand">
            <span className="colophon-title">HUES</span>
            <span className="colophon-motto">Preserve the colour. Remember the encounter.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
