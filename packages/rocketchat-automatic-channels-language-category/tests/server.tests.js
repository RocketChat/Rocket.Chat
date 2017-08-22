/* eslint-env mocha */
import assert from 'assert';
import {getLanguage} from '../server';

describe('for language category', () => {
	it('should return null', () => {
		const user = {'connection': {'httpHeaders': {'accept-language': 'invalid'} } };
		const expected = null;
		const result = getLanguage(user);
		assert.deepEqual(expected, result);
	});
	it('should return Italian', () => {
		const user = {'connection': {'httpHeaders': {'accept-language': 'it,en;q=0.8,sq;q=0.6,hi;q=0.4,af;q=0.2,de;q=0.2,en-GB;q=0.2,en-US;q=0.2'} } };
		const expected = 'Italian';
		const result = getLanguage(user);
		assert.deepEqual(expected, result);
	});
});

