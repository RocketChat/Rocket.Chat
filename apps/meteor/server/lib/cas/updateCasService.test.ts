import { before, beforeEach, describe, it, mock } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();
const settingValues = new Map<string, unknown>();
const LoginServiceConfiguration = { createOrUpdateService: sandbox.stub(), removeByService: sandbox.stub() };
const notifyOnLoginServiceConfigurationChanged = sandbox.stub();
const notifyOnLoginServiceConfigurationChangedByService = sandbox.stub();

let updateCasServices: any;

before(async () => {
	const moduleMocks = [
		mock.module('./logger', { exports: { logger: { info: sandbox.stub() } } }),
		mock.module('../../settings/cached', { exports: { settings: { get: (id: string) => settingValues.get(id) } } }),
		mock.module('../notifyListener', {
			exports: { notifyOnLoginServiceConfigurationChanged, notifyOnLoginServiceConfigurationChangedByService },
		}),
	];
	({ updateCasServices } = await import('./updateCasService'));
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
});

describe('updateCasServices', () => {
	before(() => {
		mockModel('LoginServiceConfiguration', LoginServiceConfiguration);
	});

	beforeEach(() => {
		sandbox.resetHistory();
		settingValues.clear();
		LoginServiceConfiguration.removeByService.resolves(null);
	});

	it('should save the CAS login service and tell connected clients when CAS is enabled', async () => {
		settingValues.set('CAS_enabled', true);
		settingValues.set('CAS_login_url', 'https://cas.example.com/login');

		await updateCasServices();

		sinon.assert.calledOnceWithMatch(LoginServiceConfiguration.createOrUpdateService, 'cas', {
			enabled: true,
			login_url: 'https://cas.example.com/login',
		});
		sinon.assert.calledOnceWithExactly(notifyOnLoginServiceConfigurationChangedByService, 'cas');
	});

	it('should remove the CAS login service and tell connected clients when CAS is disabled', async () => {
		settingValues.set('CAS_enabled', false);
		LoginServiceConfiguration.removeByService.resolves({ _id: 'cas-id' });

		await updateCasServices();

		sinon.assert.calledOnceWithExactly(LoginServiceConfiguration.removeByService, 'cas');
		sinon.assert.calledOnceWithExactly(notifyOnLoginServiceConfigurationChanged, { _id: 'cas-id' }, 'removed');
	});

	it('should not notify when CAS is disabled and was not configured', async () => {
		await updateCasServices();

		sinon.assert.notCalled(notifyOnLoginServiceConfigurationChanged);
	});
});
