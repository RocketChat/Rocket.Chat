import { describe, it } from 'node:test';

import { expect } from 'chai';
import sinon from 'sinon';

import { loadWithMocks } from '../../../tests/mocks/utils/loadWithMocks';

const updateOrCreateUserFromExternalService = sinon.stub();

const { verifyFunction } = loadWithMocks('./verifyFunction.ts', {
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
