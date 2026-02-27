import React, { useMemo } from 'react';

const WEEKDAYS_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const WEEKDAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS_DE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Calendar({
  selectedDate,
  onSelect,
  month,
  year,
  onMonthChange,
  isDateAvailable,
  getRemainingForDate,
  accent,
  lang = 'de',
}) {
  const weekdays = lang === 'de' ? WEEKDAYS_DE : WEEKDAYS_EN;
  const monthNames = lang === 'de' ? MONTHS_DE : MONTHS_EN;

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    // getDay() returns 0=Sun, we want Mon=0
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];

    // Empty cells before first day
    for (let i = 0; i < startOffset; i++) {
      cells.push(null);
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, iso });
    }

    return cells;
  }, [month, year]);

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return (
    <div>
      {/* Month navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <button
          onClick={() => onMonthChange(-1)}
          style={navBtnStyle}
        >
          ‹
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#e5e7eb' }}>
          {monthNames[month]} {year}
        </span>
        <button
          onClick={() => onMonthChange(1)}
          style={navBtnStyle}
        >
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 6 }}>
        {weekdays.map(wd => (
          <div key={wd} style={{
            textAlign: 'center',
            fontSize: 12,
            color: '#6b7280',
            fontWeight: 600,
            padding: '6px 0',
          }}>
            {wd}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {days.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} />;

          const { day, iso } = cell;
          const isToday = iso === today;
          const isSelected = iso === selectedDate;
          const available = isDateAvailable(iso);
          const remaining = getRemainingForDate(iso);
          const isPast = iso < today;
          const canTap = available && !isPast;

          return (
            <button
              key={iso}
              onClick={() => canTap && onSelect(iso)}
              disabled={!canTap}
              style={{
                ...dayCellBase,
                minHeight: 44,
                padding: '8px 2px',
                border: isSelected ? `2px solid ${accent}` : '2px solid transparent',
                borderRadius: 10,
                backgroundColor: isSelected
                  ? `${accent}20`
                  : canTap
                    ? 'rgba(255,255,255,0.03)'
                    : 'transparent',
                cursor: canTap ? 'pointer' : 'default',
              }}
            >
              <div style={{
                fontSize: 15,
                fontWeight: isToday ? 800 : 500,
                color: isPast
                  ? '#374151'
                  : !available
                    ? '#4b5563'
                    : isSelected
                      ? accent
                      : '#e5e7eb',
              }}>
                {day}
              </div>
              {canTap && remaining > 0 && (
                <div style={{
                  fontSize: 9,
                  color: remaining <= 3 ? '#f59e0b' : '#22c55e',
                  marginTop: 2,
                }}>
                  {remaining}
                </div>
              )}
              {!isPast && !available && (
                <div style={{ fontSize: 9, color: '#ef4444', marginTop: 2 }}>—</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const touchBase = {
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation',
  userSelect: 'none',
  boxSizing: 'border-box',
};

const navBtnStyle = {
  ...touchBase,
  width: 48,
  height: 48,
  borderRadius: 24,
  border: '1.5px solid rgba(255,255,255,0.15)',
  backgroundColor: 'transparent',
  color: '#e5e7eb',
  fontSize: 24,
  fontWeight: 300,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
};

const dayCellBase = {
  ...touchBase,
  textAlign: 'center',
  transition: 'all 0.15s',
  outline: 'none',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};
