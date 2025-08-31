import { expect, test, describe } from 'vitest';
import { parseUint8Array, stringifyUint8Array, fromB64, toB64, fromB64Fallback, toB64Fallback } from '../base64.ts';

describe.for([
	{ fromB64, toB64 },
	{ fromB64: fromB64Fallback, toB64: toB64Fallback },
])('Base64 (%s)', ({ fromB64, toB64 }) => {
	test.for([
		['', []],
		['AQID', [1, 2, 3]],
		['x+/y', [199, 239, 242]],
		['ZXhhZg==', [101, 120, 97, 102]],
		['AAECAwQFBgcICQ==', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]],
		['AAECAwQFBgcICQoLDA0ODw==', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]],
		['AQIDBAUGBwgJCgsMDQ4P', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]],
		['SGVsbG8gV29ybGQ=', [72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100]],
	] as const)('"%s" === [%s]', ([string, bytes]) => {
		const uint8array = new Uint8Array(bytes);
		expect(fromB64(string)).toEqual(uint8array);
		expect(toB64(uint8array)).toBe(string);
		expect(stringifyUint8Array(uint8array)).toBe(`{"$binary":"${string}"}`);
		expect(parseUint8Array(`{"$binary":"${string}"}`)).toEqual(uint8array);
	});

	test('Invalid parseUint8Array', () => {
		expect(() => parseUint8Array('[]')).toThrow();
	});
});
