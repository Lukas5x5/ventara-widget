import React, { useState, useCallback, useEffect } from 'react';
import { useWidgetConfig } from './hooks/useWidgetConfig.js';
import { useAvailability } from './hooks/useAvailability.js';
import { supabase } from './supabase.js';
import { t } from './i18n.js';
import ProgressBar from './components/ProgressBar.jsx';
import StepDate from './steps/StepDate.jsx';
import StepDetails from './steps/StepDetails.jsx';
import StepContact from './steps/StepContact.jsx';
import StepSummary from './steps/StepSummary.jsx';
import StepSuccess from './steps/StepSuccess.jsx';

const SUPABASE_URL = 'https://ttfmksjpmooojqwfatvb.supabase.co';
const TOTAL_STEPS = 4;

const touchBase = {
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation',
  userSelect: 'none',
  boxSizing: 'border-box',
};

export default function App({ operatorId }) {
  const { config, loading: configLoading, error: configError } = useWidgetConfig(operatorId);
  const { isAvailable, getRemainingCapacity, refresh: refreshAvailability } = useAvailability(operatorId, config);

  const accent = config?.accent_color || '#06b6d4';
  const lang = config?.language || 'de';

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [contactErrors, setContactErrors] = useState({});

  // Payment state
  const [paymentPhase, setPaymentPhase] = useState('idle');
  // 'idle' | 'creating' | 'collecting' | 'confirming' | 'done' | 'error'
  const [clientSecret, setClientSecret] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [bookingId, setBookingId] = useState(null);

  const [data, setData] = useState({
    // Step 1: Date
    date: '',
    slot: '',
    locationId: '',
    locationName: '',
    // Step 2: Details
    adults: 1,
    kids: 0,
    passengers: 1,
    bookingType: 'standard',
    categoryName: '',
    priceAdult: 0,
    priceKid: 0,
    totalPrice: 0,
    // Step 3: Contact
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  const update = useCallback((patch) => {
    setData(prev => ({ ...prev, ...patch }));
  }, []);

  // Load Stripe.js when config is available and payment is enabled
  useEffect(() => {
    if (config?.payment_mode && config.payment_mode !== 'disabled' && config.stripe_publishable_key) {
      import('@stripe/stripe-js').then(({ loadStripe }) => {
        setStripePromise(loadStripe(config.stripe_publishable_key));
      });
    }
  }, [config?.payment_mode, config?.stripe_publishable_key]);

  const paymentMode = config?.payment_mode || 'disabled';
  const showPayment = paymentMode !== 'disabled' && stripePromise;

  // Validation per step
  function canProceed() {
    switch (step) {
      case 0: return data.date && data.slot;
      case 1: {
        // Custom category: always valid (persons fixed by category)
        if (data.bookingType?.startsWith('cat_')) return true;
        const minPax = config?.min_passengers || 1;
        const total = data.adults + data.kids;
        if (total < minPax) return false;
        // VIP minimum enforcement
        const vipMin = Number(config?.vip_min_passengers) || 0;
        if (data.bookingType === 'vip' && vipMin > 0 && data.adults < vipMin) return false;
        return true;
      }
      case 2: return data.name.trim() && data.email.trim() && /\S+@\S+\.\S+/.test(data.email) && data.phone.trim();
      case 3: {
        if (submitting) return false;
        // When payment form is visible, hide the main button (StripePaymentForm has its own)
        if (paymentPhase === 'collecting' || paymentPhase === 'confirming' || paymentPhase === 'creating' || paymentPhase === 'done') return false;
        return true;
      }
      default: return false;
    }
  }

  function validateContact() {
    const errs = {};
    if (!data.name.trim()) errs.name = t('required', lang);
    if (!data.email.trim()) errs.email = t('required', lang);
    else if (!/\S+@\S+\.\S+/.test(data.email)) errs.email = t('invalidEmail', lang);
    if (!data.phone.trim()) errs.phone = t('required', lang);
    setContactErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (step === 2 && !validateContact()) return;
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      // On summary step: decide flow
      if (showPayment && paymentMode === 'required') {
        handleStripePayment();
      } else {
        handleDirectSubmit();
      }
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  // Build booking data object for both flows
  function buildBookingData() {
    const [y, m, d] = data.date.split('-');
    const plannedDate = `${d}.${m}.${y}`;
    return {
      customer_name: data.name.trim(),
      customer_email: data.email.trim(),
      customer_phone: data.phone.trim(),
      planned_date: plannedDate,
      start_type: data.slot,
      location_id: data.locationId || config?.default_location_id || '',
      location_name: data.locationName || '',
      passengers: data.adults + data.kids,
      kids_count: data.kids,
      booking_type: data.bookingType,
      category_name: data.categoryName || '',
      price_adult: data.priceAdult,
      price_kid: data.priceKid,
      total_price: data.totalPrice,
      customer_notes: data.notes.trim(),
      currency: config?.currency || 'eur',
    };
  }

  // Direct submit (no payment)
  async function handleDirectSubmit() {
    setSubmitting(true);
    try {
      const bd = buildBookingData();
      const { error } = await supabase.from('widget_bookings').insert({
        operator_id: operatorId,
        customer_name: bd.customer_name,
        customer_email: bd.customer_email,
        customer_phone: bd.customer_phone,
        planned_date: bd.planned_date,
        start_type: bd.start_type,
        location_id: bd.location_id,
        location_name: bd.location_name,
        passengers: bd.passengers,
        kids_count: bd.kids_count,
        booking_type: bd.booking_type,
        category_name: bd.category_name,
        price_adult: bd.price_adult,
        price_kid: bd.price_kid,
        total_price: bd.total_price,
        customer_notes: bd.customer_notes,
        status: 'pending',
        payment_method: 'none',
      });

      if (error) throw error;
      refreshAvailability();
      setStep(TOTAL_STEPS); // success
    } catch (e) {
      console.error('Submit error:', e);
      alert(t('loadingError', lang));
    } finally {
      setSubmitting(false);
    }
  }

  // Stripe payment flow
  async function handleStripePayment() {
    setPaymentPhase('creating');
    try {
      const bd = buildBookingData();

      // Call Edge Function to create PaymentIntent + booking
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator_id: operatorId,
          booking_data: bd,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.client_secret) {
        throw new Error(result.error || 'Failed to create payment');
      }

      setClientSecret(result.client_secret);
      setBookingId(result.booking_id);
      setPaymentPhase('collecting'); // Show Stripe form
    } catch (e) {
      console.error('Payment creation error:', e);
      setPaymentPhase('error');
    }
  }

  // Called by StripePaymentForm on successful card payment
  async function handlePaymentSuccess(paymentIntentId) {
    setPaymentPhase('confirming');
    try {
      // Server-side confirmation
      const response = await fetch(`${SUPABASE_URL}/functions/v1/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          payment_intent_id: paymentIntentId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPaymentPhase('done');
        refreshAvailability();
        // Short delay to show success, then go to success screen
        setTimeout(() => setStep(TOTAL_STEPS), 1200);
      } else {
        setPaymentPhase('error');
      }
    } catch (e) {
      console.error('Payment confirmation error:', e);
      setPaymentPhase('error');
    }
  }

  function handlePaymentError(msg) {
    console.error('Payment error:', msg);
    setPaymentPhase('error');
  }

  // "Pay on site" for optional payment mode
  function handlePayOnSite() {
    handleDirectSubmit();
  }

  // Loading state
  if (configLoading) {
    return (
      <div style={{ ...containerStyle, textAlign: 'center', padding: 40 }}>
        <div style={{ color: '#6b7280', fontSize: 14 }}>⏳</div>
      </div>
    );
  }

  // Error state
  if (configError || !config) {
    return (
      <div style={{ ...containerStyle, textAlign: 'center', padding: 40 }}>
        <div style={{ color: '#ef4444', fontSize: 14 }}>{t('loadingError', lang)}</div>
      </div>
    );
  }

  // Success state
  if (step === TOTAL_STEPS) {
    return (
      <div style={containerStyle}>
        <StepSuccess config={config} accent={accent} />
        <Footer config={config} accent={accent} />
      </div>
    );
  }

  const stepLabels = [
    t('step1Title', lang),
    t('step2Title', lang),
    t('step3Title', lang),
    t('step4Title', lang),
  ];

  // Determine button text for summary step
  const getSubmitLabel = () => {
    if (paymentPhase === 'creating') return t('paymentProcessing', lang);
    if (showPayment && paymentMode === 'required') return `${t('payNow', lang)} €${data.totalPrice.toFixed(0)}`;
    return t('submit', lang);
  };

  // Don't show main buttons when Stripe form is active
  const hideMainButtons = paymentPhase === 'collecting' || paymentPhase === 'confirming' || paymentPhase === 'done';

  return (
    <div style={containerStyle}>
      {/* Business header */}
      {config.business_name && (
        <div style={{
          textAlign: 'center',
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          {config.logo_url && (
            <img
              src={config.logo_url}
              alt={config.business_name}
              style={{ height: 36, marginBottom: 8, objectFit: 'contain' }}
            />
          )}
          <div style={{ fontSize: 16, fontWeight: 700, color: '#e5e7eb' }}>
            {config.business_name}
          </div>
        </div>
      )}

      <ProgressBar step={step} totalSteps={TOTAL_STEPS} labels={stepLabels} accent={accent} />

      {/* Step content */}
      <div style={{ minHeight: 300 }}>
        {step === 0 && (
          <StepDate
            data={data}
            onChange={update}
            config={config}
            isAvailable={isAvailable}
            getRemainingCapacity={getRemainingCapacity}
            accent={accent}
          />
        )}
        {step === 1 && (
          <StepDetails
            data={data}
            onChange={update}
            config={config}
            accent={accent}
          />
        )}
        {step === 2 && (
          <StepContact
            data={data}
            onChange={update}
            config={config}
            accent={accent}
            errors={contactErrors}
          />
        )}
        {step === 3 && (
          <StepSummary
            data={data}
            config={config}
            accent={accent}
            submitting={submitting}
            paymentPhase={paymentPhase}
            clientSecret={clientSecret}
            stripePromise={stripePromise}
            onPay={handleStripePayment}
            onPayOnSite={handlePayOnSite}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
        )}
      </div>

      {/* Navigation buttons */}
      {!hideMainButtons && (
        <div style={{
          display: 'flex',
          gap: 10,
          marginTop: 24,
          paddingTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          {step > 0 && (
            <button onClick={handleBack} disabled={paymentPhase === 'creating'} style={{
              ...backBtnStyle,
              opacity: paymentPhase === 'creating' ? 0.5 : 1,
              cursor: paymentPhase === 'creating' ? 'not-allowed' : 'pointer',
            }}>
              {t('back', lang)}
            </button>
          )}

          {/* Summary step with optional payment: two buttons side by side */}
          {step === TOTAL_STEPS - 1 && showPayment && paymentMode === 'optional' ? (
            <>
              <button
                onClick={handlePayOnSite}
                disabled={submitting}
                style={{
                  ...nextBtnStyle,
                  backgroundColor: 'transparent',
                  border: `1.5px solid ${accent}`,
                  color: accent,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.5 : 1,
                  flex: 1,
                }}
              >
                {t('payOnSite', lang)}
              </button>
              <button
                onClick={handleStripePayment}
                disabled={submitting}
                style={{
                  ...nextBtnStyle,
                  backgroundColor: canProceed() ? accent : '#374151',
                  cursor: canProceed() ? 'pointer' : 'not-allowed',
                  opacity: canProceed() ? 1 : 0.5,
                  flex: 1,
                }}
              >
                {`${t('payNow', lang)} €${data.totalPrice.toFixed(0)}`}
              </button>
            </>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              style={{
                ...nextBtnStyle,
                backgroundColor: canProceed() ? accent : '#374151',
                cursor: canProceed() ? 'pointer' : 'not-allowed',
                opacity: canProceed() ? 1 : 0.5,
                flex: 1,
              }}
            >
              {step === TOTAL_STEPS - 1 ? getSubmitLabel() : t('next', lang)}
            </button>
          )}
        </div>
      )}

      <Footer config={config} accent={accent} />
    </div>
  );
}

function Footer({ config, accent }) {
  return (
    <div style={{
      textAlign: 'center',
      marginTop: 16,
      paddingTop: 12,
      borderTop: '1px solid rgba(255,255,255,0.04)',
    }}>
      <a
        href="https://www.ventara.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: 11, color: '#4b5563', textDecoration: 'none' }}
      >
        {t('poweredBy', config?.language || 'de')}
      </a>
    </div>
  );
}

const containerStyle = {
  maxWidth: 440,
  margin: '0 auto',
  padding: 24,
  backgroundColor: '#0f172a',
  borderRadius: 20,
  border: '1px solid rgba(255,255,255,0.08)',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const backBtnStyle = {
  ...touchBase,
  padding: '16px 24px',
  minHeight: 52,
  borderRadius: 14,
  border: '1.5px solid rgba(255,255,255,0.15)',
  backgroundColor: 'transparent',
  color: '#9ca3af',
  fontSize: 16,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s',
};

const nextBtnStyle = {
  ...touchBase,
  padding: '16px 24px',
  minHeight: 52,
  borderRadius: 14,
  border: 'none',
  color: '#fff',
  fontSize: 16,
  fontWeight: 700,
  transition: 'all 0.15s',
};
