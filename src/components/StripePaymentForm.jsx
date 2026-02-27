import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { t } from '../i18n.js';

export default function StripePaymentForm({ amount, currency, lang, accent, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message);
      setProcessing(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message);
      setProcessing(false);
      if (onError) onError(confirmError.message);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setProcessing(false);
      if (onSuccess) onSuccess(paymentIntent.id);
    } else {
      setProcessing(false);
      setError(t('paymentFailed', lang));
      if (onError) onError('Payment not completed');
    }
  };

  const currencySymbol = (currency || 'eur').toUpperCase() === 'EUR' ? '€' : currency?.toUpperCase();

  return (
    <div style={{ marginTop: 16 }}>
      {/* Secure payment header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
        padding: '10px 14px',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        borderRadius: 10,
        border: '1px solid rgba(16, 185, 129, 0.2)',
      }}>
        <span style={{ fontSize: 14 }}>🔒</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>
          {t('securePayment', lang)}
        </span>
      </div>

      {/* Card details label */}
      <div style={{
        fontSize: 13,
        fontWeight: 600,
        color: '#9ca3af',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {t('cardDetails', lang)}
      </div>

      {/* Stripe PaymentElement */}
      <form onSubmit={handleSubmit}>
        <div style={{
          padding: 14,
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <PaymentElement
            options={{
              layout: 'tabs',
              defaultValues: {},
            }}
          />
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            marginTop: 10,
            padding: '10px 14px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 10,
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* Pay button */}
        <button
          type="submit"
          disabled={!stripe || processing}
          style={{
            width: '100%',
            marginTop: 14,
            padding: '16px 24px',
            minHeight: 52,
            borderRadius: 14,
            border: 'none',
            backgroundColor: processing ? '#374151' : (accent || '#06b6d4'),
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            cursor: processing ? 'not-allowed' : 'pointer',
            opacity: processing ? 0.7 : 1,
            transition: 'all 0.15s',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
            userSelect: 'none',
            boxSizing: 'border-box',
          }}
        >
          {processing
            ? t('paymentProcessing', lang)
            : `${t('payNow', lang)} ${currencySymbol}${amount.toFixed(0)}`
          }
        </button>
      </form>
    </div>
  );
}
