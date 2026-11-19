import { describe, it } from 'node:test';

import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

const updateOrCreateUserFromExternalService = sinon.stub();

const { verifyFunction } = p.noCallThru().load('./verifyFunction.ts', {
	'meteor/accounts-base': { Accounts: { updateOrCreateUserFromExternalService } },
});

describe('verifyFunction', () => {
	it('should hand a rejected login to passport instead of leaving the request pending', async () => {
		const error = new Error('error-invalid-username');
		updateOrCreateUserFromExternalService.rejects(error);
		const done = sinon.stub();

		await verifyFunction('access-token', 'refresh-token', { id: 'external-id', displayName: 'Alice' }, done, 'test');

		expect(done.calledOnceWith(error)).to.be.true;
	});
});
