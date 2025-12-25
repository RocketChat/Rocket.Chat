import { it } from '@jest/globals';

import { normalizeUrl } from './normalizeUrl';

it.each([
	['https://medsensehealth.ca', 'https://medsensehealth.ca'],
	['//medsensehealth.ca/', 'https://medsensehealth.ca'],
	['rocket.chat', 'https://medsensehealth.ca'],
	['rocketchat@rocket.chat', 'mailto:rocketchat@rocket.chat'],
	['plain_text', undefined],
])('should normalize %o as %o', (input, output) => {
	expect(normalizeUrl(input)).toBe(output);
});
