import React, { useState, useEffect, useRef } from 'react';
import { Property, ProprietorSummary } from '../types';

interface SearchBarProps {
  onSelectProperty: (property: Property) => void;
  onSelectProprietor: (proprietorName: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSelectProperty, onSelectProprietor }) => {
  const [query, setQuery] = useState('');
  const [proprietors, setProprietors] = useState<ProprietorSummary[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (query.trim().length < 2) {
      setProprietors([]);
      setProperties([]);
      setIsOpen(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&limit=12`);
        if (res.ok) {
          const data = await res.json();
          setProprietors(data.proprietors || []);
          setProperties(data.properties || []);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Search fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalResults = proprietors.length + properties.length;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '400px', maxWidth: 'calc(100vw - 32px)' }}>
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(10, 13, 20, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '8px',
        padding: '2px 12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
      }}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: 'rgba(255, 255, 255, 0.4)', marginRight: '8px', flexShrink: 0 }}
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (totalResults > 0) setIsOpen(true); }}
          placeholder="Search proprietor, address, or postcode..."
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#ffffff',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.85rem',
            padding: '8px 0',
          }}
        />

        {isLoading && (
          <div style={{
            fontSize: '0.7rem',
            color: 'rgba(255, 255, 255, 0.4)',
            marginRight: '6px'
          }}>
            ...
          </div>
        )}

        {query && (
          <button
            onClick={() => { setQuery(''); setProprietors([]); setProperties([]); setIsOpen(false); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.4)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              padding: '4px',
              marginLeft: '4px'
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && totalResults > 0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: 'rgba(10, 13, 20, 0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
          maxHeight: '400px',
          overflowY: 'auto',
          zIndex: 200
        }}>
          {/* Section 1: Proprietors */}
          {proprietors.length > 0 && (
            <div>
              <div style={{
                padding: '8px 14px 4px 14px',
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: 'rgba(255, 255, 255, 0.4)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
              }}>
                <span>Corporate & Overseas Proprietors</span>
                <span style={{ color: '#06b6d4' }}>{proprietors.length}</span>
              </div>
              {proprietors.map((p) => {
                const isOverseas = p.dataset_type === 'OCOD';
                return (
                  <div
                    key={p.proprietor_name}
                    onClick={() => {
                      onSelectProprietor(p.proprietor_name);
                      setIsOpen(false);
                    }}
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#ffffff',
                        fontFamily: 'Outfit, sans-serif',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {p.proprietor_name}
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontFamily: 'JetBrains Mono, monospace',
                        color: '#06b6d4',
                        background: 'rgba(6, 182, 212, 0.12)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        flexShrink: 0,
                        fontWeight: 600
                      }}>
                        {p.property_count.toLocaleString()} {p.property_count === 1 ? 'asset' : 'assets'}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '4px',
                      fontSize: '0.72rem',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      <span>
                        {isOverseas ? (
                          <span style={{ color: '#f59e0b' }}>
                            Overseas · {p.country_incorporated || 'Foreign Entity'}
                          </span>
                        ) : (
                          <span>UK Registered Corporate {p.company_reg_no ? `(#${p.company_reg_no})` : ''}</span>
                        )}
                      </span>
                      {p.total_price_paid > 0 && (
                        <span style={{ color: 'hsl(46, 65%, 52%)', fontWeight: 500 }}>
                          £{(p.total_price_paid / 1e6).toFixed(1)}M recorded
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Section 2: Addresses & Properties */}
          {properties.length > 0 && (
            <div>
              <div style={{
                padding: '8px 14px 4px 14px',
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: 'rgba(255, 255, 255, 0.4)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                marginTop: proprietors.length > 0 ? '6px' : '0'
              }}>
                <span>Addresses & Titles</span>
                <span style={{ color: '#06b6d4' }}>{properties.length}</span>
              </div>
              {properties.map((p) => {
                const isOverseas = p.dataset_type === 'OCOD';
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProperty(p);
                      setIsOpen(false);
                    }}
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: '#ffffff',
                        fontFamily: 'Inter, sans-serif',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {p.property_address}
                      </span>
                      <span style={{
                        fontSize: '0.68rem',
                        fontFamily: 'JetBrains Mono, monospace',
                        color: 'rgba(255, 255, 255, 0.5)',
                        background: 'rgba(255, 255, 255, 0.06)',
                        padding: '2px 5px',
                        borderRadius: '3px',
                        flexShrink: 0
                      }}>
                        {p.title_number}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '4px',
                      fontSize: '0.72rem',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                        {p.proprietor_name}
                      </span>
                      <span style={{
                        color: isOverseas ? '#f59e0b' : '#06b6d4',
                        fontSize: '0.68rem',
                        fontWeight: 500
                      }}>
                        {p.postcode || (isOverseas ? 'Overseas' : 'UK')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
