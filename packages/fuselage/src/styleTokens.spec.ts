import { inset, spacing, spacingScale } from './styleTokens';

describe('spacingScale', () => {
	it('lists the eight steps in pixels', () => {
		expect(spacingScale).toEqual({ x4: 4, x8: 8, x12: 12, x16: 16, x20: 20, x24: 24, x32: 32, x40: 40 });
	});
});

describe('spacing', () => {
	it.each(Object.entries(spacingScale))('resolves %s and its negative forms to pixels', (token, px) => {
		expect(spacing(token)).toBe(`${px}px`);
		expect(spacing(`neg-${token}`)).toBe(`${-px}px`);
		expect(spacing(`-${token}`)).toBe(`${-px}px`);
	});

	it.each([
		['x10', '10px'],
		['neg-x2', '-2px'],
		[8, '8px'],
		[-2, '-2px'],
		['none', '0px'],
		['auto', 'auto'],
		['0.5rem', '0.5rem'],
	])('resolves %p to %p', (value, expected) => {
		expect(spacing(value)).toBe(expected);
	});

	it('gives a number and its token the same value', () => {
		expect(spacing(8)).toBe(spacing('x8'));
	});

	it('ignores values that are not numbers or strings', () => {
		expect(spacing(undefined)).toBeUndefined();
	});
});

describe('inset', () => {
	it.each([
		['x8', '0.5rem'],
		['neg-x8', '-0.5rem'],
		[8, '8px'],
		['none', '0px'],
		['auto', 'auto'],
	])('keeps resolving %p to %p', (value, expected) => {
		expect(inset(value)).toBe(expected);
	});
});
