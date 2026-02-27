import React from 'react';

export default function ProgressBar({ step, totalSteps, labels, accent }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const active = i <= step;
        return (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              height: 4,
              borderRadius: 2,
              backgroundColor: active ? accent : 'rgba(255,255,255,0.1)',
              transition: 'background-color 0.3s',
            }} />
            <span style={{
              fontSize: 11,
              color: active ? accent : '#6b7280',
              marginTop: 4,
              display: 'block',
              fontWeight: active ? 600 : 400,
            }}>
              {labels[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
