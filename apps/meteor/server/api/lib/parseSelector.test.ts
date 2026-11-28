import { describe, it } from 'node:test';

import { expect } from 'chai';

import { parseSelector } from './parseSelector';

describe('parseSelector', () => {
	it('should return the selector object', () => {
		expect(parseSelector('{"term":"jo","exceptions":["bob"]}')).to.deep.equal({ term: 'jo', exceptions: ['bob'] });
		expect(parseSelector('{}')).to.deep.equal({});
	});

	const rejected: Record<string, string> = {
		'text that is not JSON': '{name: "test"',
		'an empty text': '',
		'null': 'null',
		'a list': '[]',
		'a text value': '"general"',
		'a number': '42',
	};

	Object.entries(rejected).forEach(([name, selector]) => {
		it(`should refuse ${name} with a client error`, () => {
			expect(() => parseSelector(selector))
				.to.throw('The selector must be a JSON object')
				.with.property('error', 'error-invalid-params');
		});
	});
});
