import { Expect, SetupFixture, Test } from 'alsatian';

import { AppInterface } from '../../../src/definition/metadata';
import type { AppManager } from '../../../src/server/AppManager';
import type { ProxiedApp } from '../../../src/server/ProxiedApp';
import { AppListenerManager } from '../../../src/server/managers';

export class AppListenerManagerTestFixture {
	private mockApp: ProxiedApp;

	private mockManager: AppManager;

	@SetupFixture
	public setupFixture() {
		this.mockApp = {
			getID() {
				return 'testing';
			},
			getImplementationList() {
				return {
					[AppInterface.IPostMessageSent]: true,
				} as { [inte: string]: boolean };
			},
		} as ProxiedApp;

		this.mockManager = {
			getAccessorManager() {},
			getOneById(appId: string) {
				return this.mockApp;
			},
		} as AppManager;
	}

	@Test()
	public basicAppListenerManager() {
		Expect(() => new AppListenerManager(this.mockManager)).not.toThrow();

		const alm = new AppListenerManager(this.mockManager);

		Expect(alm.getListeners(AppInterface.IPostMessageSent).length).toBe(0);
		Expect(() => alm.registerListeners(this.mockApp)).not.toThrow();
		Expect(alm.getListeners(AppInterface.IPostMessageSent).length).toBe(1);
	}

	@Test()
	public hasListenersReturnsFalseWhenNoListeners() {
		const alm = new AppListenerManager(this.mockManager);

		Expect(alm.hasListeners(AppInterface.IPostMessageSent)).toBe(false);
	}

	@Test()
	public hasListenersReturnsTrueAfterRegisterListeners() {
		const alm = new AppListenerManager(this.mockManager);

		alm.registerListeners(this.mockApp);

		Expect(alm.hasListeners(AppInterface.IPostMessageSent)).toBe(true);
	}

	@Test()
	public hasListenersReturnsFalseAfterUnregisterListeners() {
		const alm = new AppListenerManager(this.mockManager);

		alm.registerListeners(this.mockApp);
		alm.unregisterListeners(this.mockApp);

		Expect(alm.hasListeners(AppInterface.IPostMessageSent)).toBe(false);
	}

	@Test()
	public hasListenersReturnsTrueForBlockedEvent() {
		const alm = new AppListenerManager(this.mockManager);

		const mockEssentialApp = {
			getID() {
				return 'essential-app';
			},
			getImplementationList() {
				return {
					[AppInterface.IPostMessageSent]: true,
				} as { [inte: string]: boolean };
			},
			getEssentials() {
				return [AppInterface.IPostMessageSent];
			},
		} as ProxiedApp;

		alm.lockEssentialEvents(mockEssentialApp);

		Expect(alm.hasListeners(AppInterface.IPostMessageSent)).toBe(true);
	}
}
