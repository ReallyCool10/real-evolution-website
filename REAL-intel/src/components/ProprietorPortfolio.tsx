import React, { useState, useEffect, useMemo } from 'react';
import { Property, ProprietorSummary } from '../types';

export interface ProprietorPortfolioProps {
  proprietorName: string | null;
  onClose: () => void;
  onSelectProperty: (property: Property) => void;
  onPinProperty?: (property: Property) => void;
  selectedPropertyId?: number;
}

export const ProprietorPortfolio: React.FC<ProprietorPortfolioProps> = ({
  proprietorName,
  onClose,
  onSelectProperty,
  onPinProperty,
  selectedPropertyId
}) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ProprietorSummary | null>(null);
  const [assets, setAssets] = useState<Property[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [tenureFilter, setTenureFilter] = useState<'ALL' | 'Freehold' | 'Leasehold'>('ALL');

  useEffect(() => {
    if (!proprietorName) {
      setSummary(null);
      setAssets([]);
      return;
    }

    let isCancelled = false;
    setLoading(true);
    setFilterQuery('');
    setTenureFilter('ALL');

    fetch(`/api/proprietor/${encodeURIComponent(proprietorName)}?limit=500`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled) {
          setSummary(data.proprietor || null);
          setAssets(data.assets || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch proprietor portfolio:', err);
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [proprietorName]);

  const filteredAssets = useMemo(() => {
    return assets.filter((p) => {
      if (tenureFilter !== 'ALL' && p.tenure.toLowerCase() !== tenureFilter.toLowerCase()) {
        return false;
      }
      if (filterQuery.trim()) {
        const q = filterQuery.toLowerCase();
        const matchAddress = p.property_address?.toLowerCase().includes(q);
        const matchTitle = p.title_number?.toLowerCase().includes(q);
        const matchPostcode = p.postcode?.toLowerCase().includes(q);
        const matchDistrict = p.district?.toLowerCase().includes(q);
        return matchAddress || matchTitle || matchPostcode || matchDistrict;
      }
      return true;
    });
  }, [assets, filterQuery, tenureFilter]);

  if (!proprietorName) return null;

  const isOverseas = summary?.dataset_type === 'OCOD';
  const companiesHouseUrl = summary?.company_reg_no
    ? `https://find-and-update.company-information.service.gov.uk/company/${summary.company_reg_no}`
    : `https://find-and-update.company-information.service.gov.uk/search?q=${encodeURIComponent(proprietorName)}`;

  const formattedTotalValue = summary?.total_price_paid
    ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(summary.total_price_paid)
    : 'Not Recorded';

  return (
    <aside style={{
      position: 'absolute',
      top: '16px',
      right: '16px',
      width: '420px',
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: 'calc(100vh - 32px)',
      background: 'rgba(10, 13, 20, 0.95)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '12px',
      boxShadow: '0 24px 48px rgba(0, 0, 0, 0.7)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 110,
      overflow: 'hidden',
      animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: 'rgba(255, 255, 255, 0.45)',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>Proprietor Portfolio</span>
            {isOverseas ? (
              <span style={{ color: '#f59e0b', fontWeight: 600 }}>· Overseas Entity</span>
            ) : (
              <span style={{ color: '#06b6d4', fontWeight: 600 }}>· UK Corporate</span>
            )}
          </div>
          <h2 style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '1.2rem',
            fontWeight: 600,
            color: '#ffffff',
            lineHeight: 1.3,
            margin: 0,
            wordBreak: 'break-word'
          }}>
            {proprietorName}
          </h2>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '6px',
            flexWrap: 'wrap'
          }}>
            <a
              href={companiesHouseUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: '0.72rem',
                color: '#06b6d4',
                textDecoration: 'none',
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                padding: '2px 6px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {summary?.company_reg_no ? `#${summary.company_reg_no}` : 'Companies House'} ↗
            </a>
            {summary?.country_incorporated && (
              <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                {summary.country_incorporated}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '1.2rem',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
            lineHeight: 1
          }}
          title="Close (Esc)"
        >
          ✕
        </button>
      </div>

      {/* Aggregate Metrics */}
      <div style={{
        padding: '12px 20px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '8px',
          padding: '10px 12px'
        }}>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255, 255, 255, 0.45)' }}>
            Commercial Assets
          </div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
            {summary?.property_count.toLocaleString() || '...'}
          </div>
        </div>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '8px',
          padding: '10px 12px'
        }}>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255, 255, 255, 0.45)' }}>
            Recorded Value
          </div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'hsl(46, 65%, 52%)', marginTop: '2px' }}>
            {formattedTotalValue}
          </div>
        </div>
      </div>

      {/* Search / Filter Bar */}
      <div style={{
        padding: '12px 20px 8px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter assets by street, city, or postcode..."
          style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            color: '#ffffff',
            padding: '7px 10px',
            fontSize: '0.78rem',
            outline: 'none',
            fontFamily: 'Inter, sans-serif'
          }}
        />

        {/* Tenure Selector */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['ALL', 'Freehold', 'Leasehold'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTenureFilter(t)}
              style={{
                background: tenureFilter === t ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${tenureFilter === t ? '#06b6d4' : 'rgba(255, 255, 255, 0.08)'}`,
                color: tenureFilter === t ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '0.68rem',
                cursor: 'pointer',
                fontWeight: tenureFilter === t ? 600 : 400
              }}
            >
              {t}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.4)', alignSelf: 'center' }}>
            Showing {filteredAssets.length} of {assets.length}
          </span>
        </div>
      </div>

      {/* Asset List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 20px 20px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.82rem' }}>
            Loading proprietor assets...
          </div>
        ) : filteredAssets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.82rem' }}>
            No assets match the filter criteria.
          </div>
        ) : (
          filteredAssets.map((p) => {
            const isFreehold = p.tenure?.toLowerCase() === 'freehold';
            const price = p.price_paid
              ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(p.price_paid)
              : null;
            const isPinned = selectedPropertyId === p.id;

            return (
              <div
                key={p.id}
                onClick={() => {
                  if (onPinProperty && p.latitude && p.longitude) {
                    onPinProperty(p);
                  } else {
                    onSelectProperty(p);
                  }
                }}
                style={{
                  background: isPinned ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${isPinned ? 'rgba(16, 185, 129, 0.6)' : 'rgba(255, 255, 255, 0.06)'}`,
                  boxShadow: isPinned ? '0 0 16px rgba(16, 185, 129, 0.2)' : 'none',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isPinned) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isPinned) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.75rem',
                      color: '#ffffff',
                      fontWeight: 600,
                      background: 'rgba(255, 255, 255, 0.08)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {p.title_number}
                    </span>
                    {isPinned && (
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        color: '#10b981',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)'
                      }}>
                        HIGHLIGHTED
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    color: isFreehold ? '#10b981' : 'hsl(46, 65%, 52%)',
                    background: isFreehold ? 'rgba(16, 185, 129, 0.12)' : 'rgba(212, 175, 55, 0.12)'
                  }}>
                    {p.tenure}
                  </span>
                </div>

                <div style={{
                  fontSize: '0.82rem',
                  color: '#e2e8f0',
                  marginTop: '6px',
                  lineHeight: 1.4
                }}>
                  {p.property_address}
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '8px',
                  paddingTop: '6px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                  fontSize: '0.72rem',
                  color: 'rgba(255, 255, 255, 0.45)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {p.latitude && p.longitude ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onPinProperty) {
                            onPinProperty(p);
                          } else {
                            onSelectProperty(p);
                          }
                        }}
                        style={{
                          background: isPinned ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.12)',
                          border: `1px solid ${isPinned ? '#10b981' : 'rgba(16, 185, 129, 0.35)'}`,
                          color: isPinned ? '#34d399' : '#10b981',
                          padding: '3px 8px',
                          borderRadius: '5px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease'
                        }}
                        title={isPinned ? 'Currently pinned and highlighted on map with green ring' : 'Pin and highlight on map with green ring'}
                      >
                        <span>📍</span>
                        <span>{isPinned ? 'Pinned on Map' : 'Pin on Map'}</span>
                      </button>
                    ) : (
                      <span style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.7rem' }}>📄 Record</span>
                    )}
                    <span>{p.district ? `${p.district} · ` : ''}{p.postcode}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {price && (
                      <span style={{ color: 'hsl(46, 65%, 52%)', fontWeight: 600 }}>{price}</span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProperty(p);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#06b6d4',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '2px 4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                      title="Open detailed property inspector"
                    >
                      Details ↗
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
