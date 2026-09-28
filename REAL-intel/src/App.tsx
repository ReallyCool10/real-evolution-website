import React, { useState, useEffect } from 'react';
import { MapViewer } from './components/MapViewer';
import { SearchBar } from './components/SearchBar';
import { LayerControl } from './components/LayerControl';
import { PropertyInspector } from './components/PropertyInspector';
import { ProprietorPortfolio } from './components/ProprietorPortfolio';
import { SettingsModal } from './components/SettingsModal';
import { UserPanel, SavedPropertyItem } from './components/UserPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Property, BasemapStyle, FilterState } from './types';

export const App: React.FC = () => {
  const [basemap, setBasemap] = useState<BasemapStyle>('streets');
  const [mapboxToken, setMapboxToken] = useState<string>(() => {
    return localStorage.getItem('cadastre_mapbox_token') || '';
  });
  const [showBoundaries, setShowBoundaries] = useState<boolean>(true);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showUserPanel, setShowUserPanel] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterState>({ type: 'ALL', tenure: 'ALL' });
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedProprietor, setSelectedProprietor] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(11);
  const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lon: number } | null>(null);

  // Saved properties state with localStorage & SQLite persistence
  const [savedItems, setSavedItems] = useState<SavedPropertyItem[]>(() => {
    try {
      const saved = localStorage.getItem('real_intel_saved_properties');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync workspace from SQLite on mount
  useEffect(() => {
    fetch('/api/workspace')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && Array.isArray(data.savedItems) && data.savedItems.length > 0) {
          setSavedItems(data.savedItems);
          localStorage.setItem('real_intel_saved_properties', JSON.stringify(data.savedItems));
        }
      })
      .catch(() => {});
  }, []);

  const saveItemsToStorage = (items: SavedPropertyItem[]) => {
    setSavedItems(items);
    localStorage.setItem('real_intel_saved_properties', JSON.stringify(items));
    fetch('/api/workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ savedItems: items })
    }).catch(() => {});
  };

  const isPropertySaved = (id: number) => {
    return savedItems.some(item => item.id === id);
  };

  const handleToggleSaveProperty = (prop: Property) => {
    if (isPropertySaved(prop.id)) {
      const updated = savedItems.filter(item => item.id !== prop.id);
      saveItemsToStorage(updated);
    } else {
      const newItem: SavedPropertyItem = {
        id: prop.id,
        title_number: prop.title_number,
        property_address: prop.property_address,
        postcode: prop.postcode,
        proprietor_name: prop.proprietor_name,
        company_reg_no: prop.company_reg_no,
        tenure: prop.tenure,
        price_paid: prop.price_paid,
        latitude: prop.latitude,
        longitude: prop.longitude,
        district: prop.district,
        county: prop.county,
        region: prop.region,
        dataset_type: prop.dataset_type,
        listName: 'Watchlist',
        note: '',
        savedAt: new Date().toISOString()
      };
      saveItemsToStorage([newItem, ...savedItems]);
    }
  };

  const handleUpdateNote = (id: number, note: string) => {
    const updated = savedItems.map(item => item.id === id ? { ...item, note } : item);
    saveItemsToStorage(updated);
  };

  const handleUpdateList = (id: number, listName: string) => {
    const updated = savedItems.map(item => item.id === id ? { ...item, listName } : item);
    saveItemsToStorage(updated);
  };

  const handleRemoveItem = (id: number) => {
    const updated = savedItems.filter(item => item.id !== id);
    saveItemsToStorage(updated);
  };

  const handleClearAllSaved = () => {
    saveItemsToStorage([]);
  };

  // Keyboard shortcut: Esc to close inspector, portfolio, or panels
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showUserPanel) {
          setShowUserPanel(false);
        } else if (showSettingsModal) {
          setShowSettingsModal(false);
        } else if (selectedProprietor) {
          setSelectedProprietor(null);
        } else if (selectedProperty) {
          setSelectedProperty(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showUserPanel, showSettingsModal, selectedProperty, selectedProprietor]);

  const handleSelectProperty = (prop: Property | null) => {
    setSelectedProperty(prop);
    if (prop) {
      setSelectedProprietor(null);
      if (prop.latitude && prop.longitude) {
        setFlyToTarget({ lat: prop.latitude, lon: prop.longitude });
      }
    }
  };

  const handleSelectProprietor = (name: string | null) => {
    setSelectedProprietor(name);
    // If opening portfolio, close property inspector so they don't overlap
    if (name) {
      setSelectedProperty(null);
    }
  };

  const handlePinProperty = (prop: Property) => {
    setSelectedProperty(prop);
    if (prop.latitude && prop.longitude) {
      setFlyToTarget({ lat: prop.latitude, lon: prop.longitude });
    }
  };

  const handleSelectPortfolioAsset = (prop: Property) => {
    setSelectedProprietor(null);
    setSelectedProperty(prop);
    if (prop.latitude && prop.longitude) {
      setFlyToTarget({ lat: prop.latitude, lon: prop.longitude });
    }
  };

  const handleMapboxTokenChange = (token: string) => {
    setMapboxToken(token);
    if (token) {
      localStorage.setItem('cadastre_mapbox_token', token);
    } else {
      localStorage.removeItem('cadastre_mapbox_token');
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Edge-to-edge Map Viewport */}
      <MapViewer
        basemap={basemap}
        mapboxToken={mapboxToken}
        showBoundaries={showBoundaries}
        filter={filter}
        selectedProperty={selectedProperty}
        onSelectProperty={handleSelectProperty}
        onZoomChange={setCurrentZoom}
        flyToTarget={flyToTarget}
      />

      {/* Floating Minimal Control Bar */}
      <header style={{
        position: 'absolute',
        top: '16px',
        left: showUserPanel ? '480px' : '16px',
        right: (selectedProperty || selectedProprietor) ? '440px' : '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 50,
        pointerEvents: 'none',
        flexWrap: 'wrap',
        transition: 'left 0.3s cubic-bezier(0.16, 1, 0.3, 1), right 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Brand Mark / User Panel Trigger Button */}
          <button
            onClick={() => setShowUserPanel(!showUserPanel)}
            style={{
              background: showUserPanel ? 'rgba(56, 189, 248, 0.18)' : 'rgba(10, 13, 20, 0.9)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid ${showUserPanel ? 'rgba(56, 189, 248, 0.45)' : 'rgba(255, 255, 255, 0.12)'}`,
              borderRadius: '8px',
              padding: '7px 12px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Open Workspace (Saved Properties, Lists & Notes)"
            onMouseEnter={e => {
              if (!showUserPanel) {
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)';
              }
            }}
            onMouseLeave={e => {
              if (!showUserPanel) {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.background = 'rgba(10, 13, 20, 0.9)';
              }
            }}
          >
            <img
              src="/cadastre-logo.svg"
              alt="REAL"
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '4px',
                display: 'block'
              }}
            />
            <span style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '1.5px',
              color: '#ffffff',
              textTransform: 'uppercase'
            }}>
              REAL Intel
            </span>
            {savedItems.length > 0 && (
              <span style={{
                background: '#0284c7',
                color: '#ffffff',
                fontSize: '0.65rem',
                fontWeight: 700,
                borderRadius: '10px',
                padding: '1px 6px',
                lineHeight: 1.2
              }}>
                {savedItems.length}
              </span>
            )}
          </button>

          {/* Search */}
          <SearchBar
            onSelectProperty={handleSelectProperty}
            onSelectProprietor={handleSelectProprietor}
          />
        </div>

        {/* Filters & Layers */}
        <div style={{ pointerEvents: 'auto' }}>
          <LayerControl
            basemap={basemap}
            onBasemapChange={setBasemap}
            showBoundaries={showBoundaries}
            onToggleBoundaries={setShowBoundaries}
            currentZoom={currentZoom}
            filter={filter}
            onFilterChange={setFilter}
          />
        </div>

        {/* Settings Icon Button */}
        <div style={{ pointerEvents: 'auto' }}>
          <button
            onClick={() => setShowSettingsModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              background: showSettingsModal ? 'rgba(56, 189, 248, 0.18)' : 'rgba(10, 13, 20, 0.85)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid ${showSettingsModal ? 'rgba(56, 189, 248, 0.45)' : 'rgba(255, 255, 255, 0.12)'}`,
              borderRadius: '8px',
              color: showSettingsModal ? '#38bdf8' : 'rgba(255, 255, 255, 0.75)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
            }}
            title="Settings (Precision Engine & Mapbox Key)"
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = showSettingsModal ? 'rgba(56, 189, 248, 0.45)' : 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.color = showSettingsModal ? '#38bdf8' : 'rgba(255, 255, 255, 0.75)';
              e.currentTarget.style.background = showSettingsModal ? 'rgba(56, 189, 248, 0.18)' : 'rgba(10, 13, 20, 0.85)';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
      </header>

      {/* Sliding User Workspace Drawer (From Left) */}
      <UserPanel
        isOpen={showUserPanel}
        onClose={() => setShowUserPanel(false)}
        savedItems={savedItems}
        onUpdateNote={handleUpdateNote}
        onUpdateList={handleUpdateList}
        onRemoveItem={handleRemoveItem}
        onSelectProperty={handleSelectProperty}
        onClearAll={handleClearAllSaved}
      />

      {/* Side Property Inspector Panel (From Right) */}
      <ErrorBoundary fallbackTitle="Property Details Error" onReset={() => setSelectedProperty(null)}>
        {!selectedProprietor && (
          <PropertyInspector
            property={selectedProperty}
            onClose={() => setSelectedProperty(null)}
            onSelectProprietor={handleSelectProprietor}
            isSaved={isPropertySaved}
            onToggleSave={handleToggleSaveProperty}
          />
        )}
      </ErrorBoundary>

      {/* Side Proprietor Portfolio Panel (From Right) */}
      <ErrorBoundary fallbackTitle="Proprietor Portfolio Error" onReset={() => setSelectedProprietor(null)}>
        <ProprietorPortfolio
          proprietorName={selectedProprietor}
          onClose={() => setSelectedProprietor(null)}
          onSelectProperty={handleSelectPortfolioAsset}
          onPinProperty={handlePinProperty}
          selectedPropertyId={selectedProperty?.id}
        />
      </ErrorBoundary>

      {/* Unified Settings Modal (Precision Engine & Mapbox Key) */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        mapboxToken={mapboxToken}
        onMapboxTokenChange={handleMapboxTokenChange}
      />
    </div>
  );
};

export default App;
