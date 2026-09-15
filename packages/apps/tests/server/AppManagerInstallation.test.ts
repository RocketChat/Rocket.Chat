import * as assert from 'node:assert';
import { afterEach, describe, it, mock } from 'node:test';

import type { IUser } from '@rocket.chat/apps-engine/definition/users';

import { AppManager } from '../../src/server/AppManager';
import { ProxiedApp } from '../../src/server/ProxiedApp';
import type { IParseAppPackageResult } from '../../src/server/compiler';
import type { IAppStorageItem } from '../../src/server/storage';
import type { TestsUserBridge } from '../test-data/bridges/userBridge';
import { TestData, TestInfastructureSetup } from '../test-data/utilities';

const getPackageResult = (): IParseAppPackageResult =>
	({
		info: {
			id: 'test-app',
			name: 'Test App',
			nameSlug: 'test-app',
			version: '1.0.0',
			classFile: 'main.ts',
			description: 'A test app',
			requiredApiVersion: '^1.0.0',
			author: { name: 'Rocket.Chat', homepage: '', support: '' },
		},
		files: { 'main.ts': 'content' },
		languageContent: {},
		implemented: { getValues: () => ({}) },
	}) as unknown as IParseAppPackageResult;

/**
 * Builds a manager whose installation steps are all under the control of the test.
 *
 * Every step records its name in `calls`, so a test can assert the order of the rollback.
 */
const setup = () => {
	const infrastructure = new TestInfastructureSetup();
	const manager = new AppManager({
		metadataStorage: infrastructure.getAppStorage(),
		logStorage: infrastructure.getLogStorage(),
		bridges: infrastructure.getAppBridges(),
		sourceStorage: infrastructure.getSourceStorage(),
		tempFilePath: infrastructure.getTempFilePath(),
	});

	const calls: Array<string> = [];
	const sourceStorage = infrastructure.getSourceStorage();
	const userBridge = infrastructure.getAppBridges().getUserBridge() as TestsUserBridge;

	let appUser: IUser | undefined;

	mock.method(manager.getParser(), 'unpackageApp', async () => getPackageResult());

	mock.method(manager.getCompiler(), 'toSandBox', async (_manager: AppManager, storageItem: IAppStorageItem) => {
		calls.push('compile');

		return new ProxiedApp(manager, storageItem, TestData.getMockRuntimeController(storageItem.id));
	});

	mock.method(manager.getRuntime(), 'stopRuntime', async () => {
		calls.push('stop-runtime');
	});

	mock.method(sourceStorage, 'store', async () => {
		calls.push('store-package');

		return 'app_package_path';
	});

	mock.method(sourceStorage, 'remove', async () => {
		calls.push('remove-package');
	});

	mock.method(userBridge, 'getAppUser', async () => appUser);

	mock.method(userBridge, 'create', async () => {
		calls.push('create-user');
		appUser = TestData.getUser('app-user-id');

		return appUser.id;
	});

	mock.method(userBridge, 'remove', async () => {
		calls.push('remove-user');
		appUser = undefined;

		return true;
	});

	mock.method(manager.getSignatureManager(), 'signApp', async () => 'signature');

	return {
		manager,
		calls,
		sourceStorage,
		userBridge,
		setAppUser: (user: IUser | undefined) => {
			appUser = user;
		},
	};
};

const install = (manager: AppManager) => manager.add(Buffer.from('package'), { enable: false, user: TestData.getUser() });

describe('AppManager installation rollback', () => {
	afterEach(() => {
		AppManager.Instance = undefined;
		mock.restoreAll();
	});

	it('writes nothing outside of the process when the compilation fails', async () => {
		const { manager, calls } = setup();

		mock.method(manager.getCompiler(), 'toSandBox', async () => {
			throw new Error('Invalid App package');
		});

		await assert.rejects(() => install(manager), { message: 'Invalid App package' });

		assert.deepStrictEqual(calls, []);
	});

	it('stops the runtime when it can not store the package', async () => {
		const { manager, calls, sourceStorage } = setup();

		mock.method(sourceStorage, 'store', async () => {
			throw new Error('No space left on device');
		});

		const aff = await install(manager);

		assert.strictEqual(aff.getStorageError(), 'Failed to store app package');
		assert.deepStrictEqual(calls, ['compile', 'stop-runtime']);
	});

	it('reverts the package and the runtime when it can not create the app user', async () => {
		const { manager, calls, userBridge } = setup();

		mock.method(userBridge, 'create', async () => {
			throw new Error('Username is taken');
		});

		const aff = await install(manager);

		assert.deepStrictEqual(aff.getAppUserError(), {
			username: 'test-app.bot',
			message: 'Failed to create an app user for this app.',
		});
		assert.deepStrictEqual(calls, ['compile', 'store-package', 'remove-package', 'stop-runtime']);
	});

	it('reverts every step in reverse order when the metadata storage returns nothing', async () => {
		const { manager, calls } = setup();

		mock.method(manager.getStorage(), 'create', async () => undefined);

		const aff = await install(manager);

		assert.strictEqual(aff.getStorageError(), 'Failed to create the App, the storage did not return it.');
		assert.deepStrictEqual(calls, ['compile', 'store-package', 'create-user', 'remove-user', 'remove-package', 'stop-runtime']);
	});

	it('keeps an app user that it did not create', async () => {
		const { manager, calls, setAppUser } = setup();

		setAppUser(TestData.getUser('previous-app-user'));
		mock.method(manager.getStorage(), 'create', async () => undefined);

		const aff = await install(manager);

		assert.strictEqual(aff.getStorageError(), 'Failed to create the App, the storage did not return it.');
		assert.deepStrictEqual(calls, ['compile', 'store-package', 'remove-package', 'stop-runtime']);
	});

	it('runs the remaining steps when one step fails, and keeps the original result', async () => {
		const { manager, calls, sourceStorage } = setup();

		mock.method(sourceStorage, 'remove', async () => {
			calls.push('remove-package');

			throw new Error('The file storage is down');
		});
		const consoleError = mock.method(console, 'error', () => undefined);
		mock.method(manager.getStorage(), 'create', async () => undefined);

		const aff = await install(manager);

		assert.strictEqual(aff.getStorageError(), 'Failed to create the App, the storage did not return it.');
		assert.deepStrictEqual(calls, ['compile', 'store-package', 'create-user', 'remove-user', 'remove-package', 'stop-runtime']);
		assert.strictEqual(consoleError.mock.callCount(), 1);

		const [reported] = consoleError.mock.calls[0].arguments as [AggregateError];
		assert.ok(reported instanceof AggregateError);
		assert.strictEqual(reported.errors.length, 1);
		assert.strictEqual(reported.errors[0].message, 'Rollback step "remove the app package" failed');
	});

	it('reverts nothing after the metadata record exists', async () => {
		const { manager, calls } = setup();

		mock.method(manager.getCompiler(), 'toSandBox', async (_manager: AppManager, storageItem: IAppStorageItem) => {
			calls.push('compile');

			const app = new ProxiedApp(manager, storageItem, TestData.getMockRuntimeController(storageItem.id));

			mock.method(app, 'call', async () => true);
			mock.method(app, 'setStatus', async () => undefined);
			mock.method(app, 'validateLicense', async () => undefined);
			mock.method(app, 'validateInstallation', async () => undefined);

			return app;
		});

		const aff = await install(manager);

		assert.strictEqual(aff.getStorageError(), undefined);
		assert.strictEqual(aff.getApp().getID(), 'test-app');
		assert.deepStrictEqual(calls, ['compile', 'store-package', 'create-user']);
	});
});

describe('AppManager app user creation', () => {
	afterEach(() => {
		AppManager.Instance = undefined;
		mock.restoreAll();
	});

	it('reports that it created the app user', async () => {
		const { manager, userBridge } = setup();

		const created = mock.method(userBridge, 'create', async () => 'app-user-id');

		// createAppUser is private, and only the installation flow exposes its report
		const result = await (
			manager as unknown as { createAppUser: (info: unknown) => Promise<{ id: string; created: boolean }> }
		).createAppUser(getPackageResult().info);

		assert.deepStrictEqual(result, { id: 'app-user-id', created: true });
		assert.strictEqual(created.mock.callCount(), 1);
	});

	it('reports that the app user already existed', async () => {
		const { manager, userBridge, setAppUser } = setup();

		setAppUser(TestData.getUser('previous-app-user'));
		const created = mock.method(userBridge, 'create');

		const result = await (
			manager as unknown as { createAppUser: (info: unknown) => Promise<{ id: string; created: boolean }> }
		).createAppUser(getPackageResult().info);

		assert.deepStrictEqual(result, { id: 'previous-app-user', created: false });
		assert.strictEqual(created.mock.callCount(), 0);
	});
});
