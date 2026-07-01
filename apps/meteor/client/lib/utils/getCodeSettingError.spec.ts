import { getCodeSettingError } from './getCodeSettingError';

describe('getCodeSettingError', () => {
	it('returns the JSON error key for malformed application/json', () => {
		expect(getCodeSettingError('application/json', '{ invalid')).toBe('Invalid_JSON');
	});

	it('returns undefined for valid application/json', () => {
		expect(getCodeSettingError('application/json', '{}')).toBe(undefined);
	});

	it('treats an empty string as valid', () => {
		expect(getCodeSettingError('application/json', '')).toBe(undefined);
	});

	it('returns undefined for a mime type without a validator', () => {
		expect(getCodeSettingError('text/html', '<not json>')).toBe(undefined);
	});

	it('returns undefined when code or value is not a validatable string', () => {
		expect(getCodeSettingError(undefined, '{ invalid')).toBe(undefined);
		expect(getCodeSettingError('application/json', undefined)).toBe(undefined);
	});
});
