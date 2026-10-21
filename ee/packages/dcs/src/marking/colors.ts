const namedColors: Record<string, string> = {
	aqua: '#00FFFF',
	black: '#000000',
	blue: '#0000FF',
	brown: '#A52A2A',
	cyan: '#00FFFF',
	fuchsia: '#FF00FF',
	gold: '#FFD700',
	gray: '#808080',
	green: '#008000',
	grey: '#808080',
	lime: '#00FF00',
	magenta: '#FF00FF',
	maroon: '#800000',
	navy: '#000080',
	olive: '#808000',
	orange: '#FFA500',
	pink: '#FFC0CB',
	purple: '#800080',
	red: '#FF0000',
	silver: '#C0C0C0',
	teal: '#008080',
	white: '#FFFFFF',
	yellow: '#FFFF00',
};

const toHex = (color: string): string | undefined => {
	const normalized = color.trim().toLowerCase();
	if (/^#[0-9a-f]{6}$/.test(normalized)) return normalized;
	if (/^#[0-9a-f]{3}$/.test(normalized)) return `#${[...normalized.slice(1)].map((digit) => digit + digit).join('')}`;
	return namedColors[normalized];
};

const luminanceOf = (hex: string): number => {
	const [r, g, b] = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
	const linearize = (channel: number): number => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
	return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
};

/**
 * Picks black or white text, whichever reads better on a SPIF classification color.
 */
export const readableTextColor = (background: string): 'black' | 'white' => {
	const hex = toHex(background);
	if (!hex) {
		return 'black';
	}
	const luminance = luminanceOf(hex);
	const contrastWithBlack = (luminance + 0.05) / 0.05;
	const contrastWithWhite = 1.05 / (luminance + 0.05);
	return contrastWithBlack >= contrastWithWhite ? 'black' : 'white';
};
