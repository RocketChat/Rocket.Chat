import { compile, middleware, serialize, stringify } from 'stylis';

import { createLogicalPropertiesMiddleware } from './middleware';

/** Compiles `${property}: inherit` for `.a`, with only `supportedProperties` understood by the browser. */
const renderProperty = (property: string, ...supportedProperties: string[]): string =>
	serialize(
		compile(`.a{${property}: inherit;}`),
		middleware([
			createLogicalPropertiesMiddleware({
				isPropertySupported: (candidate) => supportedProperties.includes(candidate),
				isPropertyValueSupported: () => false,
			}),
			stringify,
		]),
	);

/** Compiles `${property}: ${value}` for `.a`, with the value either understood by the browser or not. */
const renderValue = (property: string, value: string, isValueSupported: boolean): string =>
	serialize(
		compile(`.a{${property}: ${value};}`),
		middleware([
			createLogicalPropertiesMiddleware({
				isPropertySupported: () => false,
				isPropertyValueSupported: () => isValueSupported,
			}),
			stringify,
		]),
	);

/** Renders `properties` as a run of `inherit` declarations. */
const declarations = (...properties: string[]): string => properties.map((property) => `${property}:inherit;`).join('');

describe.each([
	{ property: 'border-start-start-radius', ltr: 'border-top-left-radius', rtl: 'border-top-right-radius' },
	{ property: 'border-start-end-radius', ltr: 'border-top-right-radius', rtl: 'border-top-left-radius' },
	{ property: 'border-end-start-radius', ltr: 'border-bottom-left-radius', rtl: 'border-bottom-right-radius' },
	{ property: 'border-end-end-radius', ltr: 'border-bottom-right-radius', rtl: 'border-bottom-left-radius' },
	{ property: 'inset-inline-start', ltr: 'left', rtl: 'right' },
	{ property: 'inset-inline-end', ltr: 'right', rtl: 'left' },
	{ property: 'border-inline-start', ltr: 'border-left', rtl: 'border-right' },
	{ property: 'border-inline-end', ltr: 'border-right', rtl: 'border-left' },
	{ property: 'border-inline-start-width', ltr: 'border-left-width', rtl: 'border-right-width' },
	{ property: 'border-inline-end-width', ltr: 'border-right-width', rtl: 'border-left-width' },
	{ property: 'border-inline-start-style', ltr: 'border-left-style', rtl: 'border-right-style' },
	{ property: 'border-inline-end-style', ltr: 'border-right-style', rtl: 'border-left-style' },
	{ property: 'border-inline-start-color', ltr: 'border-left-color', rtl: 'border-right-color' },
	{ property: 'border-inline-end-color', ltr: 'border-right-color', rtl: 'border-left-color' },
	{ property: 'margin-inline-start', ltr: 'margin-left', rtl: 'margin-right' },
	{ property: 'margin-inline-end', ltr: 'margin-right', rtl: 'margin-left' },
	{ property: 'padding-inline-start', ltr: 'padding-left', rtl: 'padding-right' },
	{ property: 'padding-inline-end', ltr: 'padding-right', rtl: 'padding-left' },
])('$property', ({ property, ltr, rtl }) => {
	it('is left alone when supported', () => {
		expect(renderProperty(property, property)).toBe(`.a{${declarations(property)}}`);
	});

	it(`falls back to ${ltr} in ltr and ${rtl} in rtl`, () => {
		expect(renderProperty(property, ltr, rtl)).toBe(`html:not([dir=rtl]) .a{${declarations(ltr)}}[dir=rtl] .a{${declarations(rtl)}}`);
	});
});

describe.each([
	{ property: 'border-inline', logical: ['border-inline-start', 'border-inline-end'], physical: ['border-left', 'border-right'] },
	{
		property: 'border-inline-width',
		logical: ['border-inline-start-width', 'border-inline-end-width'],
		physical: ['border-left-width', 'border-right-width'],
	},
	{
		property: 'border-inline-style',
		logical: ['border-inline-start-style', 'border-inline-end-style'],
		physical: ['border-left-style', 'border-right-style'],
	},
	{
		property: 'border-inline-color',
		logical: ['border-inline-start-color', 'border-inline-end-color'],
		physical: ['border-left-color', 'border-right-color'],
	},
	{ property: 'inset-inline', logical: ['inset-inline-start', 'inset-inline-end'], physical: ['left', 'right'] },
	{ property: 'margin-inline', logical: ['margin-inline-start', 'margin-inline-end'], physical: ['margin-left', 'margin-right'] },
	{ property: 'padding-inline', logical: ['padding-inline-start', 'padding-inline-end'], physical: ['padding-left', 'padding-right'] },
])('$property', ({ property, logical, physical }) => {
	const [start, end] = physical;

	it('is left alone when supported', () => {
		expect(renderProperty(property, property)).toBe(`.a{${declarations(property)}}`);
	});

	it(`falls back to ${logical.join(' and ')}`, () => {
		expect(renderProperty(property, ...logical)).toBe(`.a{${declarations(...logical)}}`);
	});

	it(`falls back to ${start} and ${end}, swapped in rtl`, () => {
		expect(renderProperty(property, ...physical)).toBe(
			`html:not([dir=rtl]) .a{${declarations(start, end)}}[dir=rtl] .a{${declarations(end, start)}}`,
		);
	});
});

describe.each([
	{ property: 'border-block-start', physical: 'border-top' },
	{ property: 'border-block-end', physical: 'border-bottom' },
	{ property: 'border-block-start-width', physical: 'border-top-width' },
	{ property: 'border-block-end-width', physical: 'border-bottom-width' },
	{ property: 'border-block-start-style', physical: 'border-top-style' },
	{ property: 'border-block-end-style', physical: 'border-bottom-style' },
	{ property: 'border-block-start-color', physical: 'border-top-color' },
	{ property: 'border-block-end-color', physical: 'border-bottom-color' },
	{ property: 'inset-block-start', physical: 'top' },
	{ property: 'inset-block-end', physical: 'bottom' },
	{ property: 'margin-block-start', physical: 'margin-top' },
	{ property: 'margin-block-end', physical: 'margin-bottom' },
	{ property: 'padding-block-start', physical: 'padding-top' },
	{ property: 'padding-block-end', physical: 'padding-bottom' },
	{ property: 'inline-size', physical: 'width' },
	{ property: 'min-inline-size', physical: 'min-width' },
	{ property: 'max-inline-size', physical: 'max-width' },
	{ property: 'block-size', physical: 'height' },
	{ property: 'min-block-size', physical: 'min-height' },
	{ property: 'max-block-size', physical: 'max-height' },
])('$property', ({ property, physical }) => {
	it('is left alone when supported', () => {
		expect(renderProperty(property, property)).toBe(`.a{${declarations(property)}}`);
	});

	it(`falls back to ${physical}`, () => {
		expect(renderProperty(property, physical)).toBe(`.a{${declarations(physical)}}`);
	});
});

describe.each([
	{ property: 'border-block', logical: ['border-block-start', 'border-block-end'], physical: ['border-top', 'border-bottom'] },
	{
		property: 'border-block-width',
		logical: ['border-block-start-width', 'border-block-end-width'],
		physical: ['border-top-width', 'border-bottom-width'],
	},
	{
		property: 'border-block-style',
		logical: ['border-block-start-style', 'border-block-end-style'],
		physical: ['border-top-style', 'border-bottom-style'],
	},
	{
		property: 'border-block-color',
		logical: ['border-block-start-color', 'border-block-end-color'],
		physical: ['border-top-color', 'border-bottom-color'],
	},
	{ property: 'inset-block', logical: ['inset-block-start', 'inset-block-end'], physical: ['top', 'bottom'] },
	{ property: 'margin-block', logical: ['margin-block-start', 'margin-block-end'], physical: ['margin-top', 'margin-bottom'] },
	{ property: 'padding-block', logical: ['padding-block-start', 'padding-block-end'], physical: ['padding-top', 'padding-bottom'] },
])('$property', ({ property, logical, physical }) => {
	it('is left alone when supported', () => {
		expect(renderProperty(property, property)).toBe(`.a{${declarations(property)}}`);
	});

	it(`falls back to ${logical.join(' and ')}`, () => {
		expect(renderProperty(property, ...logical)).toBe(`.a{${declarations(...logical)}}`);
	});

	it(`falls back to ${physical.join(' and ')}`, () => {
		expect(renderProperty(property, ...physical)).toBe(`.a{${declarations(...physical)}}`);
	});
});

describe('inset', () => {
	it('is left alone when supported', () => {
		expect(renderProperty('inset', 'inset')).toBe(`.a{${declarations('inset')}}`);
	});

	it('falls back to top, right, bottom and left', () => {
		expect(renderProperty('inset', 'top', 'right', 'bottom', 'left')).toBe(`.a{${declarations('top', 'right', 'bottom', 'left')}}`);
	});
});

describe.each(['float', 'clear', 'text-align'])('%s', (property) => {
	it.each(['start', 'inline-start', 'end', 'inline-end'])('keeps the %s value when supported', (value) => {
		expect(renderValue(property, value, true)).toBe(`.a{${property}:${value};}`);
	});

	it.each([
		['start', 'left', 'right'],
		['inline-start', 'left', 'right'],
		['end', 'right', 'left'],
		['inline-end', 'right', 'left'],
	])('falls back from the %s value to %s in ltr and %s in rtl', (value, ltrValue, rtlValue) => {
		expect(renderValue(property, value, false)).toBe(`[dir=rtl] .a{${property}:${rtlValue};}.a{${property}:${ltrValue};}`);
	});
});
