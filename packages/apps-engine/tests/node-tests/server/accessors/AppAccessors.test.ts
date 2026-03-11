import * as assert from 'node:assert';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import type { AppOutboundCommunicationProviderManager } from '../../../../src/server/managers/AppOutboundCommunicationProviderManager';
import { AppStatus } from '../../../../src/definition/AppStatus';
import type { AppMethod } from '../../../../src/definition/metadata';
import type { AppManager } from '../../../../src/server/AppManager';
import type { ProxiedApp } from '../../../../src/server/ProxiedApp';
import { AppAccessors } from '../../../../src/server/accessors';
import type { AppBridges } from '../../../../src/server/bridges';
import { AppConsole } from '../../../../src/server/logging';
import type {
	AppExternalComponentManager,
	AppSchedulerManager,
	AppSettingsManager,
	AppSlashCommandManager,
	AppVideoConfProviderManager,
} from '../../../../src/server/managers';
import { AppAccessorManager, AppApiManager } from '../../../../src/server/managers';
import type { UIActionButtonManager } from '../../../../src/server/managers/UIActionButtonManager';
import type { AppsEngineRuntime } from '../../../../src/server/runtime/AppsEngineRuntime';
import type { AppLogStorage } from '../../../../src/server/storage';
import { TestsAppBridges } from '../../../test-data/bridges/appBridges';
import { TestsAppLogStorage } from '../../../test-data/storage/logStorage';
import { TestData } from '../../../test-data/utilities';

describe('AppAccessors', () => {
	let mockBridges: TestsAppBridges;
	let mockApp: ProxiedApp;
	let mockAccessors: AppAccessorManager;
	let mockManager: AppManager;
	let mockApiManager: AppApiManager;

	beforeEach(() => {
		mockBridges = new TestsAppBridges();

		mockApp = {
			getRuntime() {
				return {} as AppsEngineRuntime;
			},
			getID() {
				return 'testing';
			},
			getStatus() {
				return Promise.resolve(AppStatus.AUTO_ENABLED);
			},
			setupLogger(method: AppMethod): AppConsole {
				return new AppConsole(method);
			},
		} as ProxiedApp;

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
			getSettingsManager() {
				return {} as AppSettingsManager;
			},
			getOutboundCommunicationProviderManager() {
				return {} as AppOutboundCommunicationProviderManager;
			},
		} as unknown as AppManager;

		mockAccessors = new AppAccessorManager(mockManager);
		const ac = mockAccessors;
		mockManager.getAccessorManager = function _getAccessorManager(): AppAccessorManager {
			return ac;
		};

		mockApiManager = new AppApiManager(mockManager);
		const apiManager = mockApiManager;
		mockManager.getApiManager = function _getApiManager(): AppApiManager {
			return apiManager;
		};
	});

	afterEach(() => {
		mock.restoreAll();
	});

	it('testAppAccessor', () => {
		assert.throws(() => new AppAccessors({} as AppManager, ''));
		assert.doesNotThrow(() => new AppAccessors(mockManager, 'testing'));

		const appAccessors = new AppAccessors(mockManager, 'testing');

		assert.deepStrictEqual(appAccessors.environmentReader, mockAccessors.getEnvironmentRead('testing'));
		assert.deepStrictEqual(appAccessors.environmentWriter, mockAccessors.getEnvironmentWrite('testing'));
		assert.deepStrictEqual(appAccessors.reader, mockAccessors.getReader('testing'));
		assert.deepStrictEqual(appAccessors.http, mockAccessors.getHttp('testing'));
		assert.deepStrictEqual(appAccessors.providedApiEndpoints, mockApiManager.listApis('testing'));

		mockApiManager.addApi('testing', TestData.getApi('app-accessor-api'));

		assert.deepStrictEqual(appAccessors.providedApiEndpoints, mockApiManager.listApis('testing'));
	});
});
