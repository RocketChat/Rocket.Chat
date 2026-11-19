import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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
