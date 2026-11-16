import { beforeEach, describe, it } from 'node:test';

import p from 'proxyquire';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();
const LoginServiceConfiguration = { removeByService: sandbox.stub() };
const notifyOnLoginServiceConfigurationChanged = sandbox.stub();

const { removeOAuthService } = p.noCallThru().load('./removeOAuthService.ts', {
	'@rocket.chat/models': { LoginServiceConfiguration },
	'../notifyListener': { notifyOnLoginServiceConfigurationChanged },
});

describe('removeOAuthService', () => {
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
