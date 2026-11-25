import { before, describe, it, mock } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();
const LoginServiceConfiguration = { removeAll: sandbox.stub().resolves(['google-id', 'cas-id']) };
const notifyOnLoginServiceConfigurationChanged = sandbox.stub();
const updateOAuthServices = sandbox.stub().resolves();
const updateCasServices = sandbox.stub().resolves();

let refreshLoginServices: any;

before(async () => {
	mock.module('./notifyListener', { exports: { notifyOnLoginServiceConfigurationChanged } });
	mock.module('./oauth/updateOAuthServices', { exports: { updateOAuthServices } });
	mock.module('./cas/updateCasService', { exports: { updateCasServices } });
	({ refreshLoginServices } = await import('./refreshLoginServices'));
});

describe('refreshLoginServices', () => {
	before(() => {
		mockModel('LoginServiceConfiguration', LoginServiceConfiguration);
	});

	it('should tell connected clients about every login service it removes before rebuilding them', async () => {
		await refreshLoginServices();

		sinon.assert.calledTwice(notifyOnLoginServiceConfigurationChanged);
		sinon.assert.calledWithExactly(notifyOnLoginServiceConfigurationChanged, { _id: 'google-id' }, 'removed');
		sinon.assert.calledWithExactly(notifyOnLoginServiceConfigurationChanged, { _id: 'cas-id' }, 'removed');
		sinon.assert.callOrder(LoginServiceConfiguration.removeAll, updateOAuthServices);
		sinon.assert.calledOnce(updateCasServices);
	});
});
