export const fmt = (value: number | undefined, suffix: string): string => (value != null ? `${value} ${suffix}` : '—');
export const fmtKbps = (value: number | undefined): string => (value != null ? `${Math.round(value / 10) * 10} kbps` : '—');
