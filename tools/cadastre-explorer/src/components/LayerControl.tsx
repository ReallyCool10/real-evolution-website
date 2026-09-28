import React, { useState } from 'react';
import { BasemapStyle, FilterState } from '../types';

interface LayerControlProps {
  basemap: BasemapStyle;
  onBasemapChange: (style: BasemapStyle) => void;
  showBoundaries: boolean;
  onToggleBoundaries: (show: boolean) => void;
  currentZoom: number;
  filter: FilterState;
  onFilterChange: (filter: FilterState) => void;
}

export const LayerControl: React.FC<LayerControlProps> = ({
  basemap,
  onBasemapChange,
  showBoundaries,
  onToggleBoundaries,
  currentZoom,
  filter,
  onFilterChange
}) => {

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexWrap: 'wrap'
    }}>
      {/* Basemap Switcher */}
      <div style={{
        display: 'inline-flex',
        background: 'rgba(10, 13, 20, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '8px',
        padding: '3px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
      }}>
        {(['dark', 'streets', 'light', 'satellite'] as BasemapStyle[]).map((style) => (
          <button
            key={style}
            onClick={() => onBasemapChange(style)}
            style={{
              background: basemap === style ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: basemap === style ? '#ffffff' : 'rgba(255, 255, 255, 0.55)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.75rem',
              fontWeight: 500,
              textTransform: 'capitalize',
              padding: '6px 10px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {style}
          </button>
        ))}
      </div>

      {/* Dataset Filter: All / Overseas / Corporate */}
      <div style={{
        display: 'inline-flex',
        background: 'rgba(10, 13, 20, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '8px',
        padding: '3px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
      }}>
        {[
          { key: 'ALL', label: 'All Entities' },
          { key: 'OCOD', label: 'Overseas' },
          { key: 'CCOD', label: 'Corporate' }
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => onFilterChange({ ...filter, type: item.key as any })}
            style={{
              background: filter.type === item.key ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: filter.type === item.key ? 'hsl(46, 65%, 52%)' : 'rgba(255, 255, 255, 0.55)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.75rem',
              fontWeight: 500,
              padding: '6px 10px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Boundary Toggle (HMLR INSPIRE) */}
      <button
        onClick={() => onToggleBoundaries(!showBoundaries)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: showBoundaries ? 'rgba(244, 63, 94, 0.15)' : 'rgba(10, 13, 20, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: `1px solid ${showBoundaries ? 'rgba(244, 63, 94, 0.4)' : 'rgba(255, 255, 255, 0.12)'}`,
          borderRadius: '8px',
          padding: '7px 12px',
          color: showBoundaries ? '#f43f5e' : 'rgba(255, 255, 255, 0.65)',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.75rem',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
        }}
        title="HM Land Registry INSPIRE Cadastral Parcels"
      >
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '2px',
          border: '1.5px solid currentColor',
          background: showBoundaries ? 'currentColor' : 'transparent'
        }} />
        <span>HMLR Boundaries</span>
        {showBoundaries && currentZoom < 15.5 && (
          <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>(zoom ≥16)</span>
        )}
      </button>
    </div>
  );
};
