export function trimN(value: number, decimals: number = 4): string {
  if (isNaN(value) || !isFinite(value)) return '0';
  return String(parseFloat(value.toFixed(decimals)));
}

export function genId(): string {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}
