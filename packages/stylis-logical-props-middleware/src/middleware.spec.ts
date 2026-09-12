import { compile, middleware, serialize, stringify } from 'stylis';

import { createLogicalPropertiesMiddleware } from './middleware';

/** Compiles `css` as if no logical property or value were supported. */
const render = (css: string): string => {
	const logicalProperties = createLogicalPropertiesMiddleware({
		isPropertySupported: () => false,
		isPropertyValueSupported: () => false,
	});

	return serialize(compile(css), middleware([logicalProperties, stringify]));
};

describe('axis shorthands', () => {
	it('splits a two-value inline shorthand across the sides', () => {
		expect(render('.a{margin-inline:4px 8px;}')).toBe(
			'html:not([dir=rtl]) .a{margin-left:4px;margin-right:8px;}[dir=rtl] .a{margin-right:4px;margin-left:8px;}',
		);
	});

	it('applies a single value to both sides', () => {
		expect(render('.a{margin-inline:4px;}')).toBe(
			'html:not([dir=rtl]) .a{margin-left:4px;margin-right:4px;}[dir=rtl] .a{margin-right:4px;margin-left:4px;}',
		);
	});

	it('splits a two-value block shorthand, which needs no direction handling', () => {
		expect(render('.a{margin-block:4px 8px;}')).toBe('.a{margin-top:4px;margin-bottom:8px;}');
	});

	it('splits border shorthands that take one value per side', () => {
		expect(render('.a{border-inline-style:solid dashed;}')).toBe(
			'html:not([dir=rtl]) .a{border-left-style:solid;border-right-style:dashed;}[dir=rtl] .a{border-right-style:solid;border-left-style:dashed;}',
		);
	});

	it('keeps whitespace inside functions out of the split', () => {
		expect(render('.a{margin-inline:calc(1px + 2px) 8px;}')).toBe(
			'html:not([dir=rtl]) .a{margin-left:calc(1px + 2px);margin-right:8px;}[dir=rtl] .a{margin-right:calc(1px + 2px);margin-left:8px;}',
		);
	});

	it('treats a comma-separated function as a single component', () => {
		expect(render('.a{inset-block:min(1px, 2px) max(3px, 4px);}')).toBe('.a{top:min(1px, 2px);bottom:max(3px, 4px);}');
	});

	it('leaves a value with nothing left to split untouched', () => {
		expect(render('.a{margin-inline:!important;}')).toBe('.a{margin-inline:!important;}');
	});

	it('reattaches !important to every expansion', () => {
		expect(render('.a{margin-inline:4px 8px !important;}')).toBe(
			'html:not([dir=rtl]) .a{margin-left:4px!important;margin-right:8px!important;}[dir=rtl] .a{margin-right:4px!important;margin-left:8px!important;}',
		);
	});
});

describe('border-inline and border-block', () => {
	it('applies the whole value to both sides, since they take one border value', () => {
		expect(render('.a{border-inline:1px solid red;}')).toBe(
			'html:not([dir=rtl]) .a{border-left:1px solid red;border-right:1px solid red;}[dir=rtl] .a{border-right:1px solid red;border-left:1px solid red;}',
		);
	});
});

describe('inset', () => {
	it.each([
		['.a{inset:1px;}', '.a{top:1px;right:1px;bottom:1px;left:1px;}'],
		['.a{inset:1px 2px;}', '.a{top:1px;right:2px;bottom:1px;left:2px;}'],
		['.a{inset:1px 2px 3px;}', '.a{top:1px;right:2px;bottom:3px;left:2px;}'],
		['.a{inset:1px 2px 3px 4px;}', '.a{top:1px;right:2px;bottom:3px;left:4px;}'],
	])('expands %s in physical box order', (css, expected) => {
		expect(render(css)).toBe(expected);
	});
});

describe('logical values', () => {
	it('flips float per direction', () => {
		expect(render('.a{float:inline-start;}')).toBe('[dir=rtl] .a{float:right;}.a{float:left;}');
	});
});

describe('supported properties', () => {
	it('leaves logical properties alone when the browser understands them', () => {
		const logicalProperties = createLogicalPropertiesMiddleware({
			isPropertySupported: () => true,
			isPropertyValueSupported: () => true,
		});

		expect(serialize(compile('.a{margin-inline:4px 8px;}'), middleware([logicalProperties, stringify]))).toBe('.a{margin-inline:4px 8px;}');
	});
});
