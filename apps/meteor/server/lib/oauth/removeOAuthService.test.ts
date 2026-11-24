import { before, beforeEach, describe, it, mock } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();
const LoginServiceConfiguration = { removeByService: sandbox.stub() };
const notifyOnLoginServiceConfigurationChanged = sandbox.stub();

let removeOAuthService: any;

before(async () => {
	mock.module('../notifyListener', { exports: { notifyOnLoginServiceConfigurationChanged } });
	({ removeOAuthService } = await import('./removeOAuthService'));
});

describe('removeOAuthService', () => {
	before(() => {
		mockModel('LoginServiceConfiguration', LoginServiceConfiguration);
	});

	beforeEach(() => {
		sandbox.resetHistory();
	});

	it('should remove the custom provider and tell connected clients', async () => {
		LoginServiceConfiguration.removeByService.resolves({ _id: 'service-id' });

		await removeOAuthService('Accounts_OAuth_Custom-Acme');

		sinon.assert.calledOnceWithExactly(LoginServiceConfiguration.removeByService, 'Acme');
		sinon.assert.calledOnceWithExactly(notifyOnLoginServiceConfigurationChanged, { _id: 'service-id' }, 'removed');
	});

	it('should not notify when the provider had no login service', async () => {
		LoginServiceConfiguration.removeByService.resolves(null);

		await removeOAuthService('Accounts_OAuth_Custom-Acme');

		sinon.assert.notCalled(notifyOnLoginServiceConfigurationChanged);
	});
});
