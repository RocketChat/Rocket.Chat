import * as assert from 'node:assert';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import { AppMethod } from '../../../../src/definition/metadata';
import type { ISetting } from '../../../../src/definition/settings';
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
import { AppAccessorManager, AppSettingsManager } from '../../../../src/server/managers';
import type { UIActionButtonManager } from '../../../../src/server/managers/UIActionButtonManager';
import type { AppMetadataStorage, IAppStorageItem } from '../../../../src/server/storage';
import { TestsAppBridges } from '../../../test-data/bridges/appBridges';
import { TestData } from '../../../test-data/utilities';

describe('AppSettingsManager', () => {
	let mockStorageItem: IAppStorageItem;
	let mockApp: ProxiedApp;
	let mockBridges: AppBridges;
	let mockAccessors: AppAccessorManager;
	let mockStorage: AppMetadataStorage;
	let mockManager: AppManager;

	beforeEach(() => {
		mockStorageItem = {
			_id: 'test_underscore_id',
			settings: {},
		} as IAppStorageItem;

		mockStorageItem.settings.testing = TestData.getSetting('testing');

		const si = mockStorageItem;
		mockApp = {
			getID() {
				return 'testing';
			},
			getStorageItem() {
				return si;
			},
			setStorageItem(item: IAppStorageItem) {},
			call(method: AppMethod, ...args: Array<any>): Promise<any> {
				return Promise.resolve();
			},
		} as ProxiedApp;

		mockBridges = new TestsAppBridges();

		mockStorage = {
			updateSetting(appId: string, setting: ISetting): Promise<boolean> {
				return Promise.resolve(true);
			},
		} as AppMetadataStorage;

		const st = mockStorage;
		const bri = mockBridges;
		const app = mockApp;
		mockManager = {
			getOneById(appId: string): ProxiedApp {
				return appId === 'testing' ? app : undefined;
			},
			getBridges(): AppBridges {
				return bri;
			},
			getStorage(): AppMetadataStorage {
				return st;
			},
			getCommandManager(): AppSlashCommandManager {
				return {} as AppSlashCommandManager;
			},
			getExternalComponentManager(): AppExternalComponentManager {
				return {} as AppExternalComponentManager;
			},
			getApiManager(): AppApiManager {
				return {} as AppApiManager;
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

	it('basicAppSettingsManager', () => {
		assert.doesNotThrow(() => new AppSettingsManager(mockManager));

		const asm = new AppSettingsManager(mockManager);
		assert.notStrictEqual(asm.getAppSettings('testing'), mockStorageItem.settings);
		assert.deepStrictEqual(asm.getAppSettings('testing'), mockStorageItem.settings);
		assert.throws(() => asm.getAppSettings('fake'), { name: 'Error', message: 'No App found by the provided id.' });
		assert.throws(() => {
			asm.getAppSettings('testing').testing.value = 'testing';
		});

		assert.notStrictEqual(asm.getAppSetting('testing', 'testing'), mockStorageItem.settings.testing);
		assert.deepStrictEqual(asm.getAppSetting('testing', 'testing'), mockStorageItem.settings.testing);
		assert.throws(() => asm.getAppSetting('fake', 'testing'), { name: 'Error', message: 'No App found by the provided id.' });
		assert.throws(() => asm.getAppSetting('testing', 'fake'), { name: 'Error', message: 'No setting found for the App by the provided id.' });
		assert.throws(() => {
			asm.getAppSetting('testing', 'testing').value = 'testing';
		});
	});

	it('updatingSettingViaAppSettingsManager', async () => {
		const asm = new AppSettingsManager(mockManager);

		const updateSettingSpy = mock.method(mockStorage, 'updateSetting');
		const callSpy = mock.method(mockApp, 'call');
		const doOnAppSettingsChangeSpy = mock.method(
			(mockBridges as TestsAppBridges).getAppDetailChangesBridge(),
			'doOnAppSettingsChange',
		);

		await assert.rejects(() => asm.updateAppSetting('fake', TestData.getSetting()), {
			name: 'Error',
			message: 'No App found by the provided id.',
		});
		await assert.rejects(() => asm.updateAppSetting('testing', TestData.getSetting('fake')), {
			name: 'Error',
			message: 'No setting found for the App by the provided id.',
		});

		const set = TestData.getSetting('testing');
		await assert.doesNotReject(() => asm.updateAppSetting('testing', set));

		assert.strictEqual(updateSettingSpy.mock.calls.length, 1);
		assert.strictEqual(updateSettingSpy.mock.calls[0].arguments[0], 'test_underscore_id');
		// The second argument should match the set object
		const settingArg = updateSettingSpy.mock.calls[0].arguments[1] as any;
		assert.ok(Object.keys(set).every((k) => (settingArg as any)[k] === (set as any)[k]));

		assert.strictEqual(doOnAppSettingsChangeSpy.mock.calls.length, 1);
		assert.deepStrictEqual(doOnAppSettingsChangeSpy.mock.calls[0].arguments, ['testing', set]);

		const onsettingupdatedCalls = callSpy.mock.calls.filter((c: any) => c.arguments[0] === AppMethod.ONSETTINGUPDATED);
		assert.strictEqual(onsettingupdatedCalls.length, 1);
		assert.deepStrictEqual(onsettingupdatedCalls[0].arguments, [AppMethod.ONSETTINGUPDATED, set]);
	});
});
