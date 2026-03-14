import * as assert from 'node:assert';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import type { AppManager } from '../../../../src/server/AppManager';
import type { ProxiedApp } from '../../../../src/server/ProxiedApp';
import type { AppBridges } from '../../../../src/server/bridges';
import type { AppApiManager, AppExternalComponentManager, AppSchedulerManager, AppSlashCommandManager } from '../../../../src/server/managers';
import { AppAccessorManager, AppVideoConfProviderManager } from '../../../../src/server/managers';
import { AppVideoConfProvider } from '../../../../src/server/managers/AppVideoConfProvider';
import type { UIActionButtonManager } from '../../../../src/server/managers/UIActionButtonManager';
import type { AppLogStorage, IAppStorageItem } from '../../../../src/server/storage';
import { TestsAppBridges } from '../../../test-data/bridges/appBridges';
import { TestsAppLogStorage } from '../../../test-data/storage/logStorage';
import { TestData } from '../../../test-data/utilities';

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

	it('ignoreAppsWithoutProviders', () => {
		const manager = new AppVideoConfProviderManager(mockManager);

		assert.doesNotThrow(() => manager.registerProviders('non-existant'));
	});

	it('registerProviders', () => {
		const manager = new AppVideoConfProviderManager(mockManager);

		manager.addProvider('firstApp', TestData.getVideoConfProvider());
		const appInfo = (manager as any).videoConfProviders.get('firstApp') as Map<string, AppVideoConfProvider>;
		assert.ok(appInfo !== undefined);
		const regInfo = appInfo.get('test');
		assert.ok(regInfo !== undefined);

		assert.strictEqual(regInfo.isRegistered, false);
		assert.doesNotThrow(() => manager.registerProviders('firstApp'));
		assert.strictEqual(regInfo.isRegistered, true);
	});

	it('registerTwoProviders', () => {
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
		assert.doesNotThrow(() => manager.registerProviders('firstApp'));
		assert.strictEqual(firstRegInfo.isRegistered, true);
		assert.strictEqual(secondRegInfo.isRegistered, true);
	});

	it('registerProvidersFromMultipleApps', () => {
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
		assert.doesNotThrow(() => manager.registerProviders('firstApp'));
		assert.strictEqual(firstRegInfo.isRegistered, true);
		assert.strictEqual(secondRegInfo.isRegistered, true);
		assert.strictEqual(thirdRegInfo.isRegistered, false);
		assert.doesNotThrow(() => manager.registerProviders('secondApp'));
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

	it('unregisterProviders', () => {
		const manager = new AppVideoConfProviderManager(mockManager);

		manager.addProvider('testing', TestData.getVideoConfProvider());
		const regInfo = (manager as any).videoConfProviders.get('testing').get('test') as AppVideoConfProvider;
		assert.doesNotThrow(() => manager.registerProviders('testing'));

		assert.doesNotThrow(() => manager.unregisterProviders('non-existant'));
		assert.strictEqual(regInfo.isRegistered, true);
		assert.doesNotThrow(() => manager.unregisterProviders('testing'));
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
		manager.registerProviders('testing');

		const call = TestData.getVideoConfData();

		mock.method(AppVideoConfProvider.prototype, 'runGenerateUrl', () => 'test/first-call');
		const url = await manager.generateUrl('test', call);
		assert.strictEqual(url, 'test/first-call');
	});

	it('generateUrlWithMultipleProvidersAvailable', async () => {
		const manager = new AppVideoConfProviderManager(mockManager);
		manager.addProvider('testing', TestData.getVideoConfProvider());
		manager.addProvider('testing', TestData.getVideoConfProvider('test2'));
		manager.registerProviders('testing');
		manager.addProvider('secondApp', TestData.getVideoConfProvider('differentProvider'));
		manager.registerProviders('secondApp');

		const call = TestData.getVideoConfData();

		const cases: any = [
			{
				name: 'test',
				call,
				runGenerateUrl: 'test/first-call',
				result: 'test/first-call',
			},
			{
				name: 'test2',
				call,
				runGenerateUrl: 'test2/first-call',
				result: 'test2/first-call',
			},
			{
				name: 'differentProvider',
				call,
				runGenerateUrl: 'differentProvider/first-call',
				result: 'differentProvider/first-call',
			},
		];

		for (const c of cases) {
			mock.method(AppVideoConfProvider.prototype, 'runGenerateUrl', () => c.runGenerateUrl);
			assert.strictEqual(await manager.generateUrl(c.name, c.call), c.result);
		}
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
		manager.registerProviders('testing');

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
		manager.registerProviders('testing');
		manager.addProvider('secondApp', TestData.getVideoConfProvider('differentProvider'));
		manager.registerProviders('secondApp');

		const call = TestData.getVideoConfDataExtended();
		const user = TestData.getVideoConferenceUser();

		const cases = [
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
			{
				name: 'test2',
				call,
				user,
				options: {},
				runCustomizeUrl: 'test2/first-call#caller',
				result: 'test2/first-call#caller',
			},
			{
				name: 'test2',
				call,
				user: undefined,
				options: {},
				runCustomizeUrl: 'test2/first-call#',
				result: 'test2/first-call#',
			},
			{
				name: 'differentProvider',
				call,
				user,
				options: {},
				runCustomizeUrl: 'differentProvider/first-call#caller',
				result: 'differentProvider/first-call#caller',
			},
			{
				name: 'differentProvider',
				call,
				user: undefined,
				options: {},
				runCustomizeUrl: 'differentProvider/first-call#',
				result: 'differentProvider/first-call#',
			},
		];

		for (const c of cases) {
			mock.method(AppVideoConfProvider.prototype, 'runCustomizeUrl', () => c.runCustomizeUrl);
			assert.strictEqual(await manager.customizeUrl(c.name, c.call, c.user, c.options), c.result);
		}
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
