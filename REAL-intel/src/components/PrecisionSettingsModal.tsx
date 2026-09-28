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

interface PrecisionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrecisionSettingsModal: React.FC<PrecisionSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [summary, setSummary] = useState<EnrichmentSummary | null>(null);
  const [activeRunner, setActiveRunner] = useState<ActiveRunnerInfo>({ isRunning: false });
  const [customArea, setCustomArea] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
      console.error('Failed to fetch enrichment status:', e);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartEnrichment = async (areaToRun: string) => {
    const area = areaToRun.trim();
    if (!area) return;

    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/enrichment/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: `Precision enrichment started for ${area}!` });
        setCustomArea('');
        fetchStatus();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to start enrichment' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Network error starting enrichment' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopEnrichment = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/enrichment/stop', { method: 'POST' });
      const data = await res.json();
      setFeedback({ type: 'success', message: data.message || 'Enrichment stopped' });
      fetchStatus();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error stopping runner' });
    } finally {
      setIsLoading(false);
    }
  };

  const PRESETS = [
    { label: 'London (All)', area: 'London', icon: '🏛️' },
    { label: 'Bristol (All)', area: 'BS', icon: '🌉' },
    { label: 'Manchester', area: 'M', icon: '🏙️' },
    { label: 'Birmingham', area: 'B', icon: '🏗️' },
    { label: 'Leeds', area: 'LS', icon: '🏛️' },
    { label: 'Edinburgh', area: 'EH', icon: '🏰' },
    { label: 'Cambridge', area: 'CB', icon: '🎓' },
    { label: 'Oxford', area: 'OX', icon: '📚' }
  ];

  const filteredOutcodes = (summary?.outcodes || []).filter(o => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return o.outcode.toLowerCase().includes(term) || (o.region && o.region.toLowerCase().includes(term));
  });

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '780px',
        maxHeight: '90vh',
        background: 'rgba(13, 17, 23, 0.96)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        borderRadius: '16px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 1px 1px rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#f3f4f6',
        fontFamily: 'Inter, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(16, 185, 129, 0.2))',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>
              🎯
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '1.05rem',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                color: '#ffffff'
              }}>
                Precision Geolocation Engine
              </h2>
              <p style={{
                margin: '2px 0 0 0',
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.55)'
              }}>
                Sub-metre door-level building alignment using physical footprint nodes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '22px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
              lineHeight: 1,
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)')}
          >
            ×
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Top Metrics Banner */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '12px 14px'
            }}>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Enriched
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>
                {summary ? summary.totalProcessed.toLocaleString() : '—'}
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '12px 14px'
            }}>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Door Matches
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                {summary ? summary.totalMatched.toLocaleString() : '—'}
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '12px 14px'
            }}>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Precision Rate
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>
                {summary ? `${summary.overallPercentage.toFixed(1)}%` : '—'}
              </div>
            </div>

            <div style={{
              background: activeRunner.isRunning ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${activeRunner.isRunning ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
              borderRadius: '10px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: activeRunner.isRunning ? '#10b981' : '#6b7280',
                  boxShadow: activeRunner.isRunning ? '0 0 8px #10b981' : 'none'
                }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: activeRunner.isRunning ? '#10b981' : 'rgba(255,255,255,0.6)' }}>
                  {activeRunner.isRunning ? 'RUNNER ACTIVE' : 'ENGINE IDLE'}
                </span>
              </div>
              {activeRunner.isRunning && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeRunner.area}
                  </span>
                  <button
                    onClick={handleStopEnrichment}
                    disabled={isLoading}
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#f87171',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '0.65rem',
                      cursor: 'pointer'
                    }}
                  >
                    Stop
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
              color: feedback.type === 'success' ? '#34d399' : '#f87171'
            }}>
              {feedback.message}
            </div>
          )}

          {/* Trigger Precision Enrichment */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
              Enrich Location / Postcode Range
            </h3>
            
            {/* Quick Presets */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {PRESETS.map(p => (
                <button
                  key={p.area}
                  onClick={() => handleStartEnrichment(p.area)}
                  disabled={isLoading || activeRunner.isRunning}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '6px 11px',
                    color: '#e5e7eb',
                    fontSize: '0.78rem',
                    cursor: activeRunner.isRunning ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    opacity: activeRunner.isRunning ? 0.5 : 1
                  }}
                  onMouseEnter={e => {
                    if (!activeRunner.isRunning) {
                      e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!activeRunner.isRunning) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    }
                  }}
                >
                  <span>{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Enter postal area or specific outcode (e.g. SW1, EC2A, BS8, M1, E14, CB, OX)"
                value={customArea}
                onChange={e => setCustomArea(e.target.value.toUpperCase())}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleStartEnrichment(customArea);
                }}
                disabled={isLoading || activeRunner.isRunning}
                style={{
                  flex: 1,
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  outline: 'none',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
              <button
                onClick={() => handleStartEnrichment(customArea)}
                disabled={isLoading || activeRunner.isRunning || !customArea.trim()}
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 18px',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: (isLoading || activeRunner.isRunning || !customArea.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (isLoading || activeRunner.isRunning || !customArea.trim()) ? 0.5 : 1,
                  transition: 'opacity 0.15s ease'
                }}
              >
                {isLoading ? 'Starting...' : 'Start Precision Run'}
              </button>
            </div>
          </div>

          {/* Enriched Districts Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
                Enriched Districts History ({summary?.outcodes.length || 0})
              </h3>
              <input
                type="text"
                placeholder="Filter districts..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  outline: 'none',
                  width: '160px'
                }}
              />
            </div>

            <div style={{
              maxHeight: '260px',
              overflowY: 'auto',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(0, 0, 0, 0.2)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.04)', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Outcode</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Region</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Titles</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Door Matches</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Rate</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOutcodes.map((o) => (
                    <tr key={o.outcode} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#38bdf8' }}>{o.outcode}</td>
                      <td style={{ padding: '8px 12px', color: 'rgba(255, 255, 255, 0.65)' }}>{o.region || 'UK'}</td>
                      <td style={{ padding: '8px 12px', color: '#e5e7eb' }}>{o.total_properties.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px', color: '#10b981', fontWeight: 500 }}>{o.matched_properties.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px', color: '#38bdf8' }}>{o.match_percentage.toFixed(1)}%</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          background: o.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.15)' : o.status === 'IN_PROGRESS' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: o.status === 'COMPLETED' ? '#34d399' : o.status === 'IN_PROGRESS' ? '#38bdf8' : '#f87171'
                        }}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredOutcodes.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)' }}>
                        No districts match the filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: 'rgba(255, 255, 255, 0.4)'
        }}>
          <div>
            Data source: OpenStreetMap Building Nodes (OGbL) & HM Land Registry Title Register
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              padding: '5px 14px',
              color: '#ffffff',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
