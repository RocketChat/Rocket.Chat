/**
 * Picks a readable text color for a solid background fill.
 *
 * Computes each candidate's WCAG contrast ratio against the background (sRGB channels are
 * gamma-decoded to linear light, then weighted by how strongly the eye perceives each: 21% red,
 * 72% green, 7% blue) and keeps the higher-contrast one — so admins can pick any banner color
 * and the label stays legible.
 */
export const readableTextColor = (hex: string): '#1F2329' | '#FFFFFF' => {
	const luminanceOf = (color: string): number => {
		const [r, g, b] = [0, 2, 4].map((offset) => parseInt(color.replace('#', '').slice(offset, offset + 2), 16) / 255);
		const linearize = (channel: number): number => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
		return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
	};

	const background = luminanceOf(hex);
	const contrastWith = (ink: string): number => {
		const text = luminanceOf(ink);
		return (Math.max(background, text) + 0.05) / (Math.min(background, text) + 0.05);
	};

	return contrastWith('#1F2329') >= contrastWith('#FFFFFF') ? '#1F2329' : '#FFFFFF';
};
