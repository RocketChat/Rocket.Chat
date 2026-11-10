import { describe, it } from 'node:test';

import { expect } from 'chai';

import { getLdapErrorReason } from './getLdapErrorReason';

describe('getLdapErrorReason', () => {
	it('should return the error message', () => {
		expect(getLdapErrorReason(new Error('Invalid Credentials'))).to.equal('Invalid Credentials');
	});

	it('should return the message of every attempt when all connection attempts fail', () => {
		const error = new AggregateError([new Error('connect ECONNREFUSED ::1:9999'), new Error('connect ETIMEDOUT 127.0.0.1:9999')]);

		expect(getLdapErrorReason(error)).to.equal('connect ECONNREFUSED ::1:9999; connect ETIMEDOUT 127.0.0.1:9999');
	});

	it('should fall back to the error code when the message is empty', () => {
		const error = Object.assign(new Error(''), { code: 'ECONNREFUSED' });

		expect(getLdapErrorReason(error)).to.equal('ECONNREFUSED');
	});

	it('should fall back to the error name when there is no message or code', () => {
		expect(getLdapErrorReason(new TypeError(''))).to.equal('TypeError');
	});

	it('should stringify values that are not errors', () => {
		expect(getLdapErrorReason('Timeout')).to.equal('Timeout');
	});
});
