import React from 'react';
import { t } from '../i18n.js';

export default function StepSuccess({ config, accent }) {
  const lang = config?.language || 'de';

  return (
    <div style={{ textAlign: 'center', padding: '40px 16px' }}>
      <div style={{
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: `${accent}20`,
        border: `2px solid ${accent}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px',
        fontSize: 32,
      }}>
        ✓
      </div>

      <h2 style={{
        fontSize: 22,
        fontWeight: 800,
        color: accent,
        marginBottom: 12,
      }}>
        {t('successTitle', lang)}
      </h2>

      <p style={{
        fontSize: 15,
        color: '#9ca3af',
        lineHeight: 1.6,
        maxWidth: 320,
        margin: '0 auto',
      }}>
        {t('successMessage', lang)}
      </p>

      {config?.business_name && (
        <p style={{
          fontSize: 13,
          color: '#6b7280',
          marginTop: 16,
        }}>
          — {config.business_name}
        </p>
      )}
    </div>
  );
}
