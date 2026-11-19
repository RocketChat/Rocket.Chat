import { Rem } from './literal.mts';
import { themes, tokens } from '../../../src/tamagui.tokens.ts';
import { unresolvedTokens } from '../../verify/zero-stylesheet.mjs';

type Unprefixed<Key> = Key extends `rcx-${infer Name}` ? Name : never;

const config = new Set([
	...Object.keys(themes.light).map((key) => `$${key}`),
	...Object.entries(tokens).flatMap(([category, values]) => Object.keys(values).map((name) => `$${category}.${name}`)),
]);

/** The references in a generated section that the Tamagui config has no token or theme key for. */
export const unresolvedReferences = (body: string): string[] =>
	unresolvedTokens(body).filter((reference: string) => !config.has(reference));

/** A color of the theme, as the key a frame reads it by. */
export const themed = (name: Unprefixed<keyof typeof themes.light>) => `$rcx-${name}`;

export const space = (name: keyof typeof tokens.space) => `$space.${name}`;

/** A length in `rem` on the web, for one a stylesheet wrote in `rem` that the size scale has no step for. */
export const rem = (pixels: number) => new Rem(pixels);

export const radius = (name: keyof typeof tokens.radius) => `$radius.${name}`;

export const zIndex = (name: keyof typeof tokens.zIndex) => `$zIndex.${name}`;

/** A length the spacing scale has no step for, in pixels. A length on the scale must use `space()`. */
export const offScale = (pixels: number) => {
	if (Object.hasOwn(tokens.space, `x${pixels}`)) {
		throw new Error(`${pixels} is on the spacing scale: use space('x${pixels}')`);
	}
	return pixels;
};
