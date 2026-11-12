import { describe, it } from 'node:test';

import { hashLoginToken } from '@rocket.chat/account-utils';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const addLoginToken = sinon.stub().resolves();

const { issueLoginToken } = proxyquire.noCallThru().load('./issueLoginToken.ts', {
	'@rocket.chat/models': { Users: { addLoginToken } },
});

describe('issueLoginToken', () => {
	it('should store only the hash of the token it returns, stamped with its creation date', async () => {
		const stampedToken = await issueLoginToken('user-id');

		expect(stampedToken.token).to.match(/^[A-Za-z0-9_-]{43}$/);
		expect(stampedToken.when).to.be.instanceOf(Date);
		sinon.assert.calledOnceWithExactly(addLoginToken, 'user-id', {
			when: stampedToken.when,
			hashedToken: hashLoginToken(stampedToken.token),
		});
	});
});
