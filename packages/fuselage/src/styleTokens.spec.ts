import {
	backgroundColor,
	borderRadius,
	borderWidth,
	fontColor,
	fontFamily,
	fontScale,
	inset,
	resolveBackgroundColor,
	resolveBorderRadius,
	resolveBorderWidth,
	resolveFontColor,
	resolveFontScale,
	resolveStrokeColor,
	spacing,
	spacingScale,
	strokeColor,
} from './styleTokens';

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

describe('typed token helpers', () => {
	it('resolve the names of the token lists', () => {
		expect(borderRadius('medium')).toMatch(/rem$/);
		expect(borderWidth('default')).toMatch(/px$/);
		expect(fontScale('p2').fontSize).toMatch(/rem$/);
		expect(fontFamily('sans')).toContain('Inter');
		expect(strokeColor('light')).toBe(resolveStrokeColor('light'));
		expect(backgroundColor('tint')).toBe(resolveBackgroundColor('tint'));
		expect(fontColor('default')).toBe(resolveFontColor('default'));
	});

	it('reject names outside the token lists when typechecked', () => {
		const typecheck = () => {
			// @ts-expect-error not a border radius
			borderRadius('huge');
			// @ts-expect-error the stroke prefix is added by the helper
			strokeColor('stroke-light');
			// @ts-expect-error not a font scale
			fontScale('p9');
		};

		expect(typecheck).toBeDefined();
	});
});

describe('runtime token resolvers', () => {
	it('return undefined for values outside the token lists', () => {
		expect(resolveBorderRadius('huge')).toBeUndefined();
		expect(resolveBorderWidth(3)).toBeUndefined();
		expect(resolveFontScale('p9')).toBeUndefined();
	});
});
