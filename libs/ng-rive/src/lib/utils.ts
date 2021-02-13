export function toInt(value: number | string | undefined | null) {
  const v = typeof value === 'string' ? parseInt(value) : value;
  if (typeof v !== 'number') return;
  return v;
}

export function toFloat(value: number | string | undefined | null) {
  const v = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof v !== 'number') return;
  return v;
}

export function toBool(value: '' | boolean | null | undefined) {
  if (value === '' || value === true) return true;
  if (value === false) return false;
  return;
}