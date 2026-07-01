import { isInvalidJSONValue } from './isInvalidJSONValue';

describe('isInvalidJSONValue', () => {
	it('treats valid JSON object as valid', () => {
		expect(isInvalidJSONValue('{"a":1}')).toBe(false);
	});

	it('treats empty string as valid', () => {
		expect(isInvalidJSONValue('')).toBe(false);
	});

	it('treats non-string values as valid', () => {
		expect(isInvalidJSONValue(undefined)).toBe(false);
		expect(isInvalidJSONValue(42)).toBe(false);
	});

	it('flags malformed JSON as invalid', () => {
		expect(isInvalidJSONValue('{ not json }')).toBe(true);
		expect(isInvalidJSONValue('{"a":')).toBe(true);
	});
});
