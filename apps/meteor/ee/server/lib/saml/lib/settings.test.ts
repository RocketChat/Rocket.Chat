import { beforeEach, describe, it } from 'node:test';

import proxyquire from 'proxyquire';
import sinon from 'sinon';

const hasModule = sinon.stub();
const createOrUpdateService = sinon.stub();
const removeByService = sinon.stub();
const notifyOnLoginServiceConfigurationChanged = sinon.stub();
const notifyOnLoginServiceConfigurationChangedByService = sinon.stub();
const setServiceProvidersList = sinon.stub();

const settingValues: Record<string, unknown> = {
	SAML_Custom_Default: true,
	SAML_Custom_Default_provider: 'test-saml',
	SAML_Custom_Default_cert: 'certificate',
	SAML_Custom_Default_signature_validation_type: 'All',
};

const { loadSamlServiceProviders } = proxyquire.noCallThru().load('./settings', {
	'@rocket.chat/license': {
		License: { hasModule },
	},
	'@rocket.chat/models': {
		LoginServiceConfiguration: { createOrUpdateService, removeByService },
	},
	'meteor/meteor': {
		Meteor: { absoluteUrl: (path: string) => `http://localhost:3000/${path}` },
	},
	'./Utils': {
		SAMLUtils: {
			normalizeCert: (cert: string) => cert,
			events: { emit: sinon.stub() },
			log: sinon.stub(),
			error: sinon.stub(),
			setServiceProvidersList,
		},
	},
	'../../../../../server/lib/logger/system': { SystemLogger: { warn: sinon.stub() } },
	'../../../../../server/lib/notifyListener': {
		notifyOnLoginServiceConfigurationChanged,
		notifyOnLoginServiceConfigurationChangedByService,
	},
	'../../../../../server/settings': {
		settings: {
			get: (key: string) => settingValues[key],
			getByRegexp: (regex: RegExp) => Object.entries(settingValues).filter(([key]) => regex.test(key)),
		},
		settingsRegistry: {},
	},
});

describe('loadSamlServiceProviders', () => {
	beforeEach(() => {
		hasModule.reset();
		createOrUpdateService.reset();
		removeByService.reset();
		removeByService.resolves({ _id: 'saml-service-id' });
		notifyOnLoginServiceConfigurationChanged.reset();
		notifyOnLoginServiceConfigurationChangedByService.reset();
		setServiceProvidersList.reset();
	});

	it('should remove the SAML login service without the saml-enterprise module', async () => {
		hasModule.withArgs('saml-enterprise').returns(false);

		await loadSamlServiceProviders();

		sinon.assert.calledOnceWithExactly(removeByService, 'saml');
		sinon.assert.calledOnceWithExactly(notifyOnLoginServiceConfigurationChanged, { _id: 'saml-service-id' }, 'removed');
		sinon.assert.notCalled(createOrUpdateService);
		sinon.assert.calledOnceWithExactly(setServiceProvidersList, []);
	});

	it('should keep the SAML login service with the saml-enterprise module', async () => {
		hasModule.withArgs('saml-enterprise').returns(true);

		await loadSamlServiceProviders();

		sinon.assert.calledOnceWithMatch(createOrUpdateService, 'saml');
		sinon.assert.calledOnceWithMatch(setServiceProvidersList, [sinon.match({ provider: 'test-saml' })]);
		sinon.assert.notCalled(removeByService);
	});
});
