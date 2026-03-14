import * as assert from 'node:assert';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import { AppStatus } from '../../../../src/definition/AppStatus';
import type { IUIActionButtonDescriptor } from '../../../../src/definition/ui';
import { UIActionButtonContext } from '../../../../src/definition/ui';
import type { AppManager } from '../../../../src/server/AppManager';
import type { ProxiedApp } from '../../../../src/server/ProxiedApp';
import type { AppActivationBridge, AppBridges } from '../../../../src/server/bridges';
import { AppPermissionManager } from '../../../../src/server/managers/AppPermissionManager';
import { UIActionButtonManager } from '../../../../src/server/managers/UIActionButtonManager';
import { AppPermissions } from '../../../../src/server/permissions/AppPermissions';
import { TestsAppBridges } from '../../../test-data/bridges/appBridges';

describe('UIActionButtonManager', () => {
	let mockBridges: TestsAppBridges;
	let mockApp: ProxiedApp;
	let mockApp2: ProxiedApp;
	let mockManager: AppManager;
	let mockActivationBridge: AppActivationBridge;
	let hasPermissionSpy: ReturnType<typeof mock.method>;
	let notifyAboutErrorSpy: ReturnType<typeof mock.method>;
	let doActionsChangedSpy: ReturnType<typeof mock.method>;

	beforeEach(() => {
		mockBridges = new TestsAppBridges();
		mockActivationBridge = mockBridges.getAppActivationBridge();

		mockApp = {
			getID() {
				return 'testing-app';
			},
			getName() {
				return 'Test App';
			},
			getStatus() {
				return Promise.resolve(AppStatus.AUTO_ENABLED);
			},
		} as ProxiedApp;

		mockApp2 = {
			getID() {
				return 'testing-app-2';
			},
			getName() {
				return 'Test App 2';
			},
			getStatus() {
				return Promise.resolve(AppStatus.AUTO_ENABLED);
			},
		} as ProxiedApp;

		const bri = mockBridges;
		const app = mockApp;
		const app2 = mockApp2;
		mockManager = {
			getBridges(): AppBridges {
				return bri;
			},
			getOneById: (appId: string): ProxiedApp | undefined => {
				if (appId === 'testing-app') {
					return app;
				}
				if (appId === 'testing-app-2') {
					return app2;
				}
				return undefined;
			},
		} as AppManager;

		notifyAboutErrorSpy = mock.method(AppPermissionManager, 'notifyAboutError');
		hasPermissionSpy = mock.method(AppPermissionManager, 'hasPermission');
		doActionsChangedSpy = mock.method(mockActivationBridge, 'doActionsChanged');
	});

	afterEach(() => {
		mock.restoreAll();
	});

	it('basicUIActionButtonManager', () => {
		assert.doesNotThrow(() => new UIActionButtonManager(mockManager));

		const manager = new UIActionButtonManager(mockManager);
		assert.strictEqual((manager as any).manager, mockManager);
		assert.strictEqual((manager as any).activationBridge, mockActivationBridge);
		assert.ok((manager as any).registeredActionButtons !== undefined);
		assert.strictEqual((manager as any).registeredActionButtons.size, 0);
	});

	it('registerActionButtonWithPermission', () => {
		hasPermissionSpy.mock.mockImplementation(() => true);

		const manager = new UIActionButtonManager(mockManager);
		const button: IUIActionButtonDescriptor = {
			actionId: 'test-action',
			context: UIActionButtonContext.MESSAGE_ACTION,
			labelI18n: 'test.label',
		};

		const result = manager.registerActionButton('testing-app', button);

		assert.strictEqual(result, true);
		assert.strictEqual(hasPermissionSpy.mock.calls.length, 1);
		assert.deepStrictEqual(hasPermissionSpy.mock.calls[0].arguments, ['testing-app', AppPermissions.ui.registerButtons]);
		assert.ok(doActionsChangedSpy.mock.calls.length > 0);
		assert.strictEqual((manager as any).registeredActionButtons.size, 1);
		assert.strictEqual((manager as any).registeredActionButtons.get('testing-app').size, 1);
		assert.strictEqual((manager as any).registeredActionButtons.get('testing-app').get('test-action'), button);
	});

	it('registerActionButtonWithoutPermission', () => {
		hasPermissionSpy.mock.mockImplementation(() => false);
		notifyAboutErrorSpy.mock.mockImplementation(() => {});

		const manager = new UIActionButtonManager(mockManager);
		const button: IUIActionButtonDescriptor = {
			actionId: 'test-action',
			context: UIActionButtonContext.MESSAGE_ACTION,
			labelI18n: 'test.label',
		};

		const result = manager.registerActionButton('testing-app', button);

		assert.strictEqual(result, false);
		assert.strictEqual(hasPermissionSpy.mock.calls.length, 1);
		assert.deepStrictEqual(hasPermissionSpy.mock.calls[0].arguments, ['testing-app', AppPermissions.ui.registerButtons]);
		assert.ok(notifyAboutErrorSpy.mock.calls.length > 0);
		assert.strictEqual(doActionsChangedSpy.mock.calls.length, 0);
		assert.strictEqual((manager as any).registeredActionButtons.size, 0);
	});

	it('registerMultipleButtonsForSameApp', () => {
		hasPermissionSpy.mock.mockImplementation(() => true);

		const manager = new UIActionButtonManager(mockManager);
		const button1: IUIActionButtonDescriptor = {
			actionId: 'action-1',
			context: UIActionButtonContext.MESSAGE_ACTION,
			labelI18n: 'test.label1',
		};
		const button2: IUIActionButtonDescriptor = {
			actionId: 'action-2',
			context: UIActionButtonContext.ROOM_ACTION,
			labelI18n: 'test.label2',
		};

		manager.registerActionButton('testing-app', button1);
		manager.registerActionButton('testing-app', button2);

		assert.strictEqual((manager as any).registeredActionButtons.size, 1);
		assert.strictEqual((manager as any).registeredActionButtons.get('testing-app').size, 2);
		assert.strictEqual((manager as any).registeredActionButtons.get('testing-app').get('action-1'), button1);
		assert.strictEqual((manager as any).registeredActionButtons.get('testing-app').get('action-2'), button2);
	});

	it('clearAppActionButtons', () => {
		hasPermissionSpy.mock.mockImplementation(() => true);

		const manager = new UIActionButtonManager(mockManager);
		const button: IUIActionButtonDescriptor = {
			actionId: 'test-action',
			context: UIActionButtonContext.MESSAGE_ACTION,
			labelI18n: 'test.label',
		};

		manager.registerActionButton('testing-app', button);
		assert.strictEqual((manager as any).registeredActionButtons.get('testing-app').size, 1);

		manager.clearAppActionButtons('testing-app');

		assert.strictEqual((manager as any).registeredActionButtons.get('testing-app').size, 0);
		assert.strictEqual(doActionsChangedSpy.mock.calls.length, 2);
	});

	it('getAppActionButtons', () => {
		hasPermissionSpy.mock.mockImplementation(() => true);

		const manager = new UIActionButtonManager(mockManager);
		const button: IUIActionButtonDescriptor = {
			actionId: 'test-action',
			context: UIActionButtonContext.MESSAGE_ACTION,
			labelI18n: 'test.label',
		};

		manager.registerActionButton('testing-app', button);

		const buttons = manager.getAppActionButtons('testing-app');
		assert.ok(buttons !== undefined);
		assert.strictEqual(buttons?.size, 1);
		assert.strictEqual(buttons?.get('test-action'), button);

		const nonExistentButtons = manager.getAppActionButtons('non-existent');
		assert.strictEqual(nonExistentButtons, undefined);
	});

	it('getAllActionButtonsFromEnabledApp', async () => {
		hasPermissionSpy.mock.mockImplementation(() => true);

		mock.method(mockApp, 'getStatus', () => Promise.resolve(AppStatus.AUTO_ENABLED));

		const manager = new UIActionButtonManager(mockManager);
		const button: IUIActionButtonDescriptor = {
			actionId: 'test-action',
			context: UIActionButtonContext.MESSAGE_ACTION,
			labelI18n: 'test.label',
		};

		manager.registerActionButton('testing-app', button);

		const allButtons = await manager.getAllActionButtons();

		assert.ok(allButtons !== undefined);
		assert.strictEqual(allButtons.length, 1);
		assert.strictEqual(allButtons[0].actionId, 'test-action');
		assert.strictEqual(allButtons[0].appId, 'testing-app');
		assert.strictEqual(allButtons[0].context, UIActionButtonContext.MESSAGE_ACTION);
		assert.strictEqual(allButtons[0].labelI18n, 'test.label');
	});

	it('getAllActionButtonsFromDisabledApp', async () => {
		hasPermissionSpy.mock.mockImplementation(() => true);

		mock.method(mockApp, 'getStatus', () => Promise.resolve(AppStatus.DISABLED));

		const manager = new UIActionButtonManager(mockManager);
		const button: IUIActionButtonDescriptor = {
			actionId: 'test-action',
			context: UIActionButtonContext.MESSAGE_ACTION,
			labelI18n: 'test.label',
		};

		manager.registerActionButton('testing-app', button);

		const allButtons = await manager.getAllActionButtons();

		assert.ok(allButtons !== undefined);
		assert.strictEqual(allButtons.length, 0);
	});

	it('getAllActionButtonsFromNonExistentApp', async () => {
		hasPermissionSpy.mock.mockImplementation(() => true);

		const manager = new UIActionButtonManager(mockManager);
		const button: IUIActionButtonDescriptor = {
			actionId: 'test-action',
			context: UIActionButtonContext.MESSAGE_ACTION,
			labelI18n: 'test.label',
		};

		manager.registerActionButton('non-existent-app', button);

		const allButtons = await manager.getAllActionButtons();

		assert.ok(allButtons !== undefined);
		assert.strictEqual(allButtons.length, 0);
	});

	it('getAllActionButtonsWithStatusError', async () => {
		hasPermissionSpy.mock.mockImplementation(() => true);

		mock.method(mockApp, 'getStatus', () => Promise.reject(new Error('Status error')));

		const manager = new UIActionButtonManager(mockManager);
		const button: IUIActionButtonDescriptor = {
			actionId: 'test-action',
			context: UIActionButtonContext.MESSAGE_ACTION,
			labelI18n: 'test.label',
		};

		manager.registerActionButton('testing-app', button);

		const allButtons = await manager.getAllActionButtons();

		assert.ok(allButtons !== undefined);
		assert.strictEqual(allButtons.length, 0);
	});

	it('getAllActionButtonsFromMultipleApps', async () => {
		hasPermissionSpy.mock.mockImplementation(() => true);

		const button1: IUIActionButtonDescriptor = {
			actionId: 'action-1',
			context: UIActionButtonContext.MESSAGE_ACTION,
			labelI18n: 'test.label1',
		};
		const button2: IUIActionButtonDescriptor = {
			actionId: 'action-2',
			context: UIActionButtonContext.ROOM_ACTION,
			labelI18n: 'test.label2',
		};

		const manager = new UIActionButtonManager(mockManager);

		manager.registerActionButton('testing-app', button1);
		manager.registerActionButton('testing-app-2', button2);

		const allButtons = await manager.getAllActionButtons();

		assert.ok(allButtons !== undefined);
		assert.strictEqual(allButtons.length, 2);

		const app1Button = allButtons.find((b) => b.appId === 'testing-app');
		const app2Button = allButtons.find((b) => b.appId === 'testing-app-2');

		assert.ok(app1Button !== undefined);
		assert.strictEqual(app1Button!.actionId, 'action-1');
		assert.ok(app2Button !== undefined);
		assert.strictEqual(app2Button!.actionId, 'action-2');
	});
});
