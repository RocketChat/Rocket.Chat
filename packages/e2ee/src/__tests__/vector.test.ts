import { expect, test } from 'vitest';
import { joinVectorAndEncryptedData, splitVectorAndEncryptedData } from '../vector.ts';

test('joinVectorAndEncryptedData and splitVectorAndEncryptedData', () => {
	const [vector, encryptedData] = splitVectorAndEncryptedData(
		joinVectorAndEncryptedData(
			new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
			new Uint8Array([17, 18, 19, 20]).buffer,
		),
	);
	expect(vector).toMatchInlineSnapshot(`
		Uint8Array [
		  1,
		  2,
		  3,
		  4,
		  5,
		  6,
		  7,
		  8,
		  9,
		  10,
		  11,
		  12,
		  13,
		  14,
		  15,
		  16,
		]
	`);
	expect(encryptedData).toMatchInlineSnapshot(`
		Uint8Array [
		  17,
		  18,
		  19,
		  20,
		]
	`);
});
