import React, { useState, useMemo } from 'react';
import { Property } from '../types';

export interface SavedPropertyItem {
  id: number;
  title_number: string;
  property_address: string;
  postcode?: string;
  proprietor_name?: string;
  company_reg_no?: string;
  tenure?: string;
  price_paid?: number | null;
  latitude: number;
  longitude: number;
  district?: string;
  county?: string;
  region?: string;
  dataset_type?: 'CCOD' | 'OCOD';
  listName?: string;
  note?: string;
  savedAt: string;
}

interface UserPanelProps {
  isOpen: boolean;
  onClose: () => void;
  savedItems: SavedPropertyItem[];
  onUpdateNote: (id: number, note: string) => void;
  onUpdateList: (id: number, listName: string) => void;
  onRemoveItem: (id: number) => void;
  onSelectProperty: (property: Property) => void;
  onClearAll: () => void;
}

export const UserPanel: React.FC<UserPanelProps> = ({
  isOpen,
  onClose,
  savedItems,
  onUpdateNote,
  onUpdateList,
  onRemoveItem,
  onSelectProperty,
  onClearAll
}) => {
  const [selectedListFilter, setSelectedListFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [customLists, setCustomLists] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('real_intel_custom_lists');
      return saved ? JSON.parse(saved) : ['Watchlist', 'Acquisitions Pipeline', 'Under Review'];
    } catch {
      return ['Watchlist', 'Acquisitions Pipeline', 'Under Review'];
    }
  });

  // Sync custom lists from backend SQLite on mount
  React.useEffect(() => {
    fetch('/api/workspace')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && Array.isArray(data.customLists) && data.customLists.length > 0) {
          setCustomLists(data.customLists);
          localStorage.setItem('real_intel_custom_lists', JSON.stringify(data.customLists));
        }
      })
      .catch(() => {});
  }, []);

  const handleAddList = () => {
    const trimmed = newListName.trim();
    if (trimmed && !customLists.includes(trimmed)) {
      const updated = [...customLists, trimmed];
      setCustomLists(updated);
      localStorage.setItem('real_intel_custom_lists', JSON.stringify(updated));
      fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customLists: updated })
      }).catch(() => {});
      setSelectedListFilter(trimmed);
      setNewListName('');
      setIsAddingList(false);
    }
  };

  const filteredItems = useMemo(() => {
    let items = savedItems;
    if (selectedListFilter !== 'ALL') {
      items = items.filter(item => (item.listName || 'Watchlist') === selectedListFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(item =>
        item.title_number.toLowerCase().includes(q) ||
        item.property_address.toLowerCase().includes(q) ||
        (item.proprietor_name && item.proprietor_name.toLowerCase().includes(q)) ||
        (item.note && item.note.toLowerCase().includes(q)) ||
        (item.postcode && item.postcode.toLowerCase().includes(q))
      );
    }
    return items;
  }, [savedItems, selectedListFilter, searchQuery]);

  // Export to CSV spreadsheet
  const handleExportCSV = () => {
    if (savedItems.length === 0) return;

    const headers = [
      'Title Number',
      'Address',
      'Postcode',
      'Proprietor Name',
      'Company Registration Number',
      'Tenure',
      'Price Paid (£)',
      'List Category',
      'Private Notes',
      'Latitude',
      'Longitude',
      'Date Saved'
    ];

    const escapeCSV = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredItems.map(item => [
      escapeCSV(item.title_number),
      escapeCSV(item.property_address),
      escapeCSV(item.postcode),
      escapeCSV(item.proprietor_name),
      escapeCSV(item.company_reg_no),
      escapeCSV(item.tenure),
      escapeCSV(item.price_paid ?? ''),
      escapeCSV(item.listName || 'Watchlist'),
      escapeCSV(item.note || ''),
      escapeCSV(item.latitude),
      escapeCSV(item.longitude),
      escapeCSV(new Date(item.savedAt).toLocaleDateString('en-GB'))
    ]);

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `REAL_Intel_Portfolio_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export to Print / PDF Document Report
  const handlePrintPDF = () => {
    if (savedItems.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHTML = filteredItems.map((item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
        <td style="padding: 10px 12px; font-family: monospace; font-weight: 600; color: #0f172a;">${item.title_number}</td>
        <td style="padding: 10px 12px; font-weight: 500; color: #1e293b;">${item.property_address}</td>
        <td style="padding: 10px 12px; color: #334155;">${item.proprietor_name || '—'} ${item.company_reg_no ? `<br><small style="color:#64748b;">(${item.company_reg_no})</small>` : ''}</td>
        <td style="padding: 10px 12px; color: #334155;">${item.tenure || '—'}</td>
        <td style="padding: 10px 12px; color: #334155;">${item.price_paid ? '£' + item.price_paid.toLocaleString() : '—'}</td>
        <td style="padding: 10px 12px; font-size: 11px; background: #e0f2fe; color: #0369a1; border-radius: 4px; display: inline-block; margin-top: 8px;">${item.listName || 'Watchlist'}</td>
        <td style="padding: 10px 12px; font-style: italic; color: #475569;">${item.note ? item.note : '<span style="color:#94a3b8;">None</span>'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>REAL Intel — Property Intelligence Portfolio Report</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              margin: 40px;
              background: #ffffff;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .logo {
              font-size: 22px;
              font-weight: 800;
              letter-spacing: 1px;
              color: #0f172a;
            }
            .meta {
              font-size: 12px;
              color: #64748b;
              text-align: right;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
              text-align: left;
            }
            th {
              background: #0f172a;
              color: #ffffff;
              padding: 10px 12px;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            @media print {
              body { margin: 20px; }
              th { background: #0f172a !important; -webkit-print-color-adjust: exact; color: #fff !important; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">REAL INTEL</div>
              <div style="font-size: 13px; color: #475569; margin-top: 4px;">Commercial Land & Property Intelligence Report</div>
            </div>
            <div class="meta">
              <div><strong>Generated:</strong> ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              <div><strong>Filtered View:</strong> ${selectedListFilter === 'ALL' ? 'All Saved Properties' : selectedListFilter}</div>
              <div><strong>Total Records:</strong> ${filteredItems.length}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Title No.</th>
                <th>Address</th>
                <th>Proprietor</th>
                <th>Tenure</th>
                <th>Price Paid</th>
                <th>List</th>
                <th>Notes / Diligence</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div style="margin-top: 30px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px;">
            CONFIDENTIAL — Generated via REAL intel Platform. Contains HM Land Registry & Ordnance Survey Open Data.
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleOpenProperty = (item: SavedPropertyItem) => {
    onSelectProperty({
      id: item.id,
      title_number: item.title_number,
      property_address: item.property_address,
      postcode: item.postcode || '',
      district: item.district || '',
      county: item.county || '',
      region: item.region || '',
      proprietor_name: item.proprietor_name || '',
      company_reg_no: item.company_reg_no || '',
      tenure: item.tenure || 'Freehold',
      price_paid: item.price_paid ?? null,
      dataset_type: item.dataset_type || 'CCOD',
      latitude: item.latitude,
      longitude: item.longitude
    });
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 85,
            transition: 'opacity 0.2s ease'
          }}
        />
      )}

      {/* Drawer Container */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: '460px',
        maxWidth: '92vw',
        background: 'rgba(10, 13, 20, 0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '15px 0 45px rgba(0, 0, 0, 0.6)',
        zIndex: 90,
        display: 'flex',
        flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden'
      }}>
        {/* Drawer Header */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src="/cadastre-logo.svg"
              alt="REAL"
              style={{ width: '22px', height: '22px', borderRadius: '4px' }}
            />
            <div>
              <div style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '1.05rem',
                fontWeight: 700,
                letterSpacing: '1px',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>REAL INTEL</span>
                <span style={{
                  fontSize: '0.65rem',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  textTransform: 'uppercase'
                }}>
                  Workspace
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '2px' }}>
                Saved properties, diligence notes & list management
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
            title="Close Drawer (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Toolbar: Search & Lists */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          background: 'rgba(255, 255, 255, 0.01)',
          flexShrink: 0
        }}>
          {/* Search bar within saved */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved titles, addresses, notes..."
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#ffffff',
              fontSize: '0.78rem',
              outline: 'none'
            }}
          />

          {/* List Filter Pills */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '2px'
          }}>
            <button
              onClick={() => setSelectedListFilter('ALL')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: selectedListFilter === 'ALL' ? '#0284c7' : 'rgba(255, 255, 255, 0.06)',
                color: selectedListFilter === 'ALL' ? '#ffffff' : 'rgba(255, 255, 255, 0.65)'
              }}
            >
              All ({savedItems.length})
            </button>

            {customLists.map(list => {
              const count = savedItems.filter(i => (i.listName || 'Watchlist') === list).length;
              return (
                <button
                  key={list}
                  onClick={() => setSelectedListFilter(list)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    background: selectedListFilter === list ? '#0284c7' : 'rgba(255, 255, 255, 0.06)',
                    color: selectedListFilter === list ? '#ffffff' : 'rgba(255, 255, 255, 0.65)'
                  }}
                >
                  {list} {count > 0 && `(${count})`}
                </button>
              );
            })}

            {!isAddingList ? (
              <button
                onClick={() => setIsAddingList(true)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  border: '1px dashed rgba(255, 255, 255, 0.25)',
                  cursor: 'pointer',
                  background: 'transparent',
                  color: 'rgba(255, 255, 255, 0.55)',
                  whiteSpace: 'nowrap'
                }}
              >
                + New List
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="List name..."
                  autoFocus
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    borderRadius: '4px',
                    padding: '3px 6px',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    outline: 'none',
                    width: '100px'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddList();
                    if (e.key === 'Escape') setIsAddingList(false);
                  }}
                />
                <button
                  onClick={handleAddList}
                  style={{
                    background: '#0284c7',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '0.65rem',
                    padding: '4px 6px',
                    cursor: 'pointer'
                  }}
                >
                  ✓
                </button>
                <button
                  onClick={() => setIsAddingList(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Saved Items List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {filteredItems.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 10px',
              color: 'rgba(255, 255, 255, 0.45)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '2rem', opacity: 0.7 }}>📑</span>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)' }}>
                {savedItems.length === 0 ? 'No Saved Properties Yet' : 'No properties in this list'}
              </div>
              <p style={{ fontSize: '0.78rem', lineHeight: 1.5, maxWidth: '280px', margin: 0 }}>
                {savedItems.length === 0
                  ? 'Click the bookmark icon (★) on any property card or search result to save it to your workspace and add private notes.'
                  : 'Try selecting "All" or a different category above.'}
              </p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  transition: 'border-color 0.15s ease'
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)')}
              >
                {/* Header: Title Number & Badges */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      background: 'rgba(255, 255, 255, 0.06)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {item.title_number}
                    </span>
                    {item.tenure && (
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        background: item.tenure.toLowerCase() === 'freehold' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                        color: item.tenure.toLowerCase() === 'freehold' ? '#4ade80' : '#facc15'
                      }}>
                        {item.tenure}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {/* List Selector Dropdown */}
                    <select
                      value={item.listName || 'Watchlist'}
                      onChange={(e) => onUpdateList(item.id, e.target.value)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '4px',
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '0.68rem',
                        padding: '2px 6px',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {customLists.map(list => (
                        <option key={list} value={list} style={{ background: '#0d1117', color: '#fff' }}>
                          {list}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.35)',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        fontSize: '0.85rem'
                      }}
                      title="Remove from saved"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Address (Clickable to Fly on Map) */}
                <div
                  onClick={() => handleOpenProperty(item)}
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    lineHeight: 1.4
                  }}
                  title="Click to view on map and open inspector"
                >
                  {item.property_address}
                </div>

                {/* Proprietor & Company */}
                {item.proprietor_name && (
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.55)' }}>
                    🏢 {item.proprietor_name}
                    {item.company_reg_no && (
                      <span style={{ marginLeft: '6px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255, 255, 255, 0.4)' }}>
                        ({item.company_reg_no})
                      </span>
                    )}
                  </div>
                )}

                {/* Editable Private Note */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 0.4)'
                  }}>
                    Notes & Diligence
                  </label>
                  <textarea
                    defaultValue={item.note || ''}
                    onBlur={(e) => onUpdateNote(item.id, e.target.value)}
                    placeholder="Add notes (e.g. lease dates, target rent, owner contact)..."
                    rows={2}
                    style={{
                      width: '100%',
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      color: '#f1f5f9',
                      fontSize: '0.74rem',
                      fontFamily: 'Inter, sans-serif',
                      lineHeight: 1.4,
                      resize: 'vertical',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Footer action link */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.35)' }}>
                    Saved {new Date(item.savedAt).toLocaleDateString('en-GB')}
                  </span>
                  <button
                    onClick={() => handleOpenProperty(item)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '0.72rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>View on Map</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleExportCSV}
              disabled={savedItems.length === 0}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: savedItems.length === 0 ? 'rgba(255, 255, 255, 0.05)' : '#0284c7',
                border: 'none',
                borderRadius: '8px',
                color: savedItems.length === 0 ? 'rgba(255, 255, 255, 0.3)' : '#ffffff',
                padding: '9px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: savedItems.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Download full portfolio spreadsheet with all columns and notes"
            >
              <span>📊</span>
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrintPDF}
              disabled={savedItems.length === 0}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: savedItems.length === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: savedItems.length === 0 ? 'rgba(255, 255, 255, 0.3)' : '#ffffff',
                padding: '9px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: savedItems.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Generate printable PDF report (Save as PDF)"
            >
              <span>📄</span>
              <span>Print / PDF</span>
            </button>
          </div>

          {savedItems.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all saved properties from your workspace?')) {
                    onClearAll();
                  }
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(239, 68, 68, 0.7)',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                Clear all saved properties
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
