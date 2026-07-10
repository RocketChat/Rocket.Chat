/**
 * Picks a readable text color for a solid background fill.
 *
 * Computes the background's WCAG relative luminance (sRGB channels are gamma-decoded to linear
 * light, then weighted by how strongly the eye perceives each: 21% red, 72% green, 7% blue).
 * Backgrounds brighter than the 0.55 threshold get dark ink, darker ones get white — so admins
 * can pick any banner color and the label stays legible.
 */
export const readableTextColor = (hex: string): '#1F2329' | '#FFFFFF' => {
	const [r, g, b] = [0, 2, 4].map((offset) => parseInt(hex.replace('#', '').slice(offset, offset + 2), 16) / 255);
	const linearize = (channel: number): number => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
	const luminance = 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
	return luminance > 0.55 ? '#1F2329' : '#FFFFFF';
};

/**
 * Darkens a hex color by multiplying each RGB channel by `factor` (0–1, lower = darker).
 *
 * Used by the `edge` banner style to draw its top/bottom rules: on dark backgrounds (white text)
 * a plain black overlay would be invisible, so the rules use a darkened shade of the background
 * color instead.
 */
export const shade = (hex: string, factor: number): string => {
	const [r, g, b] = [0, 2, 4].map((offset) => Math.round(parseInt(hex.replace('#', '').slice(offset, offset + 2), 16) * factor));
	return `rgb(${r}, ${g}, ${b})`;
};
