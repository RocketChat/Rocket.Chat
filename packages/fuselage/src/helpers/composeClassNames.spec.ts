import { cx, cxx } from './composeClassNames';

describe('cx', () => {
	it('joins strings and flags, skipping falsy arguments', () => {
		expect(cx('a', false, 'b', null, undefined, '', { c: true, d: false, e: 'f', f: 1, g: 0 })).toBe('a b c e-f f-1 g-0');
	});

	it('is empty when nothing applies', () => {
		expect(cx(false, { a: false })).toBe('');
	});
});

describe('cxx', () => {
	it('prefixes the modifiers with the class name', () => {
		expect(cxx('z')('a', false, 'b', null, { c: true, d: false, e: 'f', f: 1 })).toBe('z z--a z--b z--c z--e-f z--f-1');
	});

	it('is the class name alone without modifiers', () => {
		expect(cxx('z')({ a: false })).toBe('z');
	});
});
