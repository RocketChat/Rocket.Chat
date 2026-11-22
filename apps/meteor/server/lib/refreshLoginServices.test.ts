import { describe, it } from 'node:test';

import p from 'proxyquire';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();
const LoginServiceConfiguration = { removeAll: sandbox.stub().resolves(['google-id', 'cas-id']) };
const notifyOnLoginServiceConfigurationChanged = sandbox.stub();
const updateOAuthServices = sandbox.stub().resolves();
const updateCasServices = sandbox.stub().resolves();

const { refreshLoginServices } = p.noCallThru().load('./refreshLoginServices.ts', {
	'@rocket.chat/models': { LoginServiceConfiguration },
	'./notifyListener': { notifyOnLoginServiceConfigurationChanged },
	'./oauth/updateOAuthServices': { updateOAuthServices },
	'./cas/updateCasService': { updateCasServices },
});

describe('refreshLoginServices', () => {
	it('should tell connected clients about every login service it removes before rebuilding them', async () => {
		await refreshLoginServices();

		sinon.assert.calledTwice(notifyOnLoginServiceConfigurationChanged);
		sinon.assert.calledWithExactly(notifyOnLoginServiceConfigurationChanged, { _id: 'google-id' }, 'removed');
		sinon.assert.calledWithExactly(notifyOnLoginServiceConfigurationChanged, { _id: 'cas-id' }, 'removed');
		sinon.assert.callOrder(LoginServiceConfiguration.removeAll, updateOAuthServices);
		sinon.assert.calledOnce(updateCasServices);
	});
});
