import React, { useState, useEffect } from 'react';
import { Property } from '../types';

interface PropertyInspectorProps {
  property: Property | null;
  onClose: () => void;
  onSelectProprietor?: (proprietorName: string) => void;
  isSaved?: (propertyId: number) => boolean;
  onToggleSave?: (property: Property) => void;
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({
  property,
  onClose,
  onSelectProprietor,
  isSaved,
  onToggleSave
}) => {
  // Track expanded cards by property id; for multiple properties, expand the first one by default
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});
  const [filterQuery, setFilterQuery] = useState('');
  const [tenureFilter, setTenureFilter] = useState<'all' | 'freehold' | 'leasehold'>('all');

  const propertiesList: Property[] = React.useMemo(() => {
    if (!property) return [];
    if (property.relatedProperties && property.relatedProperties.length > 0) {
      return property.relatedProperties;
    }
    return [property];
  }, [property]);

  // Reset expanded state and filters when a different property is inspected
  useEffect(() => {
    if (propertiesList.length > 0) {
      setExpandedMap({ [propertiesList[0].id]: true });
    } else {
      setExpandedMap({});
    }
    setFilterQuery('');
    setTenureFilter('all');
  }, [property?.id, property?.latitude, property?.longitude]);

  // Filtered titles within multi-unit buildings (e.g. searching 68 flats)
  const filteredList = React.useMemo(() => {
    let list = propertiesList;
    if (tenureFilter !== 'all') {
      list = list.filter((p) => p.tenure?.toLowerCase() === tenureFilter);
    }
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase().trim();
      list = list.filter((p) =>
        (p.proprietor_name && p.proprietor_name.toLowerCase().includes(q)) ||
        (p.property_address && p.property_address.toLowerCase().includes(q)) ||
        (p.title_number && p.title_number.toLowerCase().includes(q))
      );
    }
    return list;
  }, [propertiesList, tenureFilter, filterQuery]);

  const freeholdCount = React.useMemo(() => {
    return propertiesList.filter((p) => p.tenure?.toLowerCase() === 'freehold').length;
  }, [propertiesList]);

  const leaseholdCount = React.useMemo(() => {
    return propertiesList.filter((p) => p.tenure?.toLowerCase() === 'leasehold').length;
  }, [propertiesList]);

  if (!property) return null;

  const isMultiple = propertiesList.length > 1;

  const toggleExpand = (id: number) => {
    setExpandedMap((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = () => {
    const next: Record<number, boolean> = {};
    filteredList.forEach((p) => { next[p.id] = true; });
    setExpandedMap(next);
  };

  const collapseAll = () => {
    setExpandedMap({});
  };

  return (
    <aside style={{
      position: 'absolute',
      top: '16px',
      right: '16px',
      width: '440px',
      maxWidth: 'calc(100vw - 32px)',
      height: isMultiple ? 'calc(100vh - 32px)' : 'auto',
      maxHeight: 'calc(100vh - 32px)',
      background: 'rgba(10, 13, 20, 0.96)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '12px',
      boxShadow: '0 24px 48px rgba(0, 0, 0, 0.7)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      overflow: 'hidden',
      animation: 'slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .property-inspector-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .property-inspector-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .property-inspector-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.18);
          border-radius: 3px;
        }
        .property-inspector-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.32);
        }
      `}</style>

      {/* Header (Pinned) */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        background: 'rgba(255, 255, 255, 0.02)',
        flexShrink: 0
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: 'rgba(255, 255, 255, 0.45)',
            marginBottom: '2px'
          }}>
            {isMultiple ? 'Multi-Title Building' : 'Land Registry Title'}
          </div>
          <div style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '1.05rem',
            fontWeight: 600,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {isMultiple ? (
              <>
                <span>{propertiesList.length} Titles at this Address</span>
                <span style={{
                  fontSize: '0.7rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  background: 'rgba(6, 182, 212, 0.15)',
                  color: '#06b6d4',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 600,
                  flexShrink: 0
                }}>
                  Grouped
                </span>
              </>
            ) : (
              <span style={{ fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.5px' }}>
                {property.title_number}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {!isMultiple && property && onToggleSave && (
            <button
              onClick={() => onToggleSave(property)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: isSaved && isSaved(property.id) ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                border: `1px solid ${isSaved && isSaved(property.id) ? 'rgba(234, 179, 8, 0.4)' : 'rgba(255, 255, 255, 0.12)'}`,
                borderRadius: '6px',
                padding: '5px 9px',
                color: isSaved && isSaved(property.id) ? '#facc15' : 'rgba(255, 255, 255, 0.75)',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title={isSaved && isSaved(property.id) ? 'Saved to Workspace (Click to remove)' : 'Save to Workspace'}
            >
              <span>{isSaved && isSaved(property.id) ? '★' : '☆'}</span>
              <span>{isSaved && isSaved(property.id) ? 'Saved' : 'Save'}</span>
            </button>
          )}

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
              lineHeight: 1,
              flexShrink: 0
            }}
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Multi-Title Search & Filter Toolbar (Pinned, Non-shrinking) */}
      {isMultiple && (
        <div style={{
          padding: '10px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flexShrink: 0
        }}>
          {/* Quick search input */}
          <div style={{ position: 'relative', width: '100%' }}>
            <span style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.4)'
            }}>
              🔍
            </span>
            <input
              type="text"
              placeholder={`Filter among ${propertiesList.length} titles (e.g. "Flat 12", "Freehold")...`}
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '6px 26px 6px 28px',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontFamily: 'Inter, sans-serif',
                outline: 'none'
              }}
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  padding: '2px 4px'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Tenure pills & Expand/Collapse All */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setTenureFilter('all')}
                style={{
                  background: tenureFilter === 'all' ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${tenureFilter === 'all' ? 'rgba(255, 255, 255, 0.22)' : 'transparent'}`,
                  color: tenureFilter === 'all' ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                  borderRadius: '4px',
                  padding: '3px 7px',
                  fontSize: '0.68rem',
                  cursor: 'pointer'
                }}
              >
                All ({propertiesList.length})
              </button>
              {freeholdCount > 0 && (
                <button
                  onClick={() => setTenureFilter('freehold')}
                  style={{
                    background: tenureFilter === 'freehold' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${tenureFilter === 'freehold' ? 'rgba(16, 185, 129, 0.4)' : 'transparent'}`,
                    color: tenureFilter === 'freehold' ? '#10b981' : 'rgba(255, 255, 255, 0.6)',
                    borderRadius: '4px',
                    padding: '3px 7px',
                    fontSize: '0.68rem',
                    cursor: 'pointer'
                  }}
                >
                  Freehold ({freeholdCount})
                </button>
              )}
              {leaseholdCount > 0 && (
                <button
                  onClick={() => setTenureFilter('leasehold')}
                  style={{
                    background: tenureFilter === 'leasehold' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${tenureFilter === 'leasehold' ? 'rgba(212, 175, 55, 0.4)' : 'transparent'}`,
                    color: tenureFilter === 'leasehold' ? 'hsl(46, 65%, 52%)' : 'rgba(255, 255, 255, 0.6)',
                    borderRadius: '4px',
                    padding: '3px 7px',
                    fontSize: '0.68rem',
                    cursor: 'pointer'
                  }}
                >
                  Leasehold ({leaseholdCount})
                </button>
              )}
            </div>

            <button
              onClick={() => {
                const allExpanded = filteredList.length > 0 && filteredList.every((p) => expandedMap[p.id]);
                if (allExpanded) collapseAll();
                else expandAll();
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.75)',
                fontSize: '0.68rem',
                padding: '3px 8px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {filteredList.length > 0 && filteredList.every((p) => expandedMap[p.id]) ? 'Collapse All' : 'Expand All'}
            </button>
          </div>
        </div>
      )}

      {/* Properties Scrollable List View */}
      <div
        className="property-inspector-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '14px 16px 24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        {filteredList.length === 0 ? (
          <div style={{
            padding: '32px 16px',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '0.85rem'
          }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>🔍</div>
            <div>No titles match &ldquo;{filterQuery}&rdquo;</div>
            <button
              onClick={() => { setFilterQuery(''); setTenureFilter('all'); }}
              style={{
                marginTop: '12px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '0.75rem',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          filteredList.map((p, idx) => {
            const isExpanded = !!expandedMap[p.id];
            const isFreehold = p.tenure?.toLowerCase() === 'freehold';
            const isOverseas = p.dataset_type === 'OCOD';

            const formattedPrice = p.price_paid
              ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(p.price_paid)
              : 'Not Recorded';

            const companiesHouseUrl = p.company_reg_no
              ? `https://find-and-update.company-information.service.gov.uk/company/${p.company_reg_no}`
              : `https://find-and-update.company-information.service.gov.uk/search?q=${encodeURIComponent(p.proprietor_name || '')}`;

            const hmlrUrl = `https://eservices.landregistry.gov.uk/eservices/FindAProperty/view/QuickEnquiryInit.do`;

            return (
              <div
                key={`${p.id}-${idx}`}
                style={{
                  flexShrink: 0, // CRITICAL: NEVER SQUASH CARDS!
                  width: '100%',
                  boxSizing: 'border-box',
                  background: isExpanded ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${isExpanded ? 'rgba(6, 182, 212, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  transition: 'background 0.15s ease, border-color 0.15s ease'
                }}
              >
                {/* Card Header (Always Visible: Proprietor & Address summary) */}
                <div
                  onClick={() => toggleExpand(p.id)}
                  style={{
                    padding: '12px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    background: isExpanded ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                    borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.06)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isExpanded) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isExpanded) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Top Row: Title Number, Tenure & Chevron */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#ffffff',
                        background: 'rgba(255, 255, 255, 0.08)',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {p.title_number}
                      </span>
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
                      {isOverseas ? (
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 500,
                          color: '#f59e0b',
                          background: 'rgba(245, 158, 11, 0.12)',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          Overseas ({p.country_incorporated || 'Foreign'})
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 500,
                          color: '#06b6d4',
                          background: 'rgba(6, 182, 212, 0.12)',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          UK Corporate
                        </span>
                      )}
                      {p.precision_level === 'EXACT_OSM' && (
                        <span style={{
                          fontSize: '0.62rem',
                          fontWeight: 600,
                          color: '#10b981',
                          background: 'rgba(16, 185, 129, 0.12)',
                          padding: '2px 5px',
                          borderRadius: '4px',
                          border: '1px solid rgba(16, 185, 129, 0.3)'
                        }} title="Matched to this address in OpenStreetMap (postcode or street plus house number)">
                          ✓ Doorway (OSM)
                        </span>
                      )}
                      {p.precision_level === 'EXACT_UPRN' && (
                        <span style={{
                          fontSize: '0.62rem',
                          fontWeight: 600,
                          color: '#c084fc',
                          background: 'rgba(192, 132, 252, 0.12)',
                          padding: '2px 5px',
                          borderRadius: '4px',
                          border: '1px solid rgba(192, 132, 252, 0.3)'
                        }} title="The only Ordnance Survey UPRN (address point) in this postcode, so this address">
                          ✓ OS UPRN
                        </span>
                      )}
                      {p.precision_level === 'STREET_UPRN' && (
                        <span style={{
                          fontSize: '0.62rem',
                          fontWeight: 600,
                          color: '#38bdf8',
                          background: 'rgba(56, 189, 248, 0.12)',
                          padding: '2px 5px',
                          borderRadius: '4px',
                          border: '1px solid rgba(56, 189, 248, 0.3)'
                        }} title="Placed at a known address point on the same street, not necessarily this property's own building">
                          ≈ Street
                        </span>
                      )}
                      {p.precision_level === 'POSTCODE_UPRN' && (
                        <span style={{
                          fontSize: '0.62rem',
                          fontWeight: 600,
                          color: '#fbbf24',
                          background: 'rgba(251, 191, 36, 0.12)',
                          padding: '2px 5px',
                          borderRadius: '4px',
                          border: '1px solid rgba(251, 191, 36, 0.3)'
                        }} title="Placed on a real building (OS UPRN) in the correct postcode, not necessarily this property's own building">
                          ≈ Postcode (UPRN)
                        </span>
                      )}
                      {(!p.precision_level || p.precision_level === 'ESTIMATED') && (
                        <span style={{
                          fontSize: '0.62rem',
                          fontWeight: 500,
                          color: 'rgba(255, 255, 255, 0.4)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '2px 5px',
                          borderRadius: '4px'
                        }} title="Postcode area centroid estimate">
                          Centroid
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      {onToggleSave && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSave(p);
                          }}
                          style={{
                            background: isSaved && isSaved(p.id) ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            border: `1px solid ${isSaved && isSaved(p.id) ? 'rgba(234, 179, 8, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                            borderRadius: '4px',
                            color: isSaved && isSaved(p.id) ? '#facc15' : 'rgba(255, 255, 255, 0.55)',
                            padding: '2px 6px',
                            fontSize: '0.68rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                          title={isSaved && isSaved(p.id) ? 'Saved to Workspace (Click to remove)' : 'Save to Workspace'}
                        >
                          <span>{isSaved && isSaved(p.id) ? '★' : '☆'}</span>
                          <span>{isSaved && isSaved(p.id) ? 'Saved' : 'Save'}</span>
                        </button>
                      )}

                      <span style={{
                        fontSize: '0.75rem',
                        color: 'rgba(255, 255, 255, 0.4)',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }}>
                        ▼
                      </span>
                    </div>
                  </div>

                  {/* Proprietor Name */}
                  <div style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '0.96rem',
                    fontWeight: 600,
                    color: p.proprietor_name ? '#ffffff' : 'rgba(255, 255, 255, 0.45)',
                    lineHeight: 1.3,
                    marginTop: '2px'
                  }}>
                    {p.proprietor_name || 'Proprietor Not Recorded'}
                  </div>

                  {/* Address Summary */}
                  <div style={{
                    fontSize: '0.8rem',
                    color: 'rgba(255, 255, 255, 0.75)',
                    lineHeight: 1.4
                  }}>
                    {p.property_address}
                  </div>

                  {/* Price and Postcode Mini Row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.72rem',
                    color: 'rgba(255, 255, 255, 0.45)',
                    marginTop: '2px'
                  }}>
                    <span>{p.district ? `${p.district} · ` : ''}{p.postcode}</span>
                    {p.price_paid ? (
                      <span style={{ color: 'hsl(46, 65%, 52%)', fontWeight: 600 }}>{formattedPrice}</span>
                    ) : (
                      <span style={{ fontStyle: 'italic', color: 'rgba(255, 255, 255, 0.3)' }}>Price not recorded</span>
                    )}
                  </div>
                </div>

                {/* Expanded Full Details */}
                {isExpanded && (
                  <div style={{
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    animation: 'fadeIn 0.2s ease'
                  }}>
                    <style>{`
                      @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(-4px); }
                        to { opacity: 1; transform: translateY(0); }
                      }
                    `}</style>

                    {/* Financials & Acquisition */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255, 255, 255, 0.45)' }}>
                          Price Paid
                        </div>
                        <div style={{
                          fontFamily: 'Outfit, sans-serif',
                          fontSize: '1.05rem',
                          fontWeight: 600,
                          color: p.price_paid ? 'hsl(46, 65%, 52%)' : 'rgba(255, 255, 255, 0.4)',
                          marginTop: '2px'
                        }}>
                          {formattedPrice}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255, 255, 255, 0.45)' }}>
                          Date Registered
                        </div>
                        <div style={{
                          fontSize: '0.82rem',
                          fontWeight: 500,
                          color: '#ffffff',
                          marginTop: '4px'
                        }}>
                          {p.date_added || (p as any).date_proprietor_added || 'Not Recorded'}
                        </div>
                      </div>
                    </div>

                    {/* Corporate Proprietor Profile */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <div style={{
                        fontSize: '0.62rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                        color: 'rgba(255, 255, 255, 0.45)',
                        marginBottom: '6px'
                      }}>
                        Corporate Entity
                      </div>
                      <div style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: p.proprietor_name ? '#ffffff' : 'rgba(255, 255, 255, 0.45)'
                      }}>
                        {p.proprietor_name || 'Proprietor Not Recorded'}
                      </div>

                      {p.company_reg_no && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'rgba(255, 255, 255, 0.6)',
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <span>Company No:</span>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#06b6d4' }}>
                            {p.company_reg_no}
                          </span>
                        </div>
                      )}

                      {p.country_incorporated && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'rgba(255, 255, 255, 0.6)',
                          marginTop: '2px'
                        }}>
                          Jurisdiction: <span style={{ color: '#ffffff' }}>{p.country_incorporated}</span>
                        </div>
                      )}

                      {p.proprietorship_category && (
                        <div style={{
                          fontSize: '0.72rem',
                          color: 'rgba(255, 255, 255, 0.5)',
                          marginTop: '4px',
                          fontStyle: 'italic'
                        }}>
                          {p.proprietorship_category}
                        </div>
                      )}

                      {/* View All Assets Owned Button */}
                      {onSelectProprietor && p.proprietor_name && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectProprietor(p.proprietor_name);
                          }}
                          style={{
                            marginTop: '10px',
                            width: '100%',
                            background: 'rgba(6, 182, 212, 0.12)',
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                            borderRadius: '6px',
                            color: '#06b6d4',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '7px 10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(6, 182, 212, 0.22)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(6, 182, 212, 0.12)';
                          }}
                        >
                          <span>🏢 View All UK Assets Owned by {p.proprietor_name.length > 24 ? p.proprietor_name.slice(0, 24) + '...' : p.proprietor_name}</span>
                          <span>↗</span>
                        </button>
                      )}
                    </div>

                    {/* Location & Authority */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      fontSize: '0.72rem'
                    }}>
                      <div>
                        <span style={{ color: 'rgba(255, 255, 255, 0.45)' }}>District: </span>
                        <span style={{ color: '#ffffff' }}>{p.district || 'N/A'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'rgba(255, 255, 255, 0.45)' }}>County: </span>
                        <span style={{ color: '#ffffff' }}>{p.county || 'N/A'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'rgba(255, 255, 255, 0.45)' }}>Region: </span>
                        <span style={{ color: '#ffffff' }}>{p.region || 'N/A'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'rgba(255, 255, 255, 0.45)' }}>Dataset: </span>
                        <span style={{ color: isOverseas ? '#f59e0b' : '#06b6d4', fontWeight: 600 }}>
                          {p.dataset_type === 'OCOD' ? 'Overseas (OCOD)' : 'UK Corporate (CCOD)'}
                        </span>
                      </div>
                    </div>

                    {/* External Links */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      paddingTop: '8px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                      <a
                        href={companiesHouseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.75rem',
                          color: 'hsl(46, 65%, 52%)',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        Companies House ↗
                      </a>
                      <a
                        href={hmlrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.75rem',
                          color: 'rgba(255, 255, 255, 0.65)',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        HM Land Registry ↗
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
