type cssToValueType = <T extends string | { toString: () => string }>(label: string, value: T) => string;
export const toCSSValue: cssToValueType = (label, value) => `var(${label}, ${value})`;

export const toCSSFontValue = ((label: string, value: string) => toCSSValue(`--rcx-font-family-${label}`, value)) as cssToValueType;
export const toCSSColorValue = ((label: string, value: string) => toCSSValue(`--rcx-color-${label}`, value)) as cssToValueType;
