import React from 'react';

export default function Counter({ label, value, onChange, min = 0, max = 99, accent }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 0',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <span style={{ fontSize: 15, color: '#e5e7eb' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          style={{
            ...btnBase,
            width: 48,
            height: 48,
            borderRadius: 24,
            border: '1.5px solid rgba(255,255,255,0.15)',
            backgroundColor: 'transparent',
            color: value <= min ? '#4b5563' : '#e5e7eb',
            cursor: value <= min ? 'not-allowed' : 'pointer',
            opacity: value <= min ? 0.5 : 1,
          }}
        >
          −
        </button>
        <span style={{
          minWidth: 32,
          textAlign: 'center',
          fontSize: 20,
          fontWeight: 700,
          color: accent,
        }}>
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          style={{
            ...btnBase,
            width: 48,
            height: 48,
            borderRadius: 24,
            border: `1.5px solid ${accent}40`,
            backgroundColor: `${accent}15`,
            color: value >= max ? '#4b5563' : accent,
            cursor: value >= max ? 'not-allowed' : 'pointer',
            opacity: value >= max ? 0.5 : 1,
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

const btnBase = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 22,
  fontWeight: 600,
  lineHeight: 1,
  padding: 0,
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation',
  userSelect: 'none',
  boxSizing: 'border-box',
};
