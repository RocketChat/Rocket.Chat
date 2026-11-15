import { transpile, createTranspileMiddleware } from './transpile';

describe('transpile', () => {
	it('wraps the declarations in the given selector', () => {
		expect(transpile('div', 'color: inherit;')).toBe('div{color:inherit;}');
	});

	it('applies vendor prefixing', () => {
		expect(transpile('div', 'display: flex;')).toBe('div{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;}');
	});

	it('falls logical properties back by default', () => {
		expect(transpile('div', 'inset-inline-start: 0;')).toBe('html:not([dir=rtl]) div{left:0;}[dir=rtl] div{right:0;}');
	});
});

describe('createTranspileMiddleware', () => {
	it('hands isPropertySupported to the logical properties middleware', () => {
		expect(transpile('div', 'inset-inline-start: 0;', createTranspileMiddleware({ isPropertySupported: () => true }))).toBe(
			'div{inset-inline-start:0;}',
		);
	});

	it('hands isPropertyValueSupported to the logical properties middleware', () => {
		expect(transpile('div', 'float: inline-start;', createTranspileMiddleware({ isPropertyValueSupported: () => true }))).toBe(
			'div{float:inline-start;}',
		);
	});
});

describe('prefixing of logical properties', () => {
	it.each([
		{ property: 'margin-inline-start', prefixed: '-webkit-margin-start' },
		{ property: 'margin-inline-end', prefixed: '-webkit-margin-end' },
		{ property: 'padding-inline-start', prefixed: '-webkit-padding-start' },
		{ property: 'padding-inline-end', prefixed: '-webkit-padding-end' },
	])('prefixes $property that the middleware left in place', ({ property, prefixed }) => {
		expect(transpile('div', `${property}: inherit;`, createTranspileMiddleware({ isPropertySupported: () => true }))).toBe(
			`div{${prefixed}:inherit;${property}:inherit;}`,
		);
	});

	it.each([
		{
			property: 'margin-inline',
			longhands: ['-webkit-margin-start', 'margin-inline-start', '-webkit-margin-end', 'margin-inline-end'],
		},
		{
			property: 'padding-inline',
			longhands: ['-webkit-padding-start', 'padding-inline-start', '-webkit-padding-end', 'padding-inline-end'],
		},
	])('prefixes the longhands $property fell back to', ({ property, longhands }) => {
		expect(
			transpile('div', `${property}: inherit;`, createTranspileMiddleware({ isPropertySupported: (candidate) => candidate !== property })),
		).toBe(`div{${longhands.map((longhand) => `${longhand}:inherit;`).join('')}}`);
	});
});
