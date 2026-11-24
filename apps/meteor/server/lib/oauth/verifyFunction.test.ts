import { before, describe, it, mock } from 'node:test';

import { expect } from 'chai';
import sinon from 'sinon';

const updateOrCreateUserFromExternalService = sinon.stub();

let verifyFunction: any;

before(async () => {
	const moduleMocks = [
		mock.module(require.resolve('meteor/accounts-base'), { exports: { Accounts: { updateOrCreateUserFromExternalService } } }),
	];
	({ verifyFunction } = await import('./verifyFunction'));
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
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
