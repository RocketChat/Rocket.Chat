import { spacing, spacingScale } from './styleTokens';

describe('spacingScale', () => {
	it('lists the eight steps in pixels', () => {
		expect(spacingScale).toEqual({ x4: 4, x8: 8, x12: 12, x16: 16, x20: 20, x24: 24, x32: 32, x40: 40 });
	});
});

describe('spacing', () => {
	it.each(Object.entries(spacingScale))('resolves %s and its negative forms', (token, px) => {
		expect(spacing(token)).toBe(`${px / 16}rem`);
		expect(spacing(`neg-${token}`)).toBe(`${-px / 16}rem`);
		expect(spacing(`-${token}`)).toBe(`${-px / 16}rem`);
	});

	it.each([
		['x10', '0.625rem'],
		['neg-x2', '-0.125rem'],
		[10, '10px'],
		[-2, '-2px'],
		['none', '0px'],
		['auto', 'auto'],
		['0.5rem', '0.5rem'],
	])('keeps resolving %p to %p', (value, expected) => {
		expect(spacing(value)).toBe(expected);
	});

	it('ignores values that are not numbers or strings', () => {
		expect(spacing(undefined)).toBeUndefined();
	});
});
