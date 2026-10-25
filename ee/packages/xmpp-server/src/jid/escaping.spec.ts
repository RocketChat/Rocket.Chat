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
		// Counted in bytes, not characters
		expect(Buffer.byteLength(escapeLocalpart('é'.repeat(511)))).toBe(1022);
		expect(() => escapeLocalpart('é'.repeat(512))).toThrow(InvalidJidError);
		// Counted after escaping: 340 spaces escape to 1020 bytes
		expect(Buffer.byteLength(escapeLocalpart(`a${' '.repeat(340)}b`))).toBe(1022);
		expect(() => escapeLocalpart(`a${' '.repeat(341)}b`)).toThrow(InvalidJidError);
	});
});
