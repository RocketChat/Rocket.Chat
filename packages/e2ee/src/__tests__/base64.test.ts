import { expect, test } from 'vitest';
import { parseUint8Array, stringifyUint8Array, toBase64, fromBase64 } from '../base64.ts';

const cases = [
	['', new Uint8Array([])],
	['AQID', new Uint8Array([1, 2, 3])],
] satisfies [string: string, uint8array: Uint8Array<ArrayBuffer>][];

test.for(cases)('fromBase64', ([string, uint8array]) => {
	expect(fromBase64(string)).toEqual(uint8array);
	expect(toBase64(uint8array)).toBe(string);
	expect(stringifyUint8Array(uint8array)).toBe(`{"$binary":"${string}"}`);
	expect(parseUint8Array(`{"$binary":"${string}"}`)).toEqual(uint8array);
});
