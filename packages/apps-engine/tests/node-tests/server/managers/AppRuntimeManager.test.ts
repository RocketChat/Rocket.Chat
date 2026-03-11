import * as assert from 'node:assert';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import { AppStatus } from '../../../../src/definition/AppStatus';
import type { AppManager } from '../../../../src/server/AppManager';
import type { IParseAppPackageResult } from '../../../../src/server/compiler';
import { AppRuntimeManager } from '../../../../src/server/managers/AppRuntimeManager';
import { DenoRuntimeSubprocessController } from '../../../../src/server/runtime/deno/AppsEngineDenoRuntime';
import type { IRuntimeController } from '../../../../src/server/runtime/IRuntimeController';
import type { IAppStorageItem } from '../../../../src/server/storage';

describe('AppRuntimeManager', () => {
	let mockManager: AppManager;
	let runtimeManager: AppRuntimeManager;
	let mockAppPackage: IParseAppPackageResult;
	let mockStorageItem: IAppStorageItem;
	let mockSubprocessController: IRuntimeController;

	beforeEach(() => {
		mockManager = {
			getAccessorManager() {
				return {} as any;
			},
			getApiManager() {
				return {} as any;
			},
			getLogStorage() {
				return {} as any;
			},
			getBridges() {
				return {} as any;
			},
		} as AppManager;

		mockAppPackage = {
			info: {
				id: 'test-app',
				name: 'Test App',
				nameSlug: 'test-app',
				version: '1.0.0',
				description: 'Test app for unit testing',
				author: {
					name: 'Test Author',
					homepage: 'https://test.com',
					support: 'https://test.com/support',
				},
				permissions: [],
				requiredApiVersion: '1.0.0',
				classFile: 'main.js',
				iconFile: 'icon.png',
				implements: [],
			},
			files: {
				'main.js': 'console.log("Hello World");',
			},
			languageContent: {} as unknown as IParseAppPackageResult['languageContent'],
			implemented: {} as unknown as IParseAppPackageResult['implemented'],
		} as IParseAppPackageResult;

		mockStorageItem = {
			id: 'test-app',
			status: AppStatus.MANUALLY_ENABLED,
			info: mockAppPackage.info,
			createdAt: new Date(),
			updatedAt: new Date(),
		} as IAppStorageItem;

		mockSubprocessController = {
			async setupApp() {
				return Promise.resolve();
			},

			async stopApp() {
				return Promise.resolve();
			},

			getAppId() {
				return 'test-app';
			},

			async getStatus() {
				return Promise.resolve(AppStatus.MANUALLY_ENABLED);
			},

			async sendRequest() {
				return Promise.resolve(true);
			},

			on: () => mockSubprocessController,
			once: () => mockSubprocessController,
			off: () => mockSubprocessController,
			emit: () => true,
			addListener: () => mockSubprocessController,
			removeListener: () => mockSubprocessController,
			removeAllListeners: () => mockSubprocessController,
			setMaxListeners: () => mockSubprocessController,
			getMaxListeners: () => 10,
			listeners: () => [],
			rawListeners: () => [],
			listenerCount: () => 0,
			prependListener: () => mockSubprocessController,
			prependOnceListener: () => mockSubprocessController,
			eventNames: () => [],
		} as IRuntimeController;

		runtimeManager = new AppRuntimeManager(mockManager, () => mockSubprocessController as unknown as DenoRuntimeSubprocessController);
	});

	afterEach(() => {
		mock.restoreAll();
	});

	it('Starts runtime for app successfully', async () => {
		await assert.doesNotReject(() => runtimeManager.startRuntimeForApp(mockAppPackage, mockStorageItem));

		/* eslint-disable-next-line dot-notation -- We need to access the property like this for the compile not to complain */
		assert.strictEqual(runtimeManager['subprocesses'][mockAppPackage.info.id], mockSubprocessController);
	});

	it('Fails to start runtime for app that already has a runtime', async () => {
		await assert.doesNotReject(() => runtimeManager.startRuntimeForApp(mockAppPackage, mockStorageItem));

		await assert.rejects(() => runtimeManager.startRuntimeForApp(mockAppPackage, mockStorageItem), {
			name: 'Error',
			message: 'App already has an associated runtime',
		});
	});

	it('Starts multiple runtimes for app successfully with force option', async () => {
		await assert.doesNotReject(() => runtimeManager.startRuntimeForApp(mockAppPackage, mockStorageItem));

		await assert.doesNotReject(() =>
			runtimeManager.startRuntimeForApp(mockAppPackage, mockStorageItem, { force: true }),
		);

		/* eslint-disable-next-line dot-notation -- We need to access the property like this for the compile not to complain */
		assert.strictEqual(runtimeManager['subprocesses'][mockAppPackage.info.id], mockSubprocessController);
	});

	it('startRuntimeThatFailsToSetup', async () => {
		mock.method(mockSubprocessController, 'setupApp', () => Promise.reject(new Error('Nope')));

		await assert.rejects(() => runtimeManager.startRuntimeForApp(mockAppPackage, mockStorageItem), {
			name: 'Error',
			message: 'Nope',
		});

		/* eslint-disable-next-line dot-notation -- We need to access the property like this for the compile not to complain */
		assert.strictEqual(runtimeManager['subprocesses'][mockAppPackage.info.id], undefined);
	});
});
