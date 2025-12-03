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
		mock.method(bridges, 'getServerSettingBridge');
		mock.method(bridges, 'getEnvironmentalVariableBridge');
		mock.method(bridges, 'getMessageBridge');
		mock.method(bridges, 'getPersistenceBridge');
		mock.method(bridges, 'getRoomBridge');
		mock.method(bridges, 'getUserBridge');
		mock.method(manager, 'getBridges');
		mock.method(manager, 'getCommandManager');
		mock.method(manager, 'getExternalComponentManager');
		mock.method(manager, 'getApiManager');
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

		assert.strictEqual((manager.getExternalComponentManager as any).mock.calls.length, 1);
		assert.strictEqual((manager.getCommandManager as any).mock.calls.length, 1);
		assert.strictEqual((manager.getApiManager as any).mock.calls.length, 1);
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

		assert.strictEqual((bridges.getServerSettingBridge as any).mock.calls.length, 1);
		assert.strictEqual((bridges.getEnvironmentalVariableBridge as any).mock.calls.length, 1);
	});

	it('configurationModify', () => {
		const acm = new AppAccessorManager(manager);

		assert.ok(acm.getConfigurationModify('testing'));
		assert.ok(acm.getConfigurationModify('testing'));

		assert.strictEqual((bridges.getServerSettingBridge as any).mock.calls.length, 1);
		assert.strictEqual((manager.getCommandManager as any).mock.calls.length, 1);
	});

	it('reader', () => {
		const acm = new AppAccessorManager(manager);

		assert.ok(acm.getReader('testing'));
		assert.ok(acm.getReader('testing'));

		assert.strictEqual((bridges.getServerSettingBridge as any).mock.calls.length, 1);
		assert.strictEqual((bridges.getEnvironmentalVariableBridge as any).mock.calls.length, 1);
		assert.strictEqual((bridges.getPersistenceBridge as any).mock.calls.length, 1);
		assert.strictEqual((bridges.getRoomBridge as any).mock.calls.length, 1);
		assert.strictEqual((bridges.getUserBridge as any).mock.calls.length, 2);
		assert.strictEqual((bridges.getMessageBridge as any).mock.calls.length, 2);
	});

	it('modifier', () => {
		const acm = new AppAccessorManager(manager);

		assert.ok(acm.getModifier('testing'));
		assert.ok(acm.getModifier('testing'));

		assert.strictEqual((manager.getBridges as any).mock.calls.length, 1);
		assert.strictEqual((bridges.getMessageBridge as any).mock.calls.length, 1);
	});

	it('persistence', () => {
		const acm = new AppAccessorManager(manager);

		assert.ok(acm.getPersistence('testing'));
		assert.ok(acm.getPersistence('testing'));

		assert.strictEqual((bridges.getPersistenceBridge as any).mock.calls.length, 1);
	});

	it('http', () => {
		const acm = new AppAccessorManager(manager);

		assert.ok(acm.getHttp('testing'));
		assert.ok(acm.getHttp('testing'));

		(acm as any).https.delete('testing');
		assert.ok(acm.getHttp('testing'));
	});
});
