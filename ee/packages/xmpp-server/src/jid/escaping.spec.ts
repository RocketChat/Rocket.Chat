import { escapeLocalpart, unescapeLocalpart } from './escaping';
import { InvalidJidError } from '../errors';

describe('XEP-0106 localpart escaping', () => {
	it.each([
		['user name', 'user\\20name'],
		['user@corp', 'user\\40corp'],
		["d'artagnan", 'd\\27artagnan'],
		['a/b', 'a\\2fb'],
		['plain', 'plain'],
	])('escapes %s to %s and round-trips', (input, escaped) => {
		expect(escapeLocalpart(input)).toBe(escaped);
		expect(unescapeLocalpart(escaped)).toBe(input);
	});

	it('refuses a localpart that escapes to more than 1023 bytes (addressing R2)', () => {
		expect(escapeLocalpart('a'.repeat(1023))).toHaveLength(1023);
		expect(() => escapeLocalpart('a'.repeat(1024))).toThrow(InvalidJidError);
		expect(() => escapeLocalpart(' '.repeat(342))).toThrow(InvalidJidError);
	});
});
