import { transpile, createTranspileMiddleware } from './transpile';

it('transpiles simple properties', () => {
	expect(transpile('div', 'color: inherit;')).toMatch('div{color:inherit;}');
});

it('transpiles with vendor prefixing', () => {
	expect(transpile('div', 'display: flex;')).toMatch('div{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;}');
});

const property = (property: string, ...characteristics: ((property: string) => void)[]): void =>
	describe(property, () => {
		for (const characteristic of characteristics) {
			characteristic(property);
		}
	});

const isSupported = (vendorPrefixedProperty?: string) => (property: string) =>
	it(`supports ${property}`, () => {
		expect(
			transpile(
				'div',
				`${property}: inherit;`,
				createTranspileMiddleware({
					isPropertySupported: (p: string) => p === property,
				}),
			),
		).toMatch(vendorPrefixedProperty ? `div{${vendorPrefixedProperty}:inherit;${property}:inherit;}` : `div{${property}:inherit;}`);
	});

const fallbacksTo =
	(...properties: string[]) =>
	(property: string) =>
		it(`fallbacks ${property} to ${properties.join(', ')}`, () => {
			expect(
				transpile(
					`div`,
					`${property}: inherit;`,
					createTranspileMiddleware({
						isPropertySupported: (p) => properties.includes(p),
					}),
				),
			).toMatch(`div{${properties.map((property) => `${property}:inherit;`).join('')}}`);
		});

const fallbacksWithDirectionTo = (ltrProperty: string, rtlProperty: string) => (property: string) =>
	it(`fallbacks ${property} to ${ltrProperty}, ${rtlProperty}`, () => {
		expect(
			transpile(
				`div`,
				`${property}: inherit;`,
				createTranspileMiddleware({
					isPropertySupported: (p) => [ltrProperty, rtlProperty].includes(p),
				}),
			),
		).toMatch(`html:not([dir=rtl]) div{${ltrProperty}:inherit;}[dir=rtl] div{${rtlProperty}:inherit;}`);
	});

const supportsLogicalValues = () => (property: string) =>
	it.each([['start'], ['inline-start'], ['end'], ['inline-end']])('supports %s value', (logicalValue: string) => {
		expect(
			transpile(
				'div',
				`${property}: ${logicalValue};`,
				createTranspileMiddleware({
					isPropertyValueSupported: (p, v) => p === property && v === logicalValue,
				}),
			),
		).toMatch(`div{${property}:${logicalValue};}`);
	});

const fallbacksLogicalValues = () => (property: string) =>
	it.each([
		['start', 'left', 'right'],
		['inline-start', 'left', 'right'],
		['end', 'right', 'left'],
		['inline-end', 'right', 'left'],
	])('fallbacks %s value to %s and %s', (logicalValue: string, ltrValue: string, rtlValue: string) => {
		expect(transpile('div', `${property}: ${logicalValue};`)).toMatch(
			`[dir=rtl] div{${property}:${rtlValue};}div{${property}:${ltrValue};}`,
		);
	});

property('border-start-start-radius', isSupported(), fallbacksWithDirectionTo('border-top-left-radius', 'border-top-right-radius'));
property('border-start-end-radius', isSupported(), fallbacksWithDirectionTo('border-top-right-radius', 'border-top-left-radius'));
property('border-end-start-radius', isSupported(), fallbacksWithDirectionTo('border-bottom-left-radius', 'border-bottom-right-radius'));
property('border-end-end-radius', isSupported(), fallbacksWithDirectionTo('border-bottom-right-radius', 'border-bottom-left-radius'));
property('inset-inline-start', isSupported(), fallbacksWithDirectionTo('left', 'right'));
property('inset-inline-end', isSupported(), fallbacksWithDirectionTo('right', 'left'));
property('border-inline-start', isSupported(), fallbacksWithDirectionTo('border-left', 'border-right'));
property('border-inline-end', isSupported(), fallbacksWithDirectionTo('border-right', 'border-left'));
property('border-inline-start-width', isSupported(), fallbacksWithDirectionTo('border-left-width', 'border-right-width'));
property('border-inline-end-width', isSupported(), fallbacksWithDirectionTo('border-right-width', 'border-left-width'));
property('border-inline-start-style', isSupported(), fallbacksWithDirectionTo('border-left-style', 'border-right-style'));
property('border-inline-end-style', isSupported(), fallbacksWithDirectionTo('border-right-style', 'border-left-style'));
property('border-inline-start-color', isSupported(), fallbacksWithDirectionTo('border-left-color', 'border-right-color'));
property('border-inline-end-color', isSupported(), fallbacksWithDirectionTo('border-right-color', 'border-left-color'));
property('margin-inline-start', isSupported('-webkit-margin-start'), fallbacksWithDirectionTo('margin-left', 'margin-right'));
property('margin-inline-end', isSupported('-webkit-margin-end'), fallbacksWithDirectionTo('margin-right', 'margin-left'));
property('padding-inline-start', isSupported('-webkit-padding-start'), fallbacksWithDirectionTo('padding-left', 'padding-right'));
property('padding-inline-end', isSupported('-webkit-padding-end'), fallbacksWithDirectionTo('padding-right', 'padding-left'));
property(
	'border-inline',
	isSupported(),
	fallbacksTo('border-inline-start', 'border-inline-end'),
	fallbacksTo('border-left', 'border-right'),
);
property(
	'border-inline-width',
	isSupported(),
	fallbacksTo('border-inline-start-width', 'border-inline-end-width'),
	fallbacksTo('border-left-width', 'border-right-width'),
);
property(
	'border-inline-style',
	isSupported(),
	fallbacksTo('border-inline-start-style', 'border-inline-end-style'),
	fallbacksTo('border-left-style', 'border-right-style'),
);
property(
	'border-inline-color',
	isSupported(),
	fallbacksTo('border-inline-start-color', 'border-inline-end-color'),
	fallbacksTo('border-left-color', 'border-right-color'),
);
property('inset-inline', isSupported(), fallbacksTo('inset-inline-start', 'inset-inline-end'), fallbacksTo('left', 'right'));
property(
	'margin-inline',
	isSupported(),
	fallbacksTo('-webkit-margin-start', 'margin-inline-start', '-webkit-margin-end', 'margin-inline-end'),
	fallbacksTo('margin-left', 'margin-right'),
);
property(
	'padding-inline',
	isSupported(),
	fallbacksTo('-webkit-padding-start', 'padding-inline-start', '-webkit-padding-end', 'padding-inline-end'),
	fallbacksTo('padding-left', 'padding-right'),
);
property('border-block-start', isSupported(), fallbacksTo('border-top'));
property('border-block-end', isSupported(), fallbacksTo('border-bottom'));
property('border-block-start-width', isSupported(), fallbacksTo('border-top-width'));
property('border-block-end-width', isSupported(), fallbacksTo('border-bottom-width'));
property('border-block-start-style', isSupported(), fallbacksTo('border-top-style'));
property('border-block-end-style', isSupported(), fallbacksTo('border-bottom-style'));
property('border-block-start-color', isSupported(), fallbacksTo('border-top-color'));
property('border-block-end-color', isSupported(), fallbacksTo('border-bottom-color'));
property('inset-block-start', isSupported(), fallbacksTo('top'));
property('inset-block-end', isSupported(), fallbacksTo('bottom'));
property('margin-block-start', isSupported(), fallbacksTo('margin-top'));
property('margin-block-end', isSupported(), fallbacksTo('margin-bottom'));
property('padding-block-start', isSupported(), fallbacksTo('padding-top'));
property('padding-block-end', isSupported(), fallbacksTo('padding-bottom'));
property('border-block', isSupported(), fallbacksTo('border-block-start', 'border-block-end'), fallbacksTo('border-top', 'border-bottom'));
property(
	'border-block-width',
	isSupported(),
	fallbacksTo('border-block-start-width', 'border-block-end-width'),
	fallbacksTo('border-top-width', 'border-bottom-width'),
);
property(
	'border-block-style',
	isSupported(),
	fallbacksTo('border-block-start-style', 'border-block-end-style'),
	fallbacksTo('border-top-style', 'border-bottom-style'),
);
property(
	'border-block-color',
	isSupported(),
	fallbacksTo('border-block-start-color', 'border-block-end-color'),
	fallbacksTo('border-top-color', 'border-bottom-color'),
);
property('inset-block', isSupported(), fallbacksTo('inset-block-start', 'inset-block-end'), fallbacksTo('top', 'bottom'));
property('margin-block', isSupported(), fallbacksTo('margin-block-start', 'margin-block-end'), fallbacksTo('margin-top', 'margin-bottom'));
property(
	'padding-block',
	isSupported(),
	fallbacksTo('padding-block-start', 'padding-block-end'),
	fallbacksTo('padding-top', 'padding-bottom'),
);
property('inset', isSupported(), fallbacksTo('top', 'right', 'bottom', 'left'));
property('inline-size', isSupported(), fallbacksTo('width'));
property('min-inline-size', isSupported(), fallbacksTo('min-width'));
property('max-inline-size', isSupported(), fallbacksTo('max-width'));
property('block-size', isSupported(), fallbacksTo('height'));
property('min-block-size', isSupported(), fallbacksTo('min-height'));
property('max-block-size', isSupported(), fallbacksTo('max-height'));
property('float', supportsLogicalValues(), fallbacksLogicalValues());
property('clear', supportsLogicalValues(), fallbacksLogicalValues());
property('text-align', supportsLogicalValues(), fallbacksLogicalValues());
