import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { mediaObjectToString } from '@tamagui/web';

import { tamaguiConfig } from './tamagui.config';

type ParsedToken = { variable: string; val: string | number };

const stylesheet = readFileSync(join(__dirname, 'styles/tamagui-tokens.css'), 'utf8');
const declared = Object.fromEntries([...stylesheet.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value]));

const tokensOf = (category: string) => Object.values((tamaguiConfig.tokensParsed as Record<string, Record<string, ParsedToken>>)[category]);

describe('the tokens stylesheet, which declares the tokens where no zero build does', () => {
	it.each(['space', 'size', 'radius', 'zIndex'])('declares every %s token under the variable a frame reads', (category) => {
		const tokens = tokensOf(category);

		expect(tokens.length).toBeGreaterThan(0);
		for (const { variable } of tokens) {
			expect(declared).toHaveProperty([variable.slice('var('.length, -1)]);
		}
	});

	it.each(['space', 'zIndex'])('declares each %s token with the value of the config', (category) => {
		for (const { variable, val } of tokensOf(category)) {
			const expected = category === 'space' && val !== 0 ? `${val}px` : String(val);

			expect(declared[variable.slice('var('.length, -1)]).toBe(expected);
		}
	});

	it.each(['size', 'radius'])('gives a %s token in rem, so it follows the font size of the user', (category) => {
		for (const { variable, val } of tokensOf(category)) {
			const value = declared[variable.slice('var('.length, -1)];

			expect(value).toBe(String(val));
			expect(value).toMatch(/^(0|[\d.]+rem)$/);
		}
	});
});

describe('the conditions of a frame value', () => {
	it('are the queries the stylesheets they replace asked, with the narrow width in rem so it follows the font size of the user', () => {
		const queries = Object.fromEntries(Object.entries(tamaguiConfig.media).map(([name, query]) => [name, mediaObjectToString(query)]));

		expect(queries).toEqual({
			pointerCoarse: '(pointer: coarse)',
			hoverNone: '(hover: none)',
			reducedMotion: '(prefers-reduced-motion: reduce)',
			narrow: '(max-width: 20rem)',
		});
	});

	it('measure a narrow group in density-independent pixels on native, which has no rem', async () => {
		const target = process.env.TAMAGUI_TARGET;
		process.env.TAMAGUI_TARGET = 'native';

		try {
			await jest.isolateModulesAsync(async () => {
				const { media } = await import('./tamagui.media');

				expect(media.narrow).toEqual({ maxWidth: 320 });
			});
		} finally {
			if (target === undefined) {
				delete process.env.TAMAGUI_TARGET;
			} else {
				process.env.TAMAGUI_TARGET = target;
			}
		}
	});
});
