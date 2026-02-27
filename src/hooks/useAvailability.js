import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.js';

// Returns availability data for the widget calendar
export function useAvailability(operatorId, config) {
  const [availability, setAvailability] = useState(new Map()); // Map<dateISO, {morning, evening}>
  const [blockedDates, setBlockedDates] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!operatorId || !config) return;

    try {
      const now = new Date();
      const minDate = new Date(now);
      minDate.setDate(minDate.getDate() + (config.min_days_advance || 1));
      const maxDate = new Date(now);
      maxDate.setDate(maxDate.getDate() + (config.max_days_advance || 90));

      const fromDMY = formatDMY(minDate);
      const toDMY = formatDMY(maxDate);

      // Load in parallel: slot availability + blocked dates + balloons
      const [slotRes, blockRes, balloonRes] = await Promise.all([
        supabase.rpc('get_slot_availability', {
          p_operator_id: operatorId,
          p_from: fromDMY,
          p_to: toDMY,
        }),
        supabase
          .from('blocked_dates')
          .select('date_iso, slot, balloon_id')
          .eq('user_id', operatorId),
        supabase
          .from('balloons')
          .select('id, capacity, widget_enabled')
          .eq('user_id', operatorId),
      ]);

      // Process blocked dates — separate global blocks from per-balloon blocks
      const blocked = new Set();
      const perBalloonBlocks = []; // [{date_iso, slot, balloon_id}]
      if (blockRes.data) {
        for (const row of blockRes.data) {
          if (!row.balloon_id) {
            // Global block (all balloons)
            if (row.slot === 'both') {
              blocked.add(row.date_iso);
            } else {
              blocked.add(`${row.date_iso}:${row.slot}`);
            }
          } else {
            // Per-balloon block — reduces capacity on that date
            perBalloonBlocks.push(row);
          }
        }
      }
      setBlockedDates(blocked);

      // Calculate capacity from only widget_enabled balloons
      const allBalloons = balloonRes.data || [];
      const enabledBalloons = allBalloons.filter((b) => b.widget_enabled !== false);
      const widgetCapacity = enabledBalloons.reduce((sum, b) => sum + (b.capacity || 0), 0);
      const rpcCapacity = slotRes.data?.[0]?.total_capacity || 0;
      const totalCapacity = enabledBalloons.length > 0 ? widgetCapacity : rpcCapacity;

      // Build a map of per-balloon capacity reductions: Map<"dateISO" | "dateISO:slot", reducedCapacity>
      const capacityReductions = new Map();
      for (const block of perBalloonBlocks) {
        const bl = enabledBalloons.find((b) => b.id === block.balloon_id);
        if (!bl) continue; // Balloon not enabled or not found — no capacity impact
        const cap = bl.capacity || 0;
        if (block.slot === 'both') {
          // Reduce for both slots
          for (const s of ['morning', 'evening']) {
            const key = `${block.date_iso}:${s}`;
            capacityReductions.set(key, (capacityReductions.get(key) || 0) + cap);
          }
        } else {
          const key = `${block.date_iso}:${block.slot}`;
          capacityReductions.set(key, (capacityReductions.get(key) || 0) + cap);
        }
      }

      // Process slot availability into a map
      const map = new Map();

      if (slotRes.data) {
        for (const row of slotRes.data) {
          const existing = map.get(row.date_iso) || {
            morning: { booked: 0, capacity: totalCapacity },
            evening: { booked: 0, capacity: totalCapacity },
          };
          if (row.slot === 'morning') {
            existing.morning.booked = row.booked_passengers;
          } else if (row.slot === 'evening') {
            existing.evening.booked = row.booked_passengers;
          }
          map.set(row.date_iso, existing);
        }
      }

      // Store metadata for capacity calculation
      map._totalCapacity = totalCapacity;
      map._capacityReductions = capacityReductions;
      setAvailability(map);
    } catch (e) {
      console.error('Failed to load availability:', e);
    } finally {
      setLoading(false);
    }
  }, [operatorId, config]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Get effective capacity for a date+slot (total minus per-balloon blocks)
  function getEffectiveCapacity(dateISO, slot) {
    const totalCap = config?.max_passengers_per_slot || availability._totalCapacity || 0;
    const reductions = availability._capacityReductions;
    const reduction = reductions ? (reductions.get(`${dateISO}:${slot}`) || 0) : 0;
    return Math.max(0, totalCap - reduction);
  }

  // Check if a specific date+slot is available for N passengers
  function isAvailable(dateISO, slot, passengerCount = 1) {
    if (!config) return false;

    // Check global blocked
    if (blockedDates.has(dateISO)) return false;
    if (blockedDates.has(`${dateISO}:${slot}`)) return false;

    // Check date range
    const now = new Date();
    const target = new Date(dateISO);
    const diffDays = Math.floor((target - now) / (1000 * 60 * 60 * 24));
    if (diffDays < (config.min_days_advance || 1)) return false;
    if (diffDays > (config.max_days_advance || 90)) return false;

    // Check capacity (with per-balloon reductions)
    const effectiveCap = getEffectiveCapacity(dateISO, slot);
    const slotData = availability.get(dateISO);
    const booked = slotData?.[slot]?.booked || 0;
    const remaining = effectiveCap - booked;

    return remaining >= passengerCount;
  }

  function getRemainingCapacity(dateISO, slot) {
    const effectiveCap = getEffectiveCapacity(dateISO, slot);
    const slotData = availability.get(dateISO);
    const booked = slotData?.[slot]?.booked || 0;
    return Math.max(0, effectiveCap - booked);
  }

  return { availability, blockedDates, loading, isAvailable, getRemainingCapacity, refresh };
}

function formatDMY(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}
