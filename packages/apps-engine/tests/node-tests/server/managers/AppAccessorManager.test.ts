import * as assert from 'node:assert';
import { describe, it, beforeEach, mock } from 'node:test';

import type { AppOutboundCommunicationProviderManager } from '../../../../server/managers/AppOutboundCommunicationProviderManager';
import type { AppManager } from '../../../../src/server/AppManager';
import type { ProxiedApp } from '../../../../src/server/ProxiedApp';
import type { AppBridges } from '../../../../src/server/bridges';
import type {
	AppApiManager,
	AppExternalComponentManager,
	AppSchedulerManager,
	AppSlashCommandManager,
	AppVideoConfProviderManager,
} from '../../../../src/server/managers';
import { AppAccessorManager } from '../../../../src/server/managers';
import type { UIActionButtonManager } from '../../../../src/server/managers/UIActionButtonManager';
import { TestsAppBridges } from '../../../test-data/bridges/appBridges';

describe('AppAccessorManager', () => {
	let bridges: AppBridges;
	let manager: AppManager;

	beforeEach(() => {
		bridges = new TestsAppBridges();

		const brds = bridges;
		manager = {
			getBridges() {
				return brds;
			},
			getCommandManager() {
				return {} as AppSlashCommandManager;
			},
			getExternalComponentManager() {
				return {} as AppExternalComponentManager;
			},
			getApiManager() {
				return {} as AppApiManager;
			},
			getOneById(appId: string): ProxiedApp {
				return appId === 'testing' ? ({} as ProxiedApp) : undefined;
			},
			getSchedulerManager() {
				return {} as AppSchedulerManager;
			},
			getUIActionButtonManager() {
				return {} as UIActionButtonManager;
			},
			getVideoConfProviderManager() {
				return {} as AppVideoConfProviderManager;
			},
			getOutboundCommunicationProviderManager() {
				return {} as AppOutboundCommunicationProviderManager;
			},
		} as unknown as AppManager;
	});

	it('basicAppAccessorManager', () => {
		assert.doesNotThrow(() => new AppAccessorManager(manager));
		assert.doesNotThrow(() => new AppAccessorManager(manager).purifyApp('testing'));
	});

	it('configurationExtend', () => {
		const acm = new AppAccessorManager(manager);

		const getExternalComponentManagerSpy = mock.method(manager, 'getExternalComponentManager');
		const getCommandManagerSpy = mock.method(manager, 'getCommandManager');
		const getApiManagerSpy = mock.method(manager, 'getApiManager');

		assert.ok(acm.getConfigurationExtend('testing'));
		assert.throws(
			() => acm.getConfigurationExtend('fake'),
			{
				name: 'Error',
				message: 'No App found by the provided id: fake',
			},
		);
		assert.ok(acm.getConfigurationExtend('testing'));

		assert.strictEqual(getExternalComponentManagerSpy.mock.calls.length, 1);
		assert.strictEqual(getCommandManagerSpy.mock.calls.length, 1);
		assert.strictEqual(getApiManagerSpy.mock.calls.length, 1);
	});

	it('environmentRead', () => {
		const acm = new AppAccessorManager(manager);

		const getServerSettingBridgeSpy = mock.method(bridges, 'getServerSettingBridge');
		const getEnvironmentalVariableBridgeSpy = mock.method(bridges, 'getEnvironmentalVariableBridge');

		assert.ok(acm.getEnvironmentRead('testing'));
		assert.throws(
			() => acm.getEnvironmentRead('fake'),
			{
				name: 'Error',
				message: 'No App found by the provided id: fake',
			},
		);
		assert.ok(acm.getEnvironmentRead('testing'));

		assert.strictEqual(getServerSettingBridgeSpy.mock.calls.length, 1);
		assert.strictEqual(getEnvironmentalVariableBridgeSpy.mock.calls.length, 1);
	});

	it('configurationModify', () => {
		const acm = new AppAccessorManager(manager);

		const getServerSettingBridgeSpy = mock.method(bridges, 'getServerSettingBridge');
		const getCommandManagerSpy = mock.method(manager, 'getCommandManager');

		assert.ok(acm.getConfigurationModify('testing'));
		assert.ok(acm.getConfigurationModify('testing'));

		assert.strictEqual(getServerSettingBridgeSpy.mock.calls.length, 1);
		assert.strictEqual(getCommandManagerSpy.mock.calls.length, 1);
	});

	it('reader', () => {
		const acm = new AppAccessorManager(manager);

		const getServerSettingBridgeSpy = mock.method(bridges, 'getServerSettingBridge');
		const getEnvironmentalVariableBridgeSpy = mock.method(bridges, 'getEnvironmentalVariableBridge');
		const getPersistenceBridgeSpy = mock.method(bridges, 'getPersistenceBridge');
		const getRoomBridgeSpy = mock.method(bridges, 'getRoomBridge');
		const getUserBridgeSpy = mock.method(bridges, 'getUserBridge');
		const getMessageBridgeSpy = mock.method(bridges, 'getMessageBridge');

		assert.ok(acm.getReader('testing'));
		assert.ok(acm.getReader('testing'));

		assert.strictEqual(getServerSettingBridgeSpy.mock.calls.length, 1);
		assert.strictEqual(getEnvironmentalVariableBridgeSpy.mock.calls.length, 1);
		assert.strictEqual(getPersistenceBridgeSpy.mock.calls.length, 1);
		assert.strictEqual(getRoomBridgeSpy.mock.calls.length, 1);
		assert.strictEqual(getUserBridgeSpy.mock.calls.length, 2);
		assert.strictEqual(getMessageBridgeSpy.mock.calls.length, 2);
	});

	it('modifier', () => {
		const acm = new AppAccessorManager(manager);

		const getBridgesSpy = mock.method(manager, 'getBridges');
		const getMessageBridgeSpy = mock.method(bridges, 'getMessageBridge');

		assert.ok(acm.getModifier('testing'));
		assert.ok(acm.getModifier('testing'));

		assert.strictEqual(getBridgesSpy.mock.calls.length, 1);
		assert.strictEqual(getMessageBridgeSpy.mock.calls.length, 1);
	});

	it('persistence', () => {
		const acm = new AppAccessorManager(manager);

		const getPersistenceBridgeSpy = mock.method(bridges, 'getPersistenceBridge');

		assert.ok(acm.getPersistence('testing'));
		assert.ok(acm.getPersistence('testing'));

		assert.strictEqual(getPersistenceBridgeSpy.mock.calls.length, 1);
	});

	it('http', () => {
		const acm = new AppAccessorManager(manager);

		assert.ok(acm.getHttp('testing'));
		assert.ok(acm.getHttp('testing'));

		(acm as any).https.delete('testing');
		assert.ok(acm.getHttp('testing'));
	});
});
