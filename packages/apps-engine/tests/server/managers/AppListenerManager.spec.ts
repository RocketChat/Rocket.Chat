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
}
