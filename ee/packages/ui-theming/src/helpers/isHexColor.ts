export const isHexColor = (hex: string): boolean => typeof hex === 'string' && hex.length === 6 && !isNaN(Number(`0x${hex}`));
