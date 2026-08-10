import { escapeLocalpart, unescapeLocalpart } from './escaping';

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
});
