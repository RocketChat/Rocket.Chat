import { expect, test } from 'vitest';
import { parseUint8Array, stringifyUint8Array, toBase64, fromBase64 } from '../base64.ts';

const cases = [
	['', []],
	['AQID', [1, 2, 3]],
	['AAECAwQFBgcICQ==', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]],
	['AAECAwQFBgcICQoLDA0ODw==', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]],
	['AQIDBAUGBwgJCgsMDQ4P', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]],
] as const satisfies [string: string, bytes: readonly number[]][];

test.for(cases)('"%s" === [%s]', ([string, bytes]) => {
	const uint8array = new Uint8Array(bytes);
	expect(fromBase64(string)).toEqual(uint8array);
	expect(toBase64(uint8array)).toBe(string);
	expect(stringifyUint8Array(uint8array)).toBe(`{"$binary":"${string}"}`);
	expect(parseUint8Array(`{"$binary":"${string}"}`)).toEqual(uint8array);
});
