import * as assert from 'node:assert';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import type { AppManager } from '../../../src/server/AppManager';
import type { ProxiedApp } from '../../../src/server/ProxiedApp';
import type { AppBridges } from '../../../src/server/bridges';
import type { AppApiManager, AppExternalComponentManager, AppSchedulerManager, AppSlashCommandManager } from '../../../src/server/managers';
import { AppAccessorManager, AppVideoConfProviderManager } from '../../../src/server/managers';
import { AppVideoConfProvider } from '../../../src/server/managers/AppVideoConfProvider';
import type { UIActionButtonManager } from '../../../src/server/managers/UIActionButtonManager';
import type { AppLogStorage, IAppStorageItem } from '../../../src/server/storage';
import { TestsAppBridges } from '../../test-data/bridges/appBridges';
import { TestsAppLogStorage } from '../../test-data/storage/logStorage';
import { TestData } from '../../test-data/utilities';

describe('AppVideoConfProviderManager', () => {
	let mockBridges: TestsAppBridges;
	let mockApp: ProxiedApp;
	let mockAccessors: AppAccessorManager;
	let mockManager: AppManager;

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
			getVideoConfProviderManager() {
				return {} as AppVideoConfProviderManager;
			},
		} as AppManager;

		mockAccessors = new AppAccessorManager(mockManager);
		const ac = mockAccessors;
		mockManager.getAccessorManager = function _getAccessorManager(): AppAccessorManager {
			return ac;
		};
	});

	afterEach(() => {
		mock.restoreAll();
	});

	it('basicAppVideoConfProviderManager', () => {
		assert.throws(() => new AppVideoConfProviderManager({} as AppManager));
		assert.doesNotThrow(() => new AppVideoConfProviderManager(mockManager));

		const manager = new AppVideoConfProviderManager(mockManager);
		assert.strictEqual((manager as any).manager, mockManager);
		assert.strictEqual((manager as any).accessors, mockManager.getAccessorManager());
		assert.ok((manager as any).videoConfProviders !== undefined);
		assert.strictEqual((manager as any).videoConfProviders.size, 0);
	});

	it('addProvider', () => {
		const provider = TestData.getVideoConfProvider();
		const manager = new AppVideoConfProviderManager(mockManager);

		assert.doesNotThrow(() => manager.addProvider('testing', provider));
		assert.strictEqual((manager as any).videoConfProviders.size, 1);
		assert.throws(() => manager.addProvider('failMePlease', provider), {
			name: 'Error',
			message: 'App must exist in order for a video conference provider to be added.',
		});
		assert.strictEqual((manager as any).videoConfProviders.size, 1);
	});

	it('ignoreAppsWithoutProviders', async () => {
		const manager = new AppVideoConfProviderManager(mockManager);

		await assert.doesNotReject(() => manager.registerProviders('non-existant'));
	});

	it('registerProviders', async () => {
		const manager = new AppVideoConfProviderManager(mockManager);

		manager.addProvider('firstApp', TestData.getVideoConfProvider());
		const appInfo = (manager as any).videoConfProviders.get('firstApp') as Map<string, AppVideoConfProvider>;
		assert.ok(appInfo !== undefined);
		const regInfo = appInfo.get('test');
		assert.ok(regInfo !== undefined);

		assert.strictEqual(regInfo.isRegistered, false);
		await assert.doesNotReject(() => manager.registerProviders('firstApp'));
		assert.strictEqual(regInfo.isRegistered, true);
	});

	it('registerTwoProviders', async () => {
		const manager = new AppVideoConfProviderManager(mockManager);

		manager.addProvider('firstApp', TestData.getVideoConfProvider());
		manager.addProvider('firstApp', TestData.getVideoConfProvider('another-test'));
		const firstApp = (manager as any).videoConfProviders.get('firstApp') as Map<string, AppVideoConfProvider>;
		assert.ok(firstApp !== undefined);
		const firstRegInfo = firstApp.get('test');
		assert.ok(firstRegInfo !== undefined);
		const secondRegInfo = firstApp.get('another-test');
		assert.ok(secondRegInfo !== undefined);

		assert.strictEqual(firstRegInfo.isRegistered, false);
		assert.strictEqual(secondRegInfo.isRegistered, false);
		await assert.doesNotReject(() => manager.registerProviders('firstApp'));
		assert.strictEqual(firstRegInfo.isRegistered, true);
		assert.strictEqual(secondRegInfo.isRegistered, true);
	});

	it('registerProvidersFromMultipleApps', async () => {
		const manager = new AppVideoConfProviderManager(mockManager);

		manager.addProvider('firstApp', TestData.getVideoConfProvider());
		manager.addProvider('firstApp', TestData.getVideoConfProvider('another-test'));
		manager.addProvider('secondApp', TestData.getVideoConfProvider('test3'));

		const firstApp = (manager as any).videoConfProviders.get('firstApp') as Map<string, AppVideoConfProvider>;
		assert.ok(firstApp !== undefined);
		const firstRegInfo = firstApp.get('test');
		const secondRegInfo = firstApp.get('another-test');
		assert.ok(firstRegInfo !== undefined);
		assert.ok(secondRegInfo !== undefined);
		const secondApp = (manager as any).videoConfProviders.get('secondApp') as Map<string, AppVideoConfProvider>;
		assert.ok(secondApp !== undefined);
		const thirdRegInfo = secondApp.get('test3');
		assert.ok(thirdRegInfo !== undefined);

		assert.strictEqual(firstRegInfo.isRegistered, false);
		assert.strictEqual(secondRegInfo.isRegistered, false);
		await assert.doesNotReject(() => manager.registerProviders('firstApp'));
		assert.strictEqual(firstRegInfo.isRegistered, true);
		assert.strictEqual(secondRegInfo.isRegistered, true);
		assert.strictEqual(thirdRegInfo.isRegistered, false);
		await assert.doesNotReject(() => manager.registerProviders('secondApp'));
		assert.strictEqual(thirdRegInfo.isRegistered, true);
	});

	it('failToRegisterSameProvider', () => {
		const manager = new AppVideoConfProviderManager(mockManager);

		manager.addProvider('firstApp', TestData.getVideoConfProvider());

		assert.throws(() => manager.addProvider('secondApp', TestData.getVideoConfProvider('test')), {
			name: 'VideoConfProviderAlreadyExists',
			message: `The video conference provider "test" was already registered by another App.`,
		});
	});

	it('unregisterProviders', async () => {
		const manager = new AppVideoConfProviderManager(mockManager);

		manager.addProvider('testing', TestData.getVideoConfProvider());
		const regInfo = (manager as any).videoConfProviders.get('testing').get('test') as AppVideoConfProvider;
		await assert.doesNotReject(() => manager.registerProviders('testing'));

		await assert.doesNotReject(() => manager.unregisterProviders('non-existant'));
		assert.strictEqual(regInfo.isRegistered, true);
		await assert.doesNotReject(() => manager.unregisterProviders('testing'));
		assert.strictEqual(regInfo.isRegistered, false);
	});

	it('failToGenerateUrlWithoutProvider', async () => {
		const manager = new AppVideoConfProviderManager(mockManager);

		const call = TestData.getVideoConfData();

		await assert.rejects(() => manager.generateUrl('test', call), {
			name: 'VideoConfProviderNotRegistered',
			message: `The video conference provider "test" is not registered in the system.`,
		});

		manager.addProvider('testing', TestData.getVideoConfProvider());

		await assert.rejects(() => manager.generateUrl('test', call), {
			name: 'VideoConfProviderNotRegistered',
			message: `The video conference provider "test" is not registered in the system.`,
		});
	});

	it('generateUrl', async () => {
		const manager = new AppVideoConfProviderManager(mockManager);
		manager.addProvider('testing', TestData.getVideoConfProvider());
		await manager.registerProviders('testing');

		const call = TestData.getVideoConfData();

		mock.method(AppVideoConfProvider.prototype, 'runGenerateUrl', () => 'test/first-call');
		const url = await manager.generateUrl('test', call);
		assert.strictEqual(url, 'test/first-call');
	});

	it('generateUrlWithMultipleProvidersAvailable', async () => {
		const manager = new AppVideoConfProviderManager(mockManager);
		manager.addProvider('testing', TestData.getVideoConfProvider());
		manager.addProvider('testing', TestData.getVideoConfProvider('test2'));
		await manager.registerProviders('testing');
		manager.addProvider('secondApp', TestData.getVideoConfProvider('differentProvider'));
		await manager.registerProviders('secondApp');

		const call = TestData.getVideoConfData();

		const testProvider = (manager as any).videoConfProviders.get('testing').get('test') as AppVideoConfProvider;
		const test2Provider = (manager as any).videoConfProviders.get('testing').get('test2') as AppVideoConfProvider;
		const differentProvider = (manager as any).videoConfProviders.get('secondApp').get('differentprovider') as AppVideoConfProvider;

		mock.method(testProvider, 'runGenerateUrl', () => 'test/first-call');
		mock.method(test2Provider, 'runGenerateUrl', () => 'test2/first-call');
		mock.method(differentProvider, 'runGenerateUrl', () => 'differentProvider/first-call');

		assert.strictEqual(await manager.generateUrl('test', call), 'test/first-call');
		assert.strictEqual(await manager.generateUrl('test2', call), 'test2/first-call');
		assert.strictEqual(await manager.generateUrl('differentProvider', call), 'differentProvider/first-call');
	});

	it('failToGenerateUrlWithUnknownProvider', async () => {
		const call = TestData.getVideoConfData();
		const manager = new AppVideoConfProviderManager(mockManager);
		await assert.rejects(() => manager.generateUrl('unknownProvider', call), {
			name: 'VideoConfProviderNotRegistered',
			message: `The video conference provider "unknownProvider" is not registered in the system.`,
		});
	});

	it('failToGenerateUrlWithUnregisteredProvider', async () => {
		const call = TestData.getVideoConfData();
		const manager = new AppVideoConfProviderManager(mockManager);
		manager.addProvider('unregisteredApp', TestData.getVideoConfProvider('unregisteredProvider'));
		await assert.rejects(() => manager.generateUrl('unregisteredProvider', call), {
			name: 'VideoConfProviderNotRegistered',
			message: `The video conference provider "unregisteredProvider" is not registered in the system.`,
		});
	});

	it('failToCustomizeUrlWithoutProvider', async () => {
		const manager = new AppVideoConfProviderManager(mockManager);
		const call = TestData.getVideoConfDataExtended();
		const user = TestData.getVideoConferenceUser();

		await assert.rejects(() => manager.customizeUrl('test', call, user, {}), {
			name: 'VideoConfProviderNotRegistered',
			message: `The video conference provider "test" is not registered in the system.`,
		});

		manager.addProvider('testing', TestData.getVideoConfProvider());

		await assert.rejects(() => manager.customizeUrl('test', call, user, {}), {
			name: 'VideoConfProviderNotRegistered',
			message: `The video conference provider "test" is not registered in the system.`,
		});
	});

	it('customizeUrl', async () => {
		const manager = new AppVideoConfProviderManager(mockManager);
		manager.addProvider('testing', TestData.getVideoConfProvider());
		await manager.registerProviders('testing');

		const call = TestData.getVideoConfDataExtended();
		const user = TestData.getVideoConferenceUser();

		const cases: any = [
			{
				name: 'test',
				call,
				user,
				options: {},
				runCustomizeUrl: 'test/first-call#caller',
				result: 'test/first-call#caller',
			},
			{
				name: 'test',
				call,
				user: undefined,
				options: {},
				runCustomizeUrl: 'test/first-call#',
				result: 'test/first-call#',
			},
		];

		for (const c of cases) {
			mock.method(AppVideoConfProvider.prototype, 'runCustomizeUrl', () => c.runCustomizeUrl);
			assert.strictEqual(await manager.customizeUrl(c.name, c.call, c.user, c.options), c.result);
		}
	});

	it('customizeUrlWithMultipleProvidersAvailable', async () => {
		const manager = new AppVideoConfProviderManager(mockManager);
		manager.addProvider('testing', TestData.getVideoConfProvider());
		manager.addProvider('testing', TestData.getVideoConfProvider('test2'));
		await manager.registerProviders('testing');
		manager.addProvider('secondApp', TestData.getVideoConfProvider('differentProvider'));
		await manager.registerProviders('secondApp');

		const call = TestData.getVideoConfDataExtended();
		const user = TestData.getVideoConferenceUser();

		const testProvider = (manager as any).videoConfProviders.get('testing').get('test') as AppVideoConfProvider;
		const test2Provider = (manager as any).videoConfProviders.get('testing').get('test2') as AppVideoConfProvider;
		const differentProvider = (manager as any).videoConfProviders.get('secondApp').get('differentprovider') as AppVideoConfProvider;

		mock.method(testProvider, 'runCustomizeUrl', (_call: any, user: any) => (user ? 'test/first-call#caller' : 'test/first-call#'));
		mock.method(test2Provider, 'runCustomizeUrl', (_call: any, user: any) => (user ? 'test2/first-call#caller' : 'test2/first-call#'));
		mock.method(differentProvider, 'runCustomizeUrl', (_call: any, user: any) =>
			user ? 'differentProvider/first-call#caller' : 'differentProvider/first-call#',
		);

		assert.strictEqual(await manager.customizeUrl('test', call, user, {}), 'test/first-call#caller');
		assert.strictEqual(await manager.customizeUrl('test', call, undefined, {}), 'test/first-call#');
		assert.strictEqual(await manager.customizeUrl('test2', call, user, {}), 'test2/first-call#caller');
		assert.strictEqual(await manager.customizeUrl('test2', call, undefined, {}), 'test2/first-call#');
		assert.strictEqual(await manager.customizeUrl('differentProvider', call, user, {}), 'differentProvider/first-call#caller');
		assert.strictEqual(await manager.customizeUrl('differentProvider', call, undefined, {}), 'differentProvider/first-call#');
	});

	it('failToCustomizeUrlWithUnknownProvider', async () => {
		const call = TestData.getVideoConfDataExtended();
		const user = TestData.getVideoConferenceUser();
		const manager = new AppVideoConfProviderManager(mockManager);

		await assert.rejects(() => manager.customizeUrl('unknownProvider', call, user, {}), {
			name: 'VideoConfProviderNotRegistered',
			message: `The video conference provider "unknownProvider" is not registered in the system.`,
		});
	});

	it('failToCustomizeUrlWithUnregisteredProvider', async () => {
		const call = TestData.getVideoConfDataExtended();
		const user = TestData.getVideoConferenceUser();
		const manager = new AppVideoConfProviderManager(mockManager);

		manager.addProvider('unregisteredApp', TestData.getVideoConfProvider('unregisteredProvider'));
		await assert.rejects(() => manager.customizeUrl('unregisteredProvider', call, user, {}), {
			name: 'VideoConfProviderNotRegistered',
			message: `The video conference provider "unregisteredProvider" is not registered in the system.`,
		});
	});
});
