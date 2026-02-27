import React from 'react';
import Counter from '../components/Counter.jsx';
import { t } from '../i18n.js';
import { getPrice } from '../utils/pricing.js';

const touchBase = {
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation',
  userSelect: 'none',
  boxSizing: 'border-box',
};

export default function StepDetails({ data, onChange, config, accent }) {
  const lang = config?.language || 'de';
  const adults = data.adults || 1;
  const kids = data.kids || 0;
  const total = adults + kids;
  const maxPax = config?.max_passengers || 20;

  // Custom categories
  const customCategories = (config?.custom_categories || []).filter(c => c.enabled);
  const isCustomCategory = data.bookingType?.startsWith('cat_');
  const selectedCategory = isCustomCategory
    ? customCategories.find(c => c.id === data.bookingType)
    : null;

  // Pricing — date/slot-aware with group discount (only for standard/vip)
  const isVip = data.bookingType === 'vip';
  const vipMin = Number(config?.vip_min_passengers) || 0;
  const { adultPrice: priceAdult, kidPrice: priceKid } = isCustomCategory
    ? { adultPrice: 0, kidPrice: 0 }
    : getPrice(config, data.date, data.slot, isVip, total);
  const totalPrice = isCustomCategory
    ? (selectedCategory?.price || 0)
    : (adults * priceAdult + kids * priceKid);

  // Auto-set adults to VIP minimum when VIP is selected
  React.useEffect(() => {
    if (isVip && vipMin > 0 && adults < vipMin) {
      onChange({ adults: vipMin });
    }
  }, [isVip, vipMin]);

  // Update total price when values change (only for standard/vip)
  React.useEffect(() => {
    if (isCustomCategory && selectedCategory) {
      onChange({
        priceAdult: 0,
        priceKid: 0,
        totalPrice: selectedCategory.price,
        passengers: selectedCategory.persons,
      });
    } else {
      onChange({
        priceAdult,
        priceKid,
        totalPrice,
        passengers: total,
      });
    }
  }, [adults, kids, isVip, priceAdult, priceKid, isCustomCategory, selectedCategory?.id]);

  return (
    <div>
      <h2 style={titleStyle}>{t('step2Title', lang)}</h2>

      {/* Booking type selector (Standard/VIP) */}
      {config?.allow_vip && config?.allow_zusteiger && (
        <div style={{ marginBottom: customCategories.length > 0 ? 10 : 20 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { key: 'standard', label: t('standard', lang), desc: t('standardDesc', lang), show: config?.allow_zusteiger },
              { key: 'vip', label: t('vip', lang), desc: t('vipDesc', lang), show: config?.allow_vip },
            ].filter(o => o.show).map(option => {
              const isActive = data.bookingType === option.key;
              const accentColor = option.key === 'vip' ? '#f59e0b' : accent;
              return (
                <button
                  key={option.key}
                  onClick={() => onChange({
                    bookingType: option.key,
                    categoryName: '',
                    adults: option.key === 'vip' && vipMin > 0 ? vipMin : 1,
                    kids: 0,
                  })}
                  style={{
                    ...touchBase,
                    flex: 1,
                    padding: '18px 16px',
                    minHeight: 56,
                    borderRadius: 14,
                    border: isActive
                      ? `2px solid ${accentColor}`
                      : '2px solid rgba(255,255,255,0.1)',
                    backgroundColor: isActive
                      ? (option.key === 'vip' ? 'rgba(245,158,11,0.1)' : `${accent}10`)
                      : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: isActive ? accentColor : '#e5e7eb',
                    marginBottom: 6,
                  }}>
                    {option.key === 'vip' ? '⭐ ' : ''}{option.label}
                  </div>
                  <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.5 }}>
                    {option.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom category cards */}
      {customCategories.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {customCategories.map(cat => {
            const isActive = data.bookingType === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onChange({
                  bookingType: cat.id,
                  categoryName: cat.name,
                  adults: cat.persons,
                  kids: 0,
                  priceAdult: 0,
                  priceKid: 0,
                  totalPrice: cat.price,
                  passengers: cat.persons,
                })}
                style={{
                  ...touchBase,
                  padding: '18px 16px',
                  minHeight: 56,
                  borderRadius: 14,
                  border: isActive ? '2px solid #8b5cf6' : '2px solid rgba(255,255,255,0.1)',
                  backgroundColor: isActive ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  width: '100%',
                }}
              >
                <div style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: isActive ? '#8b5cf6' : '#e5e7eb',
                  marginBottom: 6,
                }}>
                  {cat.name}
                </div>
                <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.5 }}>
                  {cat.persons} {t('personsFixed', lang)} · €{cat.price}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Passenger counters — only for standard/vip */}
      {!isCustomCategory && (
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderRadius: 14,
          padding: '4px 16px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <Counter
            label={t('adults', lang)}
            value={adults}
            onChange={(v) => onChange({ adults: v })}
            min={isVip && vipMin > 0 ? vipMin : 1}
            max={maxPax - kids}
            accent={accent}
          />
          <Counter
            label={t('kids', lang)}
            value={kids}
            onChange={(v) => onChange({ kids: v })}
            min={0}
            max={maxPax - adults}
            accent={accent}
          />
        </div>
      )}

      {/* Fixed person display for custom categories */}
      {isCustomCategory && selectedCategory && (
        <div style={{
          backgroundColor: 'rgba(139,92,246,0.06)',
          borderRadius: 14,
          padding: '16px',
          border: '1px solid rgba(139,92,246,0.15)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 14, color: '#9ca3af' }}>
              {t('passengers', lang)}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#8b5cf6' }}>
              {selectedCategory.persons}
            </div>
          </div>
        </div>
      )}

      {/* Total passengers / price */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        padding: '14px 16px',
        backgroundColor: isCustomCategory ? 'rgba(139,92,246,0.08)' : `${accent}10`,
        borderRadius: 12,
        border: isCustomCategory ? '1px solid rgba(139,92,246,0.2)' : `1px solid ${accent}30`,
      }}>
        <span style={{ fontSize: 15, color: '#e5e7eb' }}>
          {isCustomCategory
            ? selectedCategory?.name
            : <>{t('passengers', lang)}: <strong>{total}</strong></>}
        </span>
        {totalPrice > 0 && (
          <span style={{ fontSize: 18, fontWeight: 700, color: isCustomCategory ? '#8b5cf6' : accent }}>
            €{totalPrice.toFixed(0)}
          </span>
        )}
      </div>

      {/* Per-person price breakdown (standard/vip only) */}
      {totalPrice > 0 && !isCustomCategory && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280', textAlign: 'right' }}>
          {priceAdult > 0 && (
            <span>{t('adults', lang)}: €{priceAdult} {t('perPerson', lang)}</span>
          )}
          {priceKid > 0 && kids > 0 && (
            <span> · {t('kids', lang)}: €{priceKid} {t('perPerson', lang)}</span>
          )}
          {config?.group_discount_min_persons > 0 && total >= config.group_discount_min_persons && (
            <div style={{ color: '#22c55e', marginTop: 4 }}>
              {lang === 'de' ? `Gruppenrabatt ab ${config.group_discount_min_persons} Personen` : `Group discount from ${config.group_discount_min_persons} persons`}
            </div>
          )}
        </div>
      )}

      {/* Fixed price label for custom categories */}
      {totalPrice > 0 && isCustomCategory && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#8b5cf6', textAlign: 'right' }}>
          {t('fixedPrice', lang)}
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
