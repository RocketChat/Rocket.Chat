import { it } from '@jest/globals';

import { normalizeUrl } from './normalizeUrl';

it.each([
	['https://rocket', 'https://rocket'],
	['//rocket', 'https://rocket'],
	['rocket', 'https://rocket'],
	['rocketchat@rocket.chat', 'mailto:rocketchat@rocket.chat'],
	['plain_text', undefined],
])('should normalize %o as %o', (input, output) => {
	expect(normalizeUrl(input)).toBe(output);
});
