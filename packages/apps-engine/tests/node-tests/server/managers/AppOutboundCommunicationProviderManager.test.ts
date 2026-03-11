import * as assert from 'node:assert';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import type { AppManager } from '../../../../src/server/AppManager';
import type { ProxiedApp } from '../../../../src/server/ProxiedApp';
import type { AppBridges } from '../../../../src/server/bridges';
import type { AppApiManager, AppExternalComponentManager, AppSchedulerManager, AppSlashCommandManager } from '../../../../src/server/managers';
import { AppAccessorManager, AppOutboundCommunicationProviderManager } from '../../../../src/server/managers';
import { OutboundMessageProvider } from '../../../../src/server/managers/AppOutboundCommunicationProvider';
import { AppPermissionManager } from '../../../../src/server/managers/AppPermissionManager';
import type { UIActionButtonManager } from '../../../../src/server/managers/UIActionButtonManager';
import type { AppLogStorage, IAppStorageItem } from '../../../../src/server/storage';
import { TestsAppBridges } from '../../../test-data/bridges/appBridges';
import { TestsAppLogStorage } from '../../../test-data/storage/logStorage';
import { TestData } from '../../../test-data/utilities';

describe('AppOutboundCommunicationProviderManager', () => {
	let mockBridges: TestsAppBridges;
	let mockApp: ProxiedApp;
	let mockAccessors: AppAccessorManager;
	let mockManager: AppManager;
	let hasPermissionSpy: ReturnType<typeof mock.method>;

	beforeEach(() => {
		mockBridges = new TestsAppBridges();

		mockApp = TestData.getMockApp({ info: { id: 'testing', name: 'testing' } } as IAppStorageItem, {} as AppManager);

		const bri = mockBridges;
		const app = mockApp;

		mockManager = {
			getBridges(): AppBridges {
				return bri;
			},
			getCommandManager() {
				return {} as AppSlashCommandManager;
			},
			getExternalComponentManager(): AppExternalComponentManager {
				return {} as AppExternalComponentManager;
			},
			getApiManager() {
				return {} as AppApiManager;
			},
			getOneById(appId: string): ProxiedApp {
				return appId === 'failMePlease' ? undefined : app;
			},
			getLogStorage(): AppLogStorage {
				return new TestsAppLogStorage();
			},
			getSchedulerManager() {
				return {} as AppSchedulerManager;
			},
			getUIActionButtonManager() {
				return {} as UIActionButtonManager;
			},
			getOutboundCommunicationProviderManager() {
				return {} as AppOutboundCommunicationProviderManager;
			},
		} as AppManager;

		mockAccessors = new AppAccessorManager(mockManager);
		const ac = mockAccessors;
		mockManager.getAccessorManager = function _getAccessorManager(): AppAccessorManager {
			return ac;
		};

		hasPermissionSpy = mock.method(AppPermissionManager, 'hasPermission', () => true);
	});

	afterEach(() => {
		mock.restoreAll();
	});

	it('basicAppOutboundCommunicationProviderManager', () => {
		assert.throws(() => new AppOutboundCommunicationProviderManager({} as AppManager));
		assert.doesNotThrow(() => new AppOutboundCommunicationProviderManager(mockManager));

		const manager = new AppOutboundCommunicationProviderManager(mockManager);
		assert.strictEqual((manager as any).manager, mockManager);
		assert.strictEqual((manager as any).accessors, mockManager.getAccessorManager());
		assert.ok((manager as any).outboundMessageProviders !== undefined);
		assert.strictEqual((manager as any).outboundMessageProviders.size, 0);
	});

	it('addProvider', () => {
		const provider = TestData.getOutboundPhoneMessageProvider();
		const manager = new AppOutboundCommunicationProviderManager(mockManager);

		assert.doesNotThrow(() => manager.addProvider('testing', provider));
		assert.strictEqual((manager as any).outboundMessageProviders.size, 1);
		assert.throws(() => manager.addProvider('failMePlease', provider), {
			name: 'Error',
			message: 'App must exist in order for an outbound provider to be added.',
		});
		assert.strictEqual((manager as any).outboundMessageProviders.size, 1);
	});

	it('isAlreadyDefined', () => {
		const provider = TestData.getOutboundPhoneMessageProvider();
		const manager = new AppOutboundCommunicationProviderManager(mockManager);

		assert.strictEqual(manager.isAlreadyDefined('testing', 'phone'), false);

		manager.addProvider('testing', provider);

		assert.strictEqual(manager.isAlreadyDefined('testing', 'phone'), true);
		assert.strictEqual(manager.isAlreadyDefined('testing', 'email'), false);
		assert.strictEqual(manager.isAlreadyDefined('another-app', 'phone'), false);
	});

	it('addProviderTwiceShouldOverwrite', () => {
		const provider1 = TestData.getOutboundPhoneMessageProvider('provider1');
		const provider2 = TestData.getOutboundPhoneMessageProvider('provider2');
		const manager = new AppOutboundCommunicationProviderManager(mockManager);

		manager.addProvider('testing', provider1);
		const firstProviderInfo = (manager as any).outboundMessageProviders.get('testing').get('phone');
		assert.strictEqual(firstProviderInfo.provider.name, 'provider1');

		// Adding a provider of the same type should overwrite the previous one
		manager.addProvider('testing', provider2);
		const secondProviderInfo = (manager as any).outboundMessageProviders.get('testing').get('phone');
		assert.strictEqual(secondProviderInfo.provider.name, 'provider2');
		assert.strictEqual((manager as any).outboundMessageProviders.get('testing').size, 1);
	});

	it('addProviderWithoutPermission', () => {
		const provider = TestData.getOutboundPhoneMessageProvider();
		const manager = new AppOutboundCommunicationProviderManager(mockManager);

		hasPermissionSpy.mock.mockImplementation(() => false);

		assert.throws(() => manager.addProvider('testing', provider));
	});

	it('ignoreAppsWithoutProviders', () => {
		const manager = new AppOutboundCommunicationProviderManager(mockManager);

		assert.doesNotThrow(() => manager.registerProviders('non-existant'));
	});

	it('registerProviders', async () => {
		const manager = new AppOutboundCommunicationProviderManager(mockManager);

		manager.addProvider('firstApp', TestData.getOutboundPhoneMessageProvider());
		const appInfo = (manager as any).outboundMessageProviders.get('firstApp');
		assert.ok(appInfo !== undefined);
		const regInfo = appInfo.get('phone');
		assert.ok(regInfo !== undefined);

		assert.strictEqual(regInfo.isRegistered, false);
		await assert.doesNotReject(async () => manager.registerProviders('firstApp'));
		assert.strictEqual(regInfo.isRegistered, true);
	});

	it('registerTwoProviders', async () => {
		const manager = new AppOutboundCommunicationProviderManager(mockManager);

		manager.addProvider('firstApp', TestData.getOutboundPhoneMessageProvider());
		manager.addProvider('firstApp', TestData.getOutboundEmailMessageProvider());
		const firstApp = (manager as any).outboundMessageProviders.get('firstApp');
		assert.ok(firstApp !== undefined);
		const firstRegInfo = firstApp.get('phone');
		assert.ok(firstRegInfo !== undefined);
		const secondRegInfo = firstApp.get('email');
		assert.ok(secondRegInfo !== undefined);

		assert.strictEqual(firstRegInfo.isRegistered, false);
		assert.strictEqual(secondRegInfo.isRegistered, false);
		await assert.doesNotReject(async () => manager.registerProviders('firstApp'));
		assert.strictEqual(firstRegInfo.isRegistered, true);
		assert.strictEqual(secondRegInfo.isRegistered, true);
	});

	it('registerProvidersFromMultipleApps', async () => {
		const manager = new AppOutboundCommunicationProviderManager(mockManager);

		manager.addProvider('firstApp', TestData.getOutboundPhoneMessageProvider());
		manager.addProvider('firstApp', TestData.getOutboundEmailMessageProvider());
		manager.addProvider('secondApp', TestData.getOutboundPhoneMessageProvider('another-phone-provider'));

		const firstApp = (manager as any).outboundMessageProviders.get('firstApp');
		assert.ok(firstApp !== undefined);
		const firstRegInfo = firstApp.get('phone');
		const secondRegInfo = firstApp.get('email');
		assert.ok(firstRegInfo !== undefined);
		assert.ok(secondRegInfo !== undefined);
		const secondApp = (manager as any).outboundMessageProviders.get('secondApp');
		assert.ok(secondApp !== undefined);
		const thirdRegInfo = secondApp.get('phone');
		assert.ok(thirdRegInfo !== undefined);

		assert.strictEqual(firstRegInfo.isRegistered, false);
		assert.strictEqual(secondRegInfo.isRegistered, false);
		await assert.doesNotReject(async () => manager.registerProviders('firstApp'));
		assert.strictEqual(firstRegInfo.isRegistered, true);
		assert.strictEqual(secondRegInfo.isRegistered, true);
		assert.strictEqual(thirdRegInfo.isRegistered, false);
		await assert.doesNotReject(async () => manager.registerProviders('secondApp'));
		assert.strictEqual(thirdRegInfo.isRegistered, true);
	});

	it('unregisterProviders', async () => {
		const manager = new AppOutboundCommunicationProviderManager(mockManager);

		manager.addProvider('testing', TestData.getOutboundPhoneMessageProvider());
		const regInfo = (manager as any).outboundMessageProviders.get('testing').get('phone');
		await assert.doesNotReject(async () => manager.registerProviders('testing'));

		await assert.doesNotReject(async () => manager.unregisterProviders('non-existant'));
		assert.strictEqual(regInfo.isRegistered, true);
		await assert.doesNotReject(async () => manager.unregisterProviders('testing'));
		assert.strictEqual(regInfo.isRegistered, false);
		// It should be removed from the map
		assert.strictEqual((manager as any).outboundMessageProviders.has('testing'), false);
	});

	it('unregisterProvidersWithKeepReferences', async () => {
		const manager = new AppOutboundCommunicationProviderManager(mockManager);

		manager.addProvider('testing', TestData.getOutboundPhoneMessageProvider());
		const appInfo = (manager as any).outboundMessageProviders.get('testing');
		const regInfo = appInfo.get('phone');

		await assert.doesNotReject(async () => manager.registerProviders('testing'));
		assert.strictEqual(regInfo.isRegistered, true);
		await assert.doesNotReject(async () => manager.unregisterProviders('testing', { keepReferences: true }));
		assert.strictEqual(regInfo.isRegistered, false);
		// It should not be removed from the map
		assert.strictEqual((manager as any).outboundMessageProviders.has('testing'), true);
	});

	it('failToGetMetadataWithoutProvider', () => {
		const manager = new AppOutboundCommunicationProviderManager(mockManager);

		assert.throws(() => manager.getProviderMetadata('testing', 'phone'), { name: 'Error', message: 'provider-not-registered' });

		manager.addProvider('testing', TestData.getOutboundPhoneMessageProvider());

		assert.throws(() => manager.getProviderMetadata('testing', 'email'), { name: 'Error', message: 'provider-not-registered' });
	});

	it('getProviderMetadata', () => {
		const manager = new AppOutboundCommunicationProviderManager(mockManager);
		manager.addProvider('testing', TestData.getOutboundPhoneMessageProvider());

		mock.method(OutboundMessageProvider.prototype, 'runGetProviderMetadata', () => ({
			name: 'test-provider',
			capabilities: ['sms'],
		}));

		const metadata = manager.getProviderMetadata('testing', 'phone');
		assert.deepStrictEqual(metadata, {
			name: 'test-provider',
			capabilities: ['sms'],
		});
	});

	it('failToSendOutboundMessageWithoutProvider', () => {
		const manager = new AppOutboundCommunicationProviderManager(mockManager);
		const message = TestData.getOutboundMessage();

		assert.throws(() => manager.sendOutboundMessage('testing', 'phone', message), { name: 'Error', message: 'provider-not-registered' });

		manager.addProvider('testing', TestData.getOutboundPhoneMessageProvider());

		assert.throws(() => manager.sendOutboundMessage('testing', 'email', message), { name: 'Error', message: 'provider-not-registered' });
	});

	it('sendOutboundMessage', () => {
		const manager = new AppOutboundCommunicationProviderManager(mockManager);
		manager.addProvider('testing', TestData.getOutboundPhoneMessageProvider());

		const message = TestData.getOutboundMessage();

		mock.method(OutboundMessageProvider.prototype, 'runSendOutboundMessage', () => Promise.resolve('message-id'));

		const result = manager.sendOutboundMessage('testing', 'phone', message);
		assert.ok(result !== undefined);
	});
});
