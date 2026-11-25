import { before, describe, it, mock } from 'node:test';

import { expect } from 'chai';
import sinon from 'sinon';

const updateOrCreateUserFromExternalService = sinon.stub();

let verifyFunction: any;

before(async () => {
	mock.module('../auth/updateOrCreateUserFromExternalService', { exports: { updateOrCreateUserFromExternalService } });
	({ verifyFunction } = await import('./verifyFunction'));
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
