import { Base64 } from './base64';

describe('empty input', () => {
	it('should encode empty string', () => {
		expect(Base64.encode(new Uint8Array(0))).toStrictEqual('');
	});

	it('should decode empty string', () => {
		expect(Base64.decode('')).toStrictEqual(new Uint8Array(new ArrayBuffer(0)));
	});
});

describe('text examples', () => {
	it.each([
		['pleasure.', 'cGxlYXN1cmUu'],
		['leasure.', 'bGVhc3VyZS4='],
		['easure.', 'ZWFzdXJlLg=='],
		['asure.', 'YXN1cmUu'],
		['sure.', 'c3VyZS4='],
	])('encodes and decodes %p', (txt, res) => {
		const encoded = Base64.encode(Buffer.from(txt, 'ascii'));
		expect(encoded).toBe(res);

		const decoded = Buffer.from(Base64.decode(res)).toString('ascii');
		expect(decoded).toBe(txt);
	});
});

describe('non-text examples', () => {
	it.each([
		[[0, 0, 0], 'AAAA'],
		[[0, 0, 1], 'AAAB'],
	])('encodes and decodes %p', (array, b64) => {
		const encoded = Base64.encode(array);
		expect(encoded).toBe(b64);

		const decoded = Base64.decode(b64);
		const expectedAsBinary = Uint8Array.from({ length: array.length }, (_, i) => array[i]);
		expect(decoded).toStrictEqual(expectedAsBinary);
	});
});
