import { it } from 'node:test';

import { expect } from 'expect';

import { normalizeUrl } from './normalizeUrl';

(
	[
		['https://rocket.chat', 'https://rocket.chat'],
		['//rocket.chat', 'https://rocket.chat'],
		['rocket.chat', 'https://rocket.chat'],
		['rocketchat@rocket.chat', 'mailto:rocketchat@rocket.chat'],
		['plain_text', undefined],
	] as const
).forEach(([input, output]) => {
	it(`should normalize ${JSON.stringify(input)} as ${JSON.stringify(output)}`, () => {
		expect(normalizeUrl(input)).toBe(output);
	});
});
