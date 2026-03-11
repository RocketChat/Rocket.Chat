import * as assert from 'node:assert';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import { RequestMethod } from '../../../../src/definition/accessors';
import type { IApi, IApiRequest } from '../../../../src/definition/api';
import type { AppManager } from '../../../../src/server/AppManager';
import type { ProxiedApp } from '../../../../src/server/ProxiedApp';
import type { AppBridges } from '../../../../src/server/bridges';
import type {
	AppExternalComponentManager,
	AppSchedulerManager,
	AppSlashCommandManager,
	AppVideoConfProviderManager,
} from '../../../../src/server/managers';
import { AppAccessorManager, AppApiManager } from '../../../../src/server/managers';
import { AppApi } from '../../../../src/server/managers/AppApi';
import type { UIActionButtonManager } from '../../../../src/server/managers/UIActionButtonManager';
import type { AppLogStorage, IAppStorageItem } from '../../../../src/server/storage';
import { TestsAppBridges } from '../../../test-data/bridges/appBridges';
import { TestsAppLogStorage } from '../../../test-data/storage/logStorage';
import { TestData } from '../../../test-data/utilities';

describe('AppApiManager', () => {
	let mockBridges: TestsAppBridges;
	let mockApp: ProxiedApp;
	let mockAccessors: AppAccessorManager;
	let mockManager: AppManager;

	beforeEach(() => {
		mockBridges = new TestsAppBridges();

		mockApp = TestData.getMockApp({ info: { id: 'testing', name: 'TestApp' } } as IAppStorageItem, {} as AppManager);

		const bri = mockBridges;
		const app = mockApp;
		mockManager = {
			getBridges(): AppBridges {
				return bri;
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

	it('basicAppApiManager', () => {
		assert.throws(() => new AppApiManager({} as AppManager));
		assert.doesNotThrow(() => new AppApiManager(mockManager));

		const ascm = new AppApiManager(mockManager);
		assert.strictEqual((ascm as any).manager, mockManager);
		assert.strictEqual((ascm as any).bridge, mockBridges.getApiBridge());
		assert.strictEqual((ascm as any).accessors, mockManager.getAccessorManager());
		assert.ok((ascm as any).providedApis !== undefined);
		assert.strictEqual((ascm as any).providedApis.size, 0);
	});

	it('registerApi', async () => {
		const doRegisterApiSpy = mock.method(mockBridges.getApiBridge(), 'doRegisterApi');
		const ascm = new AppApiManager(mockManager);

		const api: IApi = TestData.getApi('path');
		const regInfo = new AppApi(mockApp, api, api.endpoints[0]);

		await assert.doesNotReject(() => (ascm as any).registerApi('testing', regInfo));
		assert.strictEqual(doRegisterApiSpy.mock.calls.length, 1);
		assert.deepStrictEqual(doRegisterApiSpy.mock.calls[0].arguments, [regInfo, 'testing']);
	});

	it('addApi', () => {
		mockBridges = new TestsAppBridges();
		const bri = mockBridges;
		mockManager.getBridges = function _refreshedGetBridges(): AppBridges {
			return bri;
		};

		const doRegisterApiSpy = mock.method(mockBridges.getApiBridge(), 'doRegisterApi');
		void doRegisterApiSpy;

		const api = TestData.getApi('apipath');
		const ascm = new AppApiManager(mockManager);
		assert.doesNotThrow(() => ascm.addApi('testing', api));
		assert.strictEqual(mockBridges.getApiBridge().apis.size, 1);
		assert.strictEqual((ascm as any).providedApis.size, 1);
		assert.strictEqual((ascm as any).providedApis.get('testing').get('apipath').api, api);

		assert.throws(() => ascm.addApi('testing', api), {
			name: 'PathAlreadyExists',
			message: 'The api path "apipath" already exists in the system.',
		});

		assert.throws(() => ascm.addApi('failMePlease', TestData.getApi('yet-another')), {
			name: 'Error',
			message: 'App must exist in order for an api to be added.',
		});
		assert.doesNotThrow(() => ascm.addApi('testing', TestData.getApi('another-api')));
		assert.strictEqual((ascm as any).providedApis.size, 1);
		assert.strictEqual((ascm as any).providedApis.get('testing').size, 2);
	});

	it('registerApis', async () => {
		mockBridges = new TestsAppBridges();
		const bri = mockBridges;
		mockManager.getBridges = function _refreshedGetBridges(): AppBridges {
			return bri;
		};
		const doRegisterApiSpy = mock.method(mockBridges.getApiBridge(), 'doRegisterApi');

		const ascm = new AppApiManager(mockManager);

		const registerApiSpy = mock.method(ascm as any, 'registerApi');

		ascm.addApi('testing', TestData.getApi('apipath'));
		const regInfo = (ascm as any).providedApis.get('testing').get('apipath') as AppApi;

		await assert.doesNotReject(() => ascm.registerApis('non-existant'));
		await assert.doesNotReject(() => ascm.registerApis('testing'));
		assert.strictEqual(registerApiSpy.mock.calls.filter((c: any) => c.arguments[0] === 'testing' && c.arguments[1] === regInfo).length, 1);
		assert.strictEqual(doRegisterApiSpy.mock.calls.filter((c: any) => c.arguments[0] === regInfo && c.arguments[1] === 'testing').length, 1);
	});

	it('unregisterApis', async () => {
		mockBridges = new TestsAppBridges();
		const bri = mockBridges;
		mockManager.getBridges = function _refreshedGetBridges(): AppBridges {
			return bri;
		};
		const doUnregisterApisSpy = mock.method(mockBridges.getApiBridge(), 'doUnregisterApis');

		const ascm = new AppApiManager(mockManager);

		ascm.addApi('testing', TestData.getApi('apipath'));

		await assert.doesNotReject(() => ascm.unregisterApis('non-existant'));
		await assert.doesNotReject(() => ascm.unregisterApis('testing'));
		assert.strictEqual(doUnregisterApisSpy.mock.calls.length, 1);
	});

	it('executeApis', async () => {
		mockBridges = new TestsAppBridges();
		const bri = mockBridges;
		mockManager.getBridges = function _refreshedGetBridges(): AppBridges {
			return bri;
		};

		const ascm = new AppApiManager(mockManager);
		ascm.addApi('testing', TestData.getApi('api1'));
		ascm.addApi('testing', TestData.getApi('api2'));
		ascm.addApi('testing', TestData.getApi('api3'));
		ascm.registerApis('testing');

		const request: IApiRequest = {
			method: RequestMethod.GET,
			headers: {},
			query: {},
			params: {},
			content: '',
		};

		await assert.doesNotReject(() => ascm.executeApi('testing', 'nope', request));
		await assert.doesNotReject(() => ascm.executeApi('testing', 'not-exists', request));
		await assert.doesNotReject(() => ascm.executeApi('testing', 'api1', request));
		await assert.doesNotReject(() => ascm.executeApi('testing', 'api2', request));
		await assert.doesNotReject(() => ascm.executeApi('testing', 'api3', request));
	});

	it('listApis', () => {
		mockBridges = new TestsAppBridges();
		const bri = mockBridges;
		mockManager.getBridges = function _refreshedGetBridges(): AppBridges {
			return bri;
		};

		const ascm = new AppApiManager(mockManager);

		assert.deepStrictEqual(ascm.listApis('testing'), []);

		ascm.addApi('testing', TestData.getApi('api1'));
		ascm.registerApis('testing');

		assert.doesNotThrow(() => ascm.listApis('testing'));
		assert.notDeepStrictEqual(ascm.listApis('testing'), []);
		assert.deepStrictEqual(ascm.listApis('testing'), [
			{
				path: 'api1',
				computedPath: '/api/apps/public/testing/api1',
				methods: ['get'],
				examples: {},
			},
		]);
	});
});
