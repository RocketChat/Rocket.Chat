import { Expect, SetupFixture, Test } from 'alsatian';

import type { IVideoConfProvider } from '../../../src/definition/videoConfProviders';
import type { ProxiedApp } from '../../../src/server/ProxiedApp';
import { AppVideoConfProvider } from '../../../src/server/managers/AppVideoConfProvider';

export class AppSlashCommandRegistrationTestFixture {
    private mockApp: ProxiedApp;

    @SetupFixture
    public setupFixture() {
        this.mockApp = {} as ProxiedApp;
    }

    @Test()
    public ensureAppVideoConfManager() {
        Expect(() => new AppVideoConfProvider(this.mockApp, {} as IVideoConfProvider)).not.toThrow();

        const ascr = new AppVideoConfProvider(this.mockApp, {} as IVideoConfProvider);
        Expect(ascr.isRegistered).toBe(false);

        ascr.hasBeenRegistered();
        Expect(ascr.isRegistered).toBe(true);
    }
}
