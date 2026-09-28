import React, { useState, useEffect } from 'react';

interface OutcodeProgress {
  outcode: string;
  region: string;
  total_properties: number;
  matched_properties: number;
  match_percentage: number;
  status: string;
  last_updated: string;
}

interface EnrichmentSummary {
  totalProcessed: number;
  totalMatched: number;
  overallPercentage: number;
  outcodes: OutcodeProgress[];
}

interface ActiveRunnerInfo {
  isRunning: boolean;
  area?: string;
  startTime?: number;
  pid?: number | null;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapboxToken: string;
  onMapboxTokenChange: (token: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  mapboxToken,
  onMapboxTokenChange
}) => {
  const [activeTab, setActiveTab] = useState<'precision' | 'mapbox'>('precision');
  const [summary, setSummary] = useState<EnrichmentSummary | null>(null);
  const [activeRunner, setActiveRunner] = useState<ActiveRunnerInfo>({ isRunning: false });
  const [customArea, setCustomArea] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Mapbox token local edit state
  const [tokenInput, setTokenInput] = useState(mapboxToken);
  const [tokenFeedback, setTokenFeedback] = useState<string | null>(null);
  const [runMode, setRunMode] = useState<'uprn' | 'osm'>('uprn');

  useEffect(() => {
    setTokenInput(mapboxToken);
  }, [mapboxToken]);

  const fetchStatus = async () => {
    try {
      const [sumRes, actRes] = await Promise.all([
        fetch('/api/enrichment/status'),
        fetch('/api/enrichment/active')
      ]);
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData);
      }
      if (actRes.ok) {
        const actData = await actRes.json();
        setActiveRunner(actData);
      }
    } catch (e) {
      console.error('Failed to fetch status:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartRun = async (targetArea: string) => {
    if (!targetArea.trim()) return;
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/enrichment/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area: targetArea.trim(), mode: runMode })
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'success', message: data.message || `Enrichment started for ${targetArea}!` });
        setCustomArea('');
        fetchStatus();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to start enrichment' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error connecting to backend service' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopRun = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/enrichment/stop', { method: 'POST' });
      const data = await res.json();
      setFeedback({ type: 'success', message: data.message || 'Runner stopped.' });
      fetchStatus();
    } catch {
      setFeedback({ type: 'error', message: 'Failed to stop runner process' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMapboxToken = () => {
    onMapboxTokenChange(tokenInput.trim());
    setTokenFeedback('Mapbox access token saved successfully!');
    setTimeout(() => setTokenFeedback(null), 3000);
  };

  const handleClearMapboxToken = () => {
    setTokenInput('');
    onMapboxTokenChange('');
    setTokenFeedback('Mapbox token removed.');
    setTimeout(() => setTokenFeedback(null), 3000);
  };

  const filteredOutcodes = (summary?.outcodes || []).filter(o =>
    o.outcode.toLowerCase().includes(searchFilter.toLowerCase().trim()) ||
    o.region.toLowerCase().includes(searchFilter.toLowerCase().trim()) ||
    o.status.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 7, 12, 0.75)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#0c0f17',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        width: '840px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '1.05rem',
                fontWeight: 600,
                color: '#ffffff',
                fontFamily: 'Outfit, sans-serif'
              }}>
                Settings & Precision Control
              </h2>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                Configure map layers, Mapbox tokens, and sub-metre building door enrichment
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.45)',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px'
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 24px 0 24px',
          background: 'rgba(255, 255, 255, 0.01)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            onClick={() => setActiveTab('precision')}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'precision' ? '#38bdf8' : 'transparent'}`,
              color: activeTab === 'precision' ? '#38bdf8' : 'rgba(255, 255, 255, 0.55)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>🎯</span>
            <span>Precision Geolocation Engine</span>
          </button>
          <button
            onClick={() => setActiveTab('mapbox')}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'mapbox' ? '#38bdf8' : 'transparent'}`,
              color: activeTab === 'mapbox' ? '#38bdf8' : 'rgba(255, 255, 255, 0.55)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>🗺️</span>
            <span>Mapbox Key & Basemaps</span>
            {mapboxToken && (
              <span style={{
                fontSize: '0.65rem',
                background: 'rgba(34, 197, 94, 0.2)',
                color: '#4ade80',
                padding: '1px 5px',
                borderRadius: '4px',
                fontWeight: 700
              }}>
                Active
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div style={{
          padding: '20px 24px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {activeTab === 'mapbox' ? (
            /* Mapbox Token Tab */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '18px 20px'
              }}>
                <h3 style={{
                  margin: '0 0 8px 0',
                  fontSize: '0.92rem',
                  color: '#ffffff',
                  fontWeight: 600
                }}>
                  Default Vector Basemaps vs. Optional Mapbox
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '0.8rem',
                  lineHeight: 1.5,
                  color: 'rgba(255, 255, 255, 0.65)'
                }}>
                  REAL Intel is built to run 100% out-of-the-box using ultra-fast OpenFreeMap vector tiles and high-resolution ESRI satellite imagery with <strong>zero API keys or usage fees</strong>.
                </p>
                <p style={{
                  margin: '10px 0 0 0',
                  fontSize: '0.8rem',
                  lineHeight: 1.5,
                  color: 'rgba(255, 255, 255, 0.65)'
                }}>
                  If you have a personal or organizational Mapbox account, you can optionally enter your Public Token (<code style={{ color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace' }}>pk.eyJ1Ijo...</code>) below to unlock Mapbox Dark v11 and Mapbox Satellite Streets.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  Mapbox Public Access Token
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="pk.eyJ1Ijo..."
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#ffffff',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.82rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={handleSaveMapboxToken}
                    style={{
                      background: '#0284c7',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontWeight: 600,
                      padding: '0 20px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Save Token
                  </button>
                  {mapboxToken && (
                    <button
                      onClick={handleClearMapboxToken}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        color: '#f87171',
                        fontWeight: 500,
                        padding: '0 16px',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                {tokenFeedback && (
                  <div style={{
                    fontSize: '0.78rem',
                    color: '#4ade80',
                    marginTop: '4px'
                  }}>
                    ✓ {tokenFeedback}
                  </div>
                )}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.55)' }}>
                  Don't have a token? Get a free Mapbox public token at <a href="https://account.mapbox.com/" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>mapbox.com</a> (includes 50,000 free map loads every month).
                </div>
              </div>
            </div>
          ) : (
            /* Precision Engine Tab */
            <>
              {/* Feedback Alert */}
              {feedback && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: feedback.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${feedback.type === 'success' ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                  color: feedback.type === 'success' ? '#4ade80' : '#f87171'
                }}>
                  <span>{feedback.message}</span>
                  <button
                    onClick={() => setFeedback(null)}
                    style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Status & Metrics Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px'
              }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '14px 16px'
                }}>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Total Enriched Titles
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', fontFamily: 'Outfit, sans-serif', marginTop: '4px' }}>
                    {summary ? summary.totalProcessed.toLocaleString() : '—'}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '14px 16px'
                }}>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Building Door Matches
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'Outfit, sans-serif', marginTop: '4px' }}>
                    {summary ? summary.totalMatched.toLocaleString() : '—'}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '14px 16px'
                }}>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Precision Rate
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#4ade80', fontFamily: 'Outfit, sans-serif', marginTop: '4px' }}>
                    {summary ? `${summary.overallPercentage.toFixed(1)}%` : '—'}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Runner Status
                    </div>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: activeRunner.isRunning ? '#38bdf8' : 'rgba(255, 255, 255, 0.45)',
                      marginTop: '6px'
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: activeRunner.isRunning ? '#38bdf8' : 'rgba(255, 255, 255, 0.3)',
                        boxShadow: activeRunner.isRunning ? '0 0 10px #38bdf8' : 'none'
                      }} />
                      {activeRunner.isRunning ? `ACTIVE (${activeRunner.area || 'Running'})` : 'ENGINE IDLE'}
                    </div>
                  </div>
                  {activeRunner.isRunning && (
                    <button
                      onClick={handleStopRun}
                      disabled={isLoading}
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#f87171',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        marginTop: '6px'
                      }}
                    >
                      Stop Runner
                    </button>
                  )}
                </div>
              </div>

              {/* Engine Mode Selector */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Precision Engine Mode</span>
                    <span style={{
                      fontSize: '0.68rem',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 600,
                      background: runMode === 'uprn' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(14, 165, 233, 0.15)',
                      color: runMode === 'uprn' ? '#c084fc' : '#38bdf8',
                      border: `1px solid ${runMode === 'uprn' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(14, 165, 233, 0.3)'}`
                    }}>
                      {runMode === 'uprn' ? 'Recommended: High Coverage' : 'OSM Doorways'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px' }}>
                    {runMode === 'uprn'
                      ? '⚡ OS Open UPRN: Instant matching against 8.98M official building points (96-99% accuracy)'
                      : '🌐 OpenStreetMap: Live Overpass API doorway geometry extraction (doorway-level)'}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  background: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: '8px',
                  padding: '3px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <button
                    onClick={() => setRunMode('uprn')}
                    style={{
                      background: runMode === 'uprn' ? '#8b5cf6' : 'transparent',
                      color: runMode === 'uprn' ? '#ffffff' : '#94a3b8',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 14px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    OS Open UPRN
                  </button>
                  <button
                    onClick={() => setRunMode('osm')}
                    style={{
                      background: runMode === 'osm' ? '#0284c7' : 'transparent',
                      color: runMode === 'osm' ? '#ffffff' : '#94a3b8',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 14px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    OSM Doorways
                  </button>
                </div>
              </div>

              {/* Quick Launch City Presets */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginBottom: '10px'
                }}>
                  Quick Launch City Presets
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    { label: '🏛️ London (All - 369k)', area: 'London' },
                    { label: '🌉 Bristol (All - 58k)', area: 'BS' },
                    { label: '🏙️ Manchester (M)', area: 'M' },
                    { label: '🏗️ Birmingham (B)', area: 'B' },
                    { label: '🏛️ Leeds (LS)', area: 'LS' },
                    { label: '🏰 Edinburgh (EH)', area: 'EH' },
                    { label: '🎓 Cambridge (CB)', area: 'CB' },
                    { label: '📚 Oxford (OX)', area: 'OX' }
                  ].map(preset => (
                    <button
                      key={preset.area}
                      onClick={() => handleStartRun(preset.area)}
                      disabled={isLoading || activeRunner.isRunning}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        cursor: activeRunner.isRunning ? 'not-allowed' : 'pointer',
                        opacity: activeRunner.isRunning ? 0.5 : 1,
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => {
                        if (!activeRunner.isRunning) {
                          e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
                          e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!activeRunner.isRunning) {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        }
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Postcode / Outcode Runner */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginBottom: '10px'
                }}>
                  Custom Postcode / Outcode Range
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={customArea}
                    onChange={e => setCustomArea(e.target.value)}
                    placeholder="Enter Outcode or Area (e.g. SW1, EC2A, BS8, M1, E14, CB, OX)"
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#ffffff',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.82rem',
                      outline: 'none'
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleStartRun(customArea);
                    }}
                  />
                  <button
                    onClick={() => handleStartRun(customArea)}
                    disabled={isLoading || activeRunner.isRunning || !customArea.trim()}
                    style={{
                      background: '#0284c7',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontWeight: 600,
                      padding: '0 20px',
                      fontSize: '0.8rem',
                      cursor: (isLoading || activeRunner.isRunning || !customArea.trim()) ? 'not-allowed' : 'pointer',
                      opacity: (isLoading || activeRunner.isRunning || !customArea.trim()) ? 0.5 : 1,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Start Precision Run
                  </button>
                </div>
              </div>

              {/* History & Enriched Districts Table */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                minHeight: '220px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    Enriched Districts History ({filteredOutcodes.length})
                  </div>
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    placeholder="Search districts..."
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.01)'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 140px 110px 110px 90px 1fr',
                    padding: '8px 14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.45)',
                    textTransform: 'uppercase'
                  }}>
                    <div>Outcode</div>
                    <div>Region</div>
                    <div style={{ textAlign: 'right' }}>Total Titles</div>
                    <div style={{ textAlign: 'right' }}>Door Matches</div>
                    <div style={{ textAlign: 'right' }}>Match %</div>
                    <div style={{ textAlign: 'right' }}>Status</div>
                  </div>

                  <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    {filteredOutcodes.length === 0 ? (
                      <div style={{
                        padding: '24px',
                        textAlign: 'center',
                        color: 'rgba(255, 255, 255, 0.4)',
                        fontSize: '0.8rem'
                      }}>
                        No districts found matching filter.
                      </div>
                    ) : (
                      filteredOutcodes.map(row => (
                        <div
                          key={row.outcode}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '80px 140px 110px 110px 90px 1fr',
                            padding: '8px 14px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            fontSize: '0.75rem',
                            alignItems: 'center',
                            fontFamily: 'Inter, sans-serif'
                          }}
                        >
                          <div style={{ fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: '#ffffff' }}>
                            {row.outcode}
                          </div>
                          <div style={{ color: 'rgba(255, 255, 255, 0.65)' }}>{row.region}</div>
                          <div style={{ textAlign: 'right', color: 'rgba(255, 255, 255, 0.85)' }}>
                            {row.total_properties.toLocaleString()}
                          </div>
                          <div style={{ textAlign: 'right', color: '#38bdf8', fontWeight: 500 }}>
                            {row.matched_properties.toLocaleString()}
                          </div>
                          <div style={{
                            textAlign: 'right',
                            fontWeight: 600,
                            color: row.match_percentage > 50 ? '#4ade80' : row.match_percentage > 20 ? '#fbbf24' : 'rgba(255, 255, 255, 0.4)'
                          }}>
                            {row.match_percentage.toFixed(1)}%
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              background: row.status === 'COMPLETED' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                              color: row.status === 'COMPLETED' ? '#4ade80' : '#facc15'
                            }}>
                              {row.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
