import { before, beforeEach, describe, it } from 'node:test';

import type { ILoginServiceConfigurationModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';
import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const settingValues = new Map<string, unknown>();
const addPassportCustomOAuth = sandbox.stub();
const notifyOnLoginServiceConfigurationChanged = sandbox.stub();
const notifyOnLoginServiceConfigurationChangedByService = sandbox.stub();
const LoginServiceConfiguration = { createOrUpdateService: sandbox.stub(), removeByService: sandbox.stub() };

const { updateOAuthServices } = p.noCallThru().load('./updateOAuthServices.ts', {
	'../../settings/cached': {
		settings: {
			get: (key: string) => settingValues.get(key),
			getByRegexp: (regex: RegExp) => [...settingValues].filter(([key]) => regex.test(key)),
		},
	},
	'./addPassportCustomOAuth': { addPassportCustomOAuth },
	'../notifyListener': { notifyOnLoginServiceConfigurationChanged, notifyOnLoginServiceConfigurationChangedByService },
});

describe('updateOAuthServices', () => {
	before(() => {
		registerModel('ILoginServiceConfigurationModel', LoginServiceConfiguration as unknown as ILoginServiceConfigurationModel);
	});

	beforeEach(() => {
		sandbox.reset();
		settingValues.clear();
		LoginServiceConfiguration.createOrUpdateService.resolves('service-id');
		LoginServiceConfiguration.removeByService.resolves(null);
	});

	it('should publish the client id and secret of an enabled provider as its login service', async () => {
		settingValues.set('Accounts_OAuth_Google', true);
		settingValues.set('Accounts_OAuth_Google_id', 'google-client');
		settingValues.set('Accounts_OAuth_Google_secret', 'google-secret');

		await updateOAuthServices();

		expect(LoginServiceConfiguration.createOrUpdateService.args).to.deep.equal([
			['google', { clientId: 'google-client', secret: 'google-secret' }],
		]);
		expect(notifyOnLoginServiceConfigurationChangedByService.calledOnceWith('google')).to.be.true;
		expect(addPassportCustomOAuth.called).to.be.false;
	});

	it('should remove the login service of a disabled provider and tell the clients', async () => {
		settingValues.set('Accounts_OAuth_Github', false);
		LoginServiceConfiguration.removeByService.resolves({ _id: 'github-service-id' });

		await updateOAuthServices();

		expect(LoginServiceConfiguration.removeByService.calledOnceWith('Github')).to.be.true;
		expect(notifyOnLoginServiceConfigurationChanged.calledOnceWith({ _id: 'github-service-id' }, 'removed')).to.be.true;
		expect(LoginServiceConfiguration.createOrUpdateService.called).to.be.false;
	});

	it('should not notify the clients when a disabled provider had no login service', async () => {
		settingValues.set('Accounts_OAuth_Github', false);

		await updateOAuthServices();

		expect(notifyOnLoginServiceConfigurationChanged.called).to.be.false;
	});

	it('should publish an enabled custom provider and register its OAuth routes with the same configuration', async () => {
		settingValues.set('Accounts_OAuth_Custom-Keycloak', true);
		settingValues.set('Accounts_OAuth_Custom-Keycloak-id', 'kc-client');
		settingValues.set('Accounts_OAuth_Custom-Keycloak-secret', 'kc-secret');
		settingValues.set('Accounts_OAuth_Custom-Keycloak-url', 'https://sso.example.com');
		settingValues.set('Accounts_OAuth_Custom-Keycloak-login_style', 'popup');
		settingValues.set('Accounts_OAuth_Custom-Keycloak-merge_users', true);

		await updateOAuthServices();

		const [serviceKey, data] = LoginServiceConfiguration.createOrUpdateService.firstCall.args;
		expect(serviceKey).to.equal('keycloak');
		expect(data).to.include({
			custom: true,
			clientId: 'kc-client',
			secret: 'kc-secret',
			serverURL: 'https://sso.example.com',
			loginStyle: 'popup',
			mergeUsers: true,
		});

		const [routeKey, config, isCustom] = addPassportCustomOAuth.firstCall.args;
		expect(routeKey).to.equal('keycloak');
		expect(isCustom).to.be.true;
		expect(config).to.include({
			clientId: 'kc-client',
			clientSecret: 'kc-secret',
			serverURL: 'https://sso.example.com',
			loginStyle: 'popup',
			mergeUsers: true,
		});
	});

	it('should leave alone the settings that are not provider switches', async () => {
		settingValues.set('Accounts_OAuth_Google_id', 'google-client');
		settingValues.set('Accounts_OAuth_Custom-Keycloak-merge_users', true);

		await updateOAuthServices();

		expect(LoginServiceConfiguration.createOrUpdateService.called).to.be.false;
		expect(LoginServiceConfiguration.removeByService.called).to.be.false;
	});
});
