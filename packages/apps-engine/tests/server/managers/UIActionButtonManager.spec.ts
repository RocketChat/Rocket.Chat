import type { RestorableFunctionSpy } from 'alsatian';
import { AsyncTest, Expect, Setup, SetupFixture, SpyOn, Teardown, Test } from 'alsatian';

import { AppStatus } from '../../../src/definition/AppStatus';
import type { IUIActionButtonDescriptor } from '../../../src/definition/ui';
import { UIActionButtonContext } from '../../../src/definition/ui';
import type { AppManager } from '../../../src/server/AppManager';
import type { ProxiedApp } from '../../../src/server/ProxiedApp';
import type { AppActivationBridge, AppBridges } from '../../../src/server/bridges';
import { AppPermissionManager } from '../../../src/server/managers/AppPermissionManager';
import { UIActionButtonManager } from '../../../src/server/managers/UIActionButtonManager';
import { AppPermissions } from '../../../src/server/permissions/AppPermissions';
import { TestsAppBridges } from '../../test-data/bridges/appBridges';

export class UIActionButtonManagerTestFixture {
	private mockBridges: TestsAppBridges;

	private mockApp: ProxiedApp;

	private mockApp2: ProxiedApp;

	private mockManager: AppManager;

	private mockActivationBridge: AppActivationBridge;

	private hasPermissionSpy: RestorableFunctionSpy;

	private notifyAboutErrorSpy: RestorableFunctionSpy;

	private doActionsChangedSpy: RestorableFunctionSpy;

	@SetupFixture
	public setupFixture() {
		this.mockBridges = new TestsAppBridges();
		this.mockActivationBridge = this.mockBridges.getAppActivationBridge();

		this.mockApp = {
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

		this.mockApp2 = {
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

		const bri = this.mockBridges;
		this.mockManager = {
			getBridges(): AppBridges {
				return bri;
			},
			getOneById: (appId: string): ProxiedApp | undefined => {
				if (appId === 'testing-app') {
					return this.mockApp;
				}
				if (appId === 'testing-app-2') {
					return this.mockApp2;
				}
			},
		} as AppManager;
	}

	@Setup
	public setup() {
		this.notifyAboutErrorSpy = SpyOn(AppPermissionManager, 'notifyAboutError');
		this.hasPermissionSpy = SpyOn(AppPermissionManager, 'hasPermission');
		this.doActionsChangedSpy = SpyOn(this.mockActivationBridge, 'doActionsChanged');
	}

	@Teardown
	public teardown() {
		this.notifyAboutErrorSpy.restore();
		this.hasPermissionSpy.restore();
		this.doActionsChangedSpy.restore();
	}

	@Test()
	public basicUIActionButtonManager() {
		Expect(() => new UIActionButtonManager(this.mockManager)).not.toThrow();

		const manager = new UIActionButtonManager(this.mockManager);
		Expect((manager as any).manager).toBe(this.mockManager);
		Expect((manager as any).activationBridge).toBe(this.mockActivationBridge);
		Expect((manager as any).registeredActionButtons).toBeDefined();
		Expect((manager as any).registeredActionButtons.size).toBe(0);
	}

	@Test()
	public registerActionButtonWithPermission() {
		this.hasPermissionSpy.andReturn(true);

		const manager = new UIActionButtonManager(this.mockManager);
		const button: IUIActionButtonDescriptor = {
			actionId: 'test-action',
			context: UIActionButtonContext.MESSAGE_ACTION,
			labelI18n: 'test.label',
		};

		const result = manager.registerActionButton('testing-app', button);

		Expect(result).toBe(true);
		Expect(this.hasPermissionSpy).toHaveBeenCalledWith('testing-app', AppPermissions.ui.registerButtons);
		Expect(this.mockActivationBridge.doActionsChanged).toHaveBeenCalled();
		Expect((manager as any).registeredActionButtons.size).toBe(1);
		Expect((manager as any).registeredActionButtons.get('testing-app').size).toBe(1);
		Expect((manager as any).registeredActionButtons.get('testing-app').get('test-action')).toBe(button);
	}

	@Test()
	public registerActionButtonWithoutPermission() {
		this.hasPermissionSpy.andReturn(false);
		this.notifyAboutErrorSpy.andCall(() => {});

		const manager = new UIActionButtonManager(this.mockManager);
		const button: IUIActionButtonDescriptor = {
			actionId: 'test-action',
			context: UIActionButtonContext.MESSAGE_ACTION,
			labelI18n: 'test.label',
		};

		const result = manager.registerActionButton('testing-app', button);

		Expect(result).toBe(false);
		Expect(this.hasPermissionSpy).toHaveBeenCalledWith('testing-app', AppPermissions.ui.registerButtons);
		Expect(this.notifyAboutErrorSpy).toHaveBeenCalled();
		Expect(this.mockActivationBridge.doActionsChanged).not.toHaveBeenCalled();
		Expect((manager as any).registeredActionButtons.size).toBe(0);
	}

	@Test()
	public registerMultipleButtonsForSameApp() {
		this.hasPermissionSpy.andReturn(true);

		const manager = new UIActionButtonManager(this.mockManager);
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

		Expect((manager as any).registeredActionButtons.size).toBe(1);
		Expect((manager as any).registeredActionButtons.get('testing-app').size).toBe(2);
		Expect((manager as any).registeredActionButtons.get('testing-app').get('action-1')).toBe(button1);
		Expect((manager as any).registeredActionButtons.get('testing-app').get('action-2')).toBe(button2);
	}

	@Test()
	public clearAppActionButtons() {
		this.hasPermissionSpy.andReturn(true);

		const manager = new UIActionButtonManager(this.mockManager);
		const button: IUIActionButtonDescriptor = {
			actionId: 'test-action',
			context: UIActionButtonContext.MESSAGE_ACTION,
			labelI18n: 'test.label',
		};

		manager.registerActionButton('testing-app', button);
		Expect((manager as any).registeredActionButtons.get('testing-app').size).toBe(1);

		manager.clearAppActionButtons('testing-app');

		Expect((manager as any).registeredActionButtons.get('testing-app').size).toBe(0);
		Expect(this.mockActivationBridge.doActionsChanged).toHaveBeenCalled().exactly(2);
	}

	@Test()
	public getAppActionButtons() {
		this.hasPermissionSpy.andReturn(true);

		const manager = new UIActionButtonManager(this.mockManager);
		const button: IUIActionButtonDescriptor = {
			actionId: 'test-action',
			context: UIActionButtonContext.MESSAGE_ACTION,
			labelI18n: 'test.label',
		};

		manager.registerActionButton('testing-app', button);

		const buttons = manager.getAppActionButtons('testing-app');
		Expect(buttons).toBeDefined();
		Expect(buttons?.size).toBe(1);
		Expect(buttons?.get('test-action')).toBe(button);

		const nonExistentButtons = manager.getAppActionButtons('non-existent');
		Expect(nonExistentButtons).toBe(undefined);
	}

	@AsyncTest()
	public async getAllActionButtonsFromEnabledApp() {
		this.hasPermissionSpy.andReturn(true);

		const spy = SpyOn(this.mockApp, 'getStatus');

		spy.andReturn(Promise.resolve(AppStatus.AUTO_ENABLED));

		const manager = new UIActionButtonManager(this.mockManager);
		const button: IUIActionButtonDescriptor = {
			actionId: 'test-action',
			context: UIActionButtonContext.MESSAGE_ACTION,
			labelI18n: 'test.label',
		};

		manager.registerActionButton('testing-app', button);

		const allButtons = await manager.getAllActionButtons();

		Expect(allButtons).toBeDefined();
		Expect(allButtons.length).toBe(1);
		Expect(allButtons[0].actionId).toBe('test-action');
		Expect(allButtons[0].appId).toBe('testing-app');
		Expect(allButtons[0].context).toBe(UIActionButtonContext.MESSAGE_ACTION);
		Expect(allButtons[0].labelI18n).toBe('test.label');

		spy.restore();
	}

	@AsyncTest()
	public async getAllActionButtonsFromDisabledApp() {
		this.hasPermissionSpy.andReturn(true);

		const spy = SpyOn(this.mockApp, 'getStatus');

		spy.andReturn(Promise.resolve(AppStatus.DISABLED));

		const manager = new UIActionButtonManager(this.mockManager);
		const button: IUIActionButtonDescriptor = {
			actionId: 'test-action',
			context: UIActionButtonContext.MESSAGE_ACTION,
			labelI18n: 'test.label',
		};

		manager.registerActionButton('testing-app', button);

		const allButtons = await manager.getAllActionButtons();

		Expect(allButtons).toBeDefined();
		Expect(allButtons.length).toBe(0);

		spy.restore();
	}

	@AsyncTest()
	public async getAllActionButtonsFromNonExistentApp() {
		this.hasPermissionSpy.andReturn(true);

		const manager = new UIActionButtonManager(this.mockManager);
		const button: IUIActionButtonDescriptor = {
			actionId: 'test-action',
			context: UIActionButtonContext.MESSAGE_ACTION,
			labelI18n: 'test.label',
		};

		manager.registerActionButton('non-existent-app', button);

		const allButtons = await manager.getAllActionButtons();

		Expect(allButtons).toBeDefined();
		Expect(allButtons.length).toBe(0);
	}

	@AsyncTest()
	public async getAllActionButtonsWithStatusError() {
		this.hasPermissionSpy.andReturn(true);

		const spy = SpyOn(this.mockApp, 'getStatus');

		spy.andReturn(Promise.reject(new Error('Status error')));

		const manager = new UIActionButtonManager(this.mockManager);
		const button: IUIActionButtonDescriptor = {
			actionId: 'test-action',
			context: UIActionButtonContext.MESSAGE_ACTION,
			labelI18n: 'test.label',
		};

		manager.registerActionButton('testing-app', button);

		const allButtons = await manager.getAllActionButtons();

		Expect(allButtons).toBeDefined();
		Expect(allButtons.length).toBe(0);

		spy.restore();
	}

	@AsyncTest()
	public async getAllActionButtonsFromMultipleApps() {
		this.hasPermissionSpy.andReturn(true);

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

		const manager = new UIActionButtonManager(this.mockManager);

		manager.registerActionButton('testing-app', button1);
		manager.registerActionButton('testing-app-2', button2);

		const allButtons = await manager.getAllActionButtons();

		Expect(allButtons).toBeDefined();
		Expect(allButtons.length).toBe(2);

		const app1Button = allButtons.find((b) => b.appId === 'testing-app');
		const app2Button = allButtons.find((b) => b.appId === 'testing-app-2');

		Expect(app1Button).toBeDefined();
		Expect(app1Button!.actionId).toBe('action-1');
		Expect(app2Button).toBeDefined();
		Expect(app2Button!.actionId).toBe('action-2');
	}
}
