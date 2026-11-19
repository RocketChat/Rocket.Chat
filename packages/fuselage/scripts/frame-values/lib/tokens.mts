import { Rem } from './literal.mts';
import { media } from '../../../src/tamagui.media.ts';
import { fontScale as scale, themes, tokens } from '../../../src/tamagui.tokens.ts';
import { unknownConditions, unresolvedTokens } from '../../verify/zero-stylesheet.mjs';

type Unprefixed<Key> = Key extends `rcx-${infer Name}` ? Name : never;

const config = new Set([
	...Object.keys(themes.light).map((key) => `$${key}`),
	...Object.entries(tokens).flatMap(([category, values]) => Object.keys(values).map((name) => `$${category}.${name}`)),
]);

/** The references in a generated section that the Tamagui config has no token, theme key or condition for. */
export const unresolvedReferences = (body: string): string[] => [
	...unresolvedTokens(body).filter((reference: string) => !config.has(reference)),
	...unknownConditions(body, media),
];

/** A color of the theme, as the key a frame reads it by. */
export const themed = (name: Unprefixed<keyof typeof themes.light>) => `$rcx-${name}`;

export const space = (name: keyof typeof tokens.space) => `$space.${name}`;

/** A length in `rem` on the web, for one a stylesheet wrote in `rem` that the size scale has no step for. */
export const rem = (pixels: number) => new Rem(pixels);

/** A width or a height on the size scale, in `rem` on the web. One the scale has no step for is a number of pixels. */
export const size = (name: keyof typeof tokens.size) => `$size.${name}`;

/**
 * The font size, line height, weight and letter spacing of a step of the type scale, for a text frame to spread. The
 * lengths are `rem` on the web.
 */
export const fontScale = (name: keyof typeof scale) => {
	if (!Object.hasOwn(scale, name)) {
		throw new Error(`The type scale has no ${name}`);
	}
	const { fontSize, lineHeight, fontWeight, letterSpacing } = scale[name];
	return { fontSize: rem(fontSize), lineHeight: rem(lineHeight), fontWeight, letterSpacing: rem(letterSpacing) };
};

/** A share of the parent's length, which a number of pixels cannot state. */
export const percent = (value: number) => `${value}%`;

/** A grid track's share of the free space, for a web-only frame. */
export const fraction = (value: number) => `${value}fr`;

/** A width of `value` characters of the element's font, which follows the text and so no pixel count can state. */
export const ch = (value: number) => `${value}ch`;

export const radius = (name: keyof typeof tokens.radius) => `$radius.${name}`;

export const zIndex = (name: keyof typeof tokens.zIndex) => `$zIndex.${name}`;

/** A length the spacing scale has no step for, in pixels. A length on the scale must use `space()`. */
export const offScale = (pixels: number) => {
	if (Object.hasOwn(tokens.space, `x${pixels}`)) {
		throw new Error(`${pixels} is on the spacing scale: use space('x${pixels}')`);
	}
	return pixels;
};
