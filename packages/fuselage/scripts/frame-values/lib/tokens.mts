import { createRequire } from 'node:module';

import { spacingScale } from '../../../src/styleTokens.ts';

const require = createRequire(import.meta.url);

export const buttonTokens: { light: Record<string, string> } = require('@rocket.chat/fuselage-tokens/dist/button.json');
export const zIndex: Record<
	'raised' | 'overlap' | 'sticky' | 'overlay' | 'drag',
	number
> = require('@rocket.chat/fuselage-tokens/dist/zIndex.json');

/** A layer `offset` above a z-index token, for the layers that stack in a fixed order above it. */
export const zIndexAbove = (token: keyof typeof zIndex, offset: number) => zIndex[token] + offset;
export const colors: Record<string, string> = require('@rocket.chat/fuselage-tokens/dist/colors.json');

/** A spacing value off the scale, for the lengths it has no step for. A length on the scale must use `spacing()`. */
export const offScale = (pixels: number) => {
	if (Object.hasOwn(spacingScale, `x${Math.abs(pixels)}`)) {
		throw new Error(`${pixels}px is on the spacing scale: use spacing('${pixels < 0 ? '-' : ''}x${Math.abs(pixels)}')`);
	}
	return `${pixels}px`;
};

export const camelCase = (name: string) => name.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase());
