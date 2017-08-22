/* eslint-env mocha */
import assert from 'assert';
import {getCountry} from '../server';

describe('for geoIp category', () => {
	it('should return null', () => {
		const user = {'connection':{'httpHeaders':{'x-forwarded-for': '127.0.0.1'} } };
		const expected = null;
		const result = getCountry(user);
		assert.deepEqual(expected, result);
	});
	it('should return Germany', () => {
		const user = {'connection':{'httpHeaders':{'x-forwarded-for': '178.11.218.197,201.83.41.11,112.196.171.19'} } };
		const expected = 'Germany';
		const result = getCountry(user);
		assert.deepEqual(expected, result);
	});
});

