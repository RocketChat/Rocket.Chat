import { isJSON } from './isJSON';

describe('isJSON', () => {
	it('returns true for any successfully parsed JSON', () => {
		expect(isJSON('{"a":1}')).toBe(true);
		expect(isJSON('{}')).toBe(true);
		expect(isJSON('[1,2]')).toBe(true);
		expect(isJSON('"hello"')).toBe(true);
		expect(isJSON('true')).toBe(true);
		expect(isJSON('42')).toBe(true);
	});

	it('returns true for valid but falsy JSON values', () => {
		expect(isJSON('false')).toBe(true);
		expect(isJSON('null')).toBe(true);
		expect(isJSON('0')).toBe(true);
		expect(isJSON('""')).toBe(true);
	});

	it('returns false for malformed JSON', () => {
		expect(isJSON('{ not json }')).toBe(false);
		expect(isJSON('{"a":')).toBe(false);
		expect(isJSON('')).toBe(false);
	});
});
