export type Platform = 'web' | 'native';

const ROOT_FONT_SIZE = 16;

/** A number of pixels as the `rem` length that equals it at the browser's default font size. */
export const toRem = (pixels: number) => (pixels === 0 ? 0 : `${pixels / ROOT_FONT_SIZE}rem`);

/** A length the web gets in `rem` and native gets as the number of pixels. */
export class Rem {
	constructor(readonly pixels: number) {}
}

export type Value = string | number | Rem | { [key: string]: Value };

const write = (value: Value, platform: Platform, lineHeight: boolean, indent: string): string => {
	if (value instanceof Rem) {
		return JSON.stringify(platform === 'web' ? toRem(value.pixels) : value.pixels);
	}

	if (typeof value !== 'object') {
		return JSON.stringify(lineHeight && typeof value === 'number' && value !== 0 && platform === 'web' ? `${value}px` : value);
	}

	return `{\n${Object.entries(value)
		.filter(([, entry]) => entry !== undefined)
		.map(
			([key, entry]) => `${indent}\t${JSON.stringify(key)}: ${write(entry, platform, lineHeight || key === 'lineHeight', `${indent}\t`)},`,
		)
		.join('\n')}\n${indent}}`;
};

/**
 * A value as TypeScript source, keys quoted, `undefined` entries left out. A number is written as it is, pixels on the web
 * and density-independent pixels on native; only a `Rem` is a length in `rem` on the web. A numeric `lineHeight` gets its
 * unit on the web, where Tamagui would write the number as a multiplier.
 */
export const literal = (value: Value, platform: Platform = 'web'): string => write(value, platform, false, '');
