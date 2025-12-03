import * as assert from 'node:assert';
import { describe, it, beforeEach, afterEach, mock } from 'node:test';

import type { AppOutboundCommunicationProviderManager } from '../../../../src/server/managers/AppOutboundCommunicationProviderManager';
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
	let spies: {
		getServerSettingBridge: any;
		getEnvironmentalVariableBridge: any;
		getMessageBridge: any;
		getPersistenceBridge: any;
		getRoomBridge: any;
		getUserBridge: any;
		getBridges: any;
		getCommandManager: any;
		getExternalComponentManager: any;
		getApiManager: any;
	};

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

		// Set up spies before each test
		spies = {
			getServerSettingBridge: mock.method(bridges, 'getServerSettingBridge'),
			getEnvironmentalVariableBridge: mock.method(bridges, 'getEnvironmentalVariableBridge'),
			getMessageBridge: mock.method(bridges, 'getMessageBridge'),
			getPersistenceBridge: mock.method(bridges, 'getPersistenceBridge'),
			getRoomBridge: mock.method(bridges, 'getRoomBridge'),
			getUserBridge: mock.method(bridges, 'getUserBridge'),
			getBridges: mock.method(manager, 'getBridges'),
			getCommandManager: mock.method(manager, 'getCommandManager'),
			getExternalComponentManager: mock.method(manager, 'getExternalComponentManager'),
			getApiManager: mock.method(manager, 'getApiManager'),
		};
	});

	afterEach(() => {
		mock.restoreAll();
	});

	it('basicAppAccessorManager', () => {
		assert.doesNotThrow(() => new AppAccessorManager(manager));
		assert.doesNotThrow(() => new AppAccessorManager(manager).purifyApp('testing'));
	});

	it('configurationExtend', () => {
		const acm = new AppAccessorManager(manager);

		assert.ok(acm.getConfigurationExtend('testing'));
		assert.throws(
			() => acm.getConfigurationExtend('fake'),
			{
				name: 'Error',
				message: 'No App found by the provided id: fake',
			},
		);
		assert.ok(acm.getConfigurationExtend('testing'));

		assert.strictEqual(spies.getExternalComponentManager.mock.calls.length, 1);
		assert.strictEqual(spies.getCommandManager.mock.calls.length, 1);
		assert.strictEqual(spies.getApiManager.mock.calls.length, 1);
	});

	it('environmentRead', () => {
		const acm = new AppAccessorManager(manager);

		assert.ok(acm.getEnvironmentRead('testing'));
		assert.throws(
			() => acm.getEnvironmentRead('fake'),
			{
				name: 'Error',
				message: 'No App found by the provided id: fake',
			},
		);
		assert.ok(acm.getEnvironmentRead('testing'));

		assert.strictEqual(spies.getServerSettingBridge.mock.calls.length, 1);
		assert.strictEqual(spies.getEnvironmentalVariableBridge.mock.calls.length, 1);
	});

	it('configurationModify', () => {
		const acm = new AppAccessorManager(manager);

		assert.ok(acm.getConfigurationModify('testing'));
		assert.ok(acm.getConfigurationModify('testing'));

		assert.strictEqual(spies.getServerSettingBridge.mock.calls.length, 1);
		assert.strictEqual(spies.getCommandManager.mock.calls.length, 1);
	});

	it('reader', () => {
		const acm = new AppAccessorManager(manager);

		assert.ok(acm.getReader('testing'));
		assert.ok(acm.getReader('testing'));

		assert.strictEqual(spies.getServerSettingBridge.mock.calls.length, 1);
		assert.strictEqual(spies.getEnvironmentalVariableBridge.mock.calls.length, 1);
		assert.strictEqual(spies.getPersistenceBridge.mock.calls.length, 1);
		assert.strictEqual(spies.getRoomBridge.mock.calls.length, 1);
		assert.strictEqual(spies.getUserBridge.mock.calls.length, 2);
		assert.strictEqual(spies.getMessageBridge.mock.calls.length, 2);
	});

	it('modifier', () => {
		const acm = new AppAccessorManager(manager);

		assert.ok(acm.getModifier('testing'));
		assert.ok(acm.getModifier('testing'));

		assert.strictEqual(spies.getBridges.mock.calls.length, 1);
		assert.strictEqual(spies.getMessageBridge.mock.calls.length, 1);
	});

	it('persistence', () => {
		const acm = new AppAccessorManager(manager);

		assert.ok(acm.getPersistence('testing'));
		assert.ok(acm.getPersistence('testing'));

		assert.strictEqual(spies.getPersistenceBridge.mock.calls.length, 1);
	});

	it('http', () => {
		const acm = new AppAccessorManager(manager);

		assert.ok(acm.getHttp('testing'));
		assert.ok(acm.getHttp('testing'));

		(acm as any).https.delete('testing');
		assert.ok(acm.getHttp('testing'));
	});
});
