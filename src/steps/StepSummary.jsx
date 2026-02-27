import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { t } from '../i18n.js';
import StripePaymentForm from '../components/StripePaymentForm.jsx';

export default function StepSummary({
  data,
  config,
  accent,
  submitting,
  // Payment props
  paymentPhase,
  clientSecret,
  stripePromise,
  onPay,
  onPayOnSite,
  onPaymentSuccess,
  onPaymentError,
}) {
  const lang = config?.language || 'de';
  const isCustomCategory = data.bookingType?.startsWith('cat_');
  const paymentMode = config?.payment_mode || 'disabled';
  const showPayment = paymentMode !== 'disabled' && stripePromise;

  // Format date for display
  const dateDisplay = data.date
    ? new Date(data.date).toLocaleDateString(lang === 'de' ? 'de-AT' : 'en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-';

  const slotLabel = data.slot === 'morning'
    ? (config?.morning_label || t('morning', lang))
    : (config?.evening_label || t('evening', lang));

  const typeLabel = data.bookingType === 'vip'
    ? t('vip', lang)
    : data.bookingType === 'standard'
      ? t('standard', lang)
      : (data.categoryName || data.bookingType);

  const rows = [
    { label: t('date', lang), value: dateDisplay },
    { label: t('time', lang), value: slotLabel },
    ...(data.locationName ? [{ label: t('location', lang), value: data.locationName }] : []),
    { label: t('type', lang), value: typeLabel },
    { label: isCustomCategory ? t('passengers', lang) : t('adults', lang), value: isCustomCategory ? data.passengers : data.adults },
    ...(!isCustomCategory && data.kids > 0 ? [{ label: t('kids', lang), value: data.kids }] : []),
    { label: t('name', lang), value: data.name },
    { label: t('email', lang), value: data.email },
    ...(data.phone ? [{ label: t('phone', lang), value: data.phone }] : []),
    ...(data.notes ? [{ label: t('notes', lang), value: data.notes }] : []),
  ];

  const priceAccent = isCustomCategory ? '#8b5cf6' : accent;
  const currencySymbol = (config?.currency || 'EUR').toUpperCase() === 'EUR' ? '€' : config?.currency;

  return (
    <div>
      <h2 style={titleStyle}>{t('step4Title', lang)}</h2>

      <div style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}>
        {rows.map((row, i) => (
          <div
            key={row.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}
          >
            <span style={{ fontSize: 13, color: '#9ca3af' }}>{row.label}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb', textAlign: 'right', maxWidth: '60%' }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Total price */}
      {data.totalPrice > 0 && (
        <div style={{
          marginTop: 12,
          padding: '14px 16px',
          backgroundColor: isCustomCategory ? 'rgba(139,92,246,0.08)' : `${accent}10`,
          borderRadius: 12,
          border: isCustomCategory ? '1px solid rgba(139,92,246,0.2)' : `1px solid ${accent}30`,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#e5e7eb' }}>
              {showPayment ? t('totalToPay', lang) : t('total', lang)}
            </span>
            <span style={{ fontSize: 22, fontWeight: 800, color: priceAccent }}>
              {currencySymbol}{data.totalPrice.toFixed(0)}
            </span>
          </div>
          {isCustomCategory ? (
            <div style={{ fontSize: 11, color: '#8b5cf6', marginTop: 4 }}>
              {t('fixedPrice', lang)}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                {data.priceAdult > 0 && (
                  <span>{t('adults', lang)}: {currencySymbol}{data.priceAdult} {t('perPerson', lang)}</span>
                )}
                {data.priceKid > 0 && data.kids > 0 && (
                  <span> · {t('kids', lang)}: {currencySymbol}{data.priceKid} {t('perPerson', lang)}</span>
                )}
              </div>
              {config?.group_discount_min_persons > 0 && (data.adults + data.kids) >= config.group_discount_min_persons && (
                <div style={{ fontSize: 11, color: '#22c55e', marginTop: 4 }}>
                  {lang === 'de' ? 'Gruppenrabatt angewendet' : 'Group discount applied'}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Payment required info */}
      {paymentMode === 'required' && showPayment && paymentPhase === 'idle' && (
        <div style={{
          marginTop: 10,
          padding: '8px 12px',
          backgroundColor: 'rgba(234, 179, 8, 0.08)',
          borderRadius: 8,
          border: '1px solid rgba(234, 179, 8, 0.2)',
          fontSize: 12,
          color: '#eab308',
          textAlign: 'center',
        }}>
          {t('paymentRequired', lang)}
        </div>
      )}

      {/* Stripe Payment Form — shown after create-payment-intent returns client_secret */}
      {showPayment && clientSecret && (paymentPhase === 'collecting' || paymentPhase === 'confirming') && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'night',
              variables: {
                colorPrimary: accent || '#06b6d4',
                colorBackground: '#1e293b',
                colorText: '#e5e7eb',
                colorDanger: '#ef4444',
                borderRadius: '10px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              },
            },
          }}
        >
          <StripePaymentForm
            amount={data.totalPrice}
            currency={config?.currency || 'eur'}
            lang={lang}
            accent={accent}
            onSuccess={onPaymentSuccess}
            onError={onPaymentError}
          />
        </Elements>
      )}

      {/* Payment phase: creating */}
      {paymentPhase === 'creating' && (
        <div style={{
          textAlign: 'center',
          marginTop: 16,
          color: accent,
          fontSize: 14,
        }}>
          ⏳ {t('paymentProcessing', lang)}
        </div>
      )}

      {/* Payment phase: confirming (server-side) */}
      {paymentPhase === 'confirming' && (
        <div style={{
          textAlign: 'center',
          marginTop: 16,
          color: accent,
          fontSize: 14,
        }}>
          ⏳ {t('paymentProcessing', lang)}
        </div>
      )}

      {/* Payment phase: error */}
      {paymentPhase === 'error' && (
        <div style={{
          marginTop: 12,
          padding: '12px 14px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderRadius: 10,
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          fontSize: 13,
          textAlign: 'center',
        }}>
          {t('paymentFailed', lang)}
          <button
            onClick={onPay}
            style={{
              display: 'block',
              margin: '8px auto 0',
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid rgba(239, 68, 68, 0.3)',
              backgroundColor: 'transparent',
              color: '#ef4444',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t('retry', lang)}
          </button>
        </div>
      )}

      {/* Payment phase: success */}
      {paymentPhase === 'done' && (
        <div style={{
          marginTop: 12,
          padding: '12px 14px',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderRadius: 10,
          border: '1px solid rgba(16, 185, 129, 0.2)',
          color: '#10b981',
          fontSize: 14,
          fontWeight: 600,
          textAlign: 'center',
        }}>
          ✓ {t('paymentSuccess', lang)}
        </div>
      )}

      {/* Standard loading indicator (no payment) */}
      {submitting && !showPayment && (
        <div style={{
          textAlign: 'center',
          marginTop: 16,
          color: accent,
          fontSize: 14,
        }}>
          ⏳ {lang === 'de' ? 'Wird gesendet...' : 'Sending...'}
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
