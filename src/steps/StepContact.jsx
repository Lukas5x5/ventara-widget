import React from 'react';
import { t } from '../i18n.js';

export default function StepContact({ data, onChange, config, accent, errors }) {
  const lang = config?.language || 'de';

  return (
    <div>
      <h2 style={titleStyle}>{t('step3Title', lang)}</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field
          label={t('name', lang)}
          value={data.name}
          onChange={(v) => onChange({ name: v })}
          error={errors?.name}
          accent={accent}
          required
        />
        <Field
          label={t('email', lang)}
          type="email"
          value={data.email}
          onChange={(v) => onChange({ email: v })}
          error={errors?.email}
          accent={accent}
          required
        />
        <Field
          label={t('phone', lang)}
          type="tel"
          value={data.phone}
          onChange={(v) => onChange({ phone: v })}
          error={errors?.phone}
          accent={accent}
          required
        />
        <div>
          <label style={labelStyle}>{t('notes', lang)}</label>
          <textarea
            value={data.notes || ''}
            onChange={(e) => onChange({ notes: e.target.value })}
            rows={3}
            style={{
              ...inputStyle,
              resize: 'vertical',
              minHeight: 80,
              fontFamily: 'inherit',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', error, accent, required }) {
  return (
    <div>
      <label style={labelStyle}>
        {label} {required && <span style={{ color: accent }}>*</span>}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...inputStyle,
          borderColor: error ? '#ef4444' : 'rgba(255,255,255,0.12)',
        }}
      />
      {error && (
        <span style={{ fontSize: 12, color: '#ef4444', marginTop: 4, display: 'block' }}>
          {error}
        </span>
      )}
    </div>
  );
}

const titleStyle = {
  fontSize: 20,
  fontWeight: 700,
  color: '#e5e7eb',
  marginBottom: 16,
};

const labelStyle = {
  display: 'block',
  fontSize: 14,
  fontWeight: 600,
  color: '#9ca3af',
  marginBottom: 6,
};

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  minHeight: 48,
  borderRadius: 12,
  border: '1.5px solid rgba(255,255,255,0.12)',
  backgroundColor: 'rgba(255,255,255,0.04)',
  color: '#e5e7eb',
  fontSize: 16,
  outline: 'none',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
  WebkitAppearance: 'none',
};
