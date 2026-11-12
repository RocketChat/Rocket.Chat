import { before, describe, it } from 'node:test';

import { hashLoginToken } from '@rocket.chat/account-utils';
import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

import { issueLoginToken } from './issueLoginToken';

const addLoginToken = sinon.stub().resolves();

describe('issueLoginToken', () => {
	before(() => {
		mockModel('Users', { addLoginToken });
	});

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
