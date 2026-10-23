import tokenColors from '@rocket.chat/fuselage-tokens/dist/colors.json';
import invariant from 'invariant';

const isPaletteColorRef = (ref: unknown): ref is keyof typeof tokenColors => typeof ref === 'string' && ref in tokenColors;

const mapTypeToPrefix = {
	neutral: 'n',
	blue: 'b',
	green: 'g',
	yellow: 'y',
	red: 'r',
	orange: 'o',
	purple: 'p',
} as const;

export const getPaletteColor = (
	type: keyof typeof mapTypeToPrefix,
	grade: 100 | 200 | 250 | 300 | 400 | 450 | 500 | 600 | 700 | 800 | 900 | 1000,
	alpha?: number,
): [customPropertyName: string, value: string] => {
	const ref = `${mapTypeToPrefix[type]}${grade}`;
	invariant(isPaletteColorRef(ref), 'invalid color reference');

	const baseColor = tokenColors[ref];

	const matches = /^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/.exec(baseColor);

	invariant(!!matches, 'invalid color token format');

	if (alpha !== undefined) {
		const [, r, g, b] = matches;
		return [
			`--rcx-color-${type}-${grade}-${(alpha * 100).toFixed(0)}`,
			`rgba(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}, ${alpha * 100}%)`,
		];
	}

	return [`--rcx-color-${type}-${grade}`, baseColor];
};
