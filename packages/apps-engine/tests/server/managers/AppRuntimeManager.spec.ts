import { AsyncTest, Expect, Setup, SetupFixture, SpyOn } from 'alsatian';

import { AppStatus } from '../../../src/definition/AppStatus';
import type { AppManager } from '../../../src/server/AppManager';
import type { IParseAppPackageResult } from '../../../src/server/compiler';
import { AppRuntimeManager } from '../../../src/server/managers/AppRuntimeManager';
import type { IRuntimeController } from '../../../src/server/runtime/IRuntimeController';
import type { IAppStorageItem } from '../../../src/server/storage';

export class AppRuntimeManagerTestFixture {
	private mockManager: AppManager;

	private runtimeManager: AppRuntimeManager;

	private mockAppPackage: IParseAppPackageResult;

	private mockStorageItem: IAppStorageItem;

	private mockSubprocessController: IRuntimeController;

	@SetupFixture
	public setupFixture() {
		this.mockManager = {
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

		this.mockAppPackage = {
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

		this.mockStorageItem = {
			id: 'test-app',
			status: AppStatus.MANUALLY_ENABLED,
			info: this.mockAppPackage.info,
			createdAt: new Date(),
			updatedAt: new Date(),
		} as IAppStorageItem;

		this.mockSubprocessController = {
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

			on: () => this.mockSubprocessController,
			once: () => this.mockSubprocessController,
			off: () => this.mockSubprocessController,
			emit: () => true,
			addListener: () => this.mockSubprocessController,
			removeListener: () => this.mockSubprocessController,
			removeAllListeners: () => this.mockSubprocessController,
			setMaxListeners: () => this.mockSubprocessController,
			getMaxListeners: () => 10,
			listeners: () => [],
			rawListeners: () => [],
			listenerCount: () => 0,
			prependListener: () => this.mockSubprocessController,
			prependOnceListener: () => this.mockSubprocessController,
			eventNames: () => [],
		} as IRuntimeController;
	}

	@Setup
	public setup() {
		this.runtimeManager = new AppRuntimeManager(this.mockManager, () => this.mockSubprocessController);
	}

	@AsyncTest('Starts runtime for app successfully')
	public async startRuntimeForAppSuccessfully() {
		await Expect(() => this.runtimeManager.startRuntimeForApp(this.mockAppPackage, this.mockStorageItem)).not.toThrowAsync();

		/* eslint-disable-next-line dot-notation -- We need to access the property like this for the compile not to complain */
		Expect(this.runtimeManager['subprocesses'][this.mockAppPackage.info.id]).toBe(this.mockSubprocessController);
	}

	@AsyncTest('Fails to start runtime for app that already has a runtime')
	public async startMultipleRuntimesForSameApp() {
		await Expect(() => this.runtimeManager.startRuntimeForApp(this.mockAppPackage, this.mockStorageItem)).not.toThrowAsync();

		await Expect(() => this.runtimeManager.startRuntimeForApp(this.mockAppPackage, this.mockStorageItem)).toThrowErrorAsync(
			Error,
			'App already has an associated runtime',
		);
	}

	@AsyncTest('Starts multiple runtimes for app successfully with force option')
	public async startMultipleRuntimesForSameAppWithForceOption() {
		await Expect(() => this.runtimeManager.startRuntimeForApp(this.mockAppPackage, this.mockStorageItem)).not.toThrowAsync();

		await Expect(() =>
			this.runtimeManager.startRuntimeForApp(this.mockAppPackage, this.mockStorageItem, { force: true }),
		).not.toThrowAsync();

		/* eslint-disable-next-line dot-notation -- We need to access the property like this for the compile not to complain */
		Expect(this.runtimeManager['subprocesses'][this.mockAppPackage.info.id]).toBe(this.mockSubprocessController);
	}

	@AsyncTest()
	public async startRuntimeThatFailsToSetup() {
		SpyOn(this.mockSubprocessController, 'setupApp').andReturn(Promise.reject(new Error('Nope')));

		await Expect(() => this.runtimeManager.startRuntimeForApp(this.mockAppPackage, this.mockStorageItem)).toThrowErrorAsync(Error, 'Nope');

		/* eslint-disable-next-line dot-notation -- We need to access the property like this for the compile not to complain */
		Expect(this.runtimeManager['subprocesses'][this.mockAppPackage.info.id]).not.toBeDefined();
	}
}
