// Calculate price based on date, slot, booking type, and group size
export function getPrice(config, date, slot, isVip, totalPersons) {
  if (!config || !date || !slot) {
    const adultPrice = isVip
      ? (config?.price_vip_adult || config?.price_adult || 0)
      : (config?.price_adult || 0);
    const kidPrice = isVip
      ? (config?.price_vip_kid || config?.price_kid || 0)
      : (config?.price_kid || 0);
    return { adultPrice, kidPrice };
  }

  // Determine weekday vs weekend
  const dayOfWeek = new Date(date).getDay(); // 0=Sun, 6=Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const prefix = isVip ? "price_vip_" : "price_";
  const segment = `${isWeekend ? "weekend" : "weekday"}_${slot}`;

  let adultPrice = Number(config[`${prefix}${segment}_adult`]) || 0;
  let kidPrice = Number(config[`${prefix}${segment}_kid`]) || 0;

  // Fallback to simple prices if differentiated = 0
  if (adultPrice === 0) {
    adultPrice = isVip
      ? (Number(config.price_vip_adult) || Number(config.price_adult) || 0)
      : (Number(config.price_adult) || 0);
  }
  if (kidPrice === 0) {
    kidPrice = isVip
      ? (Number(config.price_vip_kid) || Number(config.price_kid) || 0)
      : (Number(config.price_kid) || 0);
  }

  // Group discount (fixed price per person)
  const minPersons = Number(config.group_discount_min_persons) || 0;
  if (minPersons > 0 && totalPersons >= minPersons) {
    const groupAdult = Number(config.group_discount_price_adult) || 0;
    const groupKid = Number(config.group_discount_price_kid) || 0;
    if (groupAdult > 0) adultPrice = groupAdult;
    if (groupKid > 0) kidPrice = groupKid;
  }

  return { adultPrice, kidPrice };
}
