import React, { useState } from 'react';
import Calendar from '../components/Calendar.jsx';
import { t } from '../i18n.js';

const touchBase = {
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation',
  userSelect: 'none',
  boxSizing: 'border-box',
};

export default function StepDate({ data, onChange, config, isAvailable, getRemainingCapacity, accent }) {
  const lang = config?.language || 'de';
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  function handleMonthChange(dir) {
    let m = month + dir;
    let y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setMonth(m);
    setYear(y);
  }

  // Check if date is available for at least 1 passenger in any slot
  function isDateAvailable(iso) {
    return isAvailable(iso, 'morning', 1) || isAvailable(iso, 'evening', 1);
  }

  // Get max remaining across slots
  function getRemainingForDate(iso) {
    const m = getRemainingCapacity(iso, 'morning');
    const e = getRemainingCapacity(iso, 'evening');
    return Math.max(m, e);
  }

  // Available slots for selected date
  const morningAvailable = data.date ? isAvailable(data.date, 'morning', 1) : false;
  const eveningAvailable = data.date ? isAvailable(data.date, 'evening', 1) : false;
  const morningRemaining = data.date ? getRemainingCapacity(data.date, 'morning') : 0;
  const eveningRemaining = data.date ? getRemainingCapacity(data.date, 'evening') : 0;

  return (
    <div>
      <h2 style={titleStyle}>{t('step1Title', lang)}</h2>

      <Calendar
        selectedDate={data.date}
        onSelect={(iso) => onChange({ date: iso, slot: '' })}
        month={month}
        year={year}
        onMonthChange={handleMonthChange}
        isDateAvailable={isDateAvailable}
        getRemainingForDate={getRemainingForDate}
        accent={accent}
        lang={lang}
      />

      {/* Slot selection */}
      {data.date && (
        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 10 }}>
            {t('selectSlot', lang)}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { key: 'morning', label: config?.morning_label || t('morning', lang), available: morningAvailable, remaining: morningRemaining },
              { key: 'evening', label: config?.evening_label || t('evening', lang), available: eveningAvailable, remaining: eveningRemaining },
            ].map(slot => {
              const isActive = data.slot === slot.key;
              return (
                <button
                  key={slot.key}
                  onClick={() => slot.available && onChange({ slot: slot.key })}
                  disabled={!slot.available}
                  style={{
                    ...touchBase,
                    flex: 1,
                    padding: '16px 14px',
                    minHeight: 56,
                    borderRadius: 14,
                    border: isActive
                      ? `2px solid ${accent}`
                      : '2px solid rgba(255,255,255,0.1)',
                    backgroundColor: isActive
                      ? `${accent}15`
                      : !slot.available
                        ? 'rgba(255,255,255,0.02)'
                        : 'rgba(255,255,255,0.04)',
                    cursor: slot.available ? 'pointer' : 'not-allowed',
                    textAlign: 'center',
                    transition: 'all 0.15s',
                    opacity: !slot.available ? 0.5 : 1,
                  }}
                >
                  <div style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: !slot.available ? '#4b5563' : isActive ? accent : '#e5e7eb',
                  }}>
                    {slot.label}
                  </div>
                  <div style={{
                    fontSize: 12,
                    marginTop: 4,
                    color: !slot.available ? '#374151' : slot.remaining <= 3 ? '#f59e0b' : '#22c55e',
                  }}>
                    {slot.available
                      ? `${slot.remaining} ${t('spotsLeft', lang)}`
                      : t('fullyBooked', lang)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Location picker (if multiple locations) */}
      {data.date && data.slot && config?.locations?.length > 1 && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 8 }}>
            {t('location', lang)}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {config.locations.map(loc => {
              const isActive = data.locationId === loc.id;
              return (
                <button
                  key={loc.id}
                  onClick={() => onChange({ locationId: loc.id, locationName: loc.name })}
                  style={{
                    ...touchBase,
                    padding: '14px 20px',
                    minHeight: 48,
                    borderRadius: 12,
                    border: isActive
                      ? `2px solid ${accent}`
                      : '2px solid rgba(255,255,255,0.1)',
                    backgroundColor: isActive ? `${accent}15` : 'transparent',
                    color: isActive ? accent : '#e5e7eb',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {loc.name}
                </button>
              );
            })}
          </div>
        </div>
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
