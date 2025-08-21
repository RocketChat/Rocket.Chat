import { expect, test } from 'vitest';
import { toArrayBuffer, toString } from '../binary.ts';

test('toArrayBuffer', () => {
	expect(toArrayBuffer('')).toMatchInlineSnapshot(`Uint8Array []`);
	expect(toArrayBuffer('hello')).toMatchInlineSnapshot(`
		Uint8Array [
		  104,
		  101,
		  108,
		  108,
		  111,
		]
	`);
});

test('toString', () => {
	expect(toString(new Uint8Array([]).buffer)).toMatchInlineSnapshot(`""`);
	expect(toString(new Uint8Array([104, 101, 108, 108, 111]).buffer)).toMatchInlineSnapshot(`
		"hello"
	`);
});
