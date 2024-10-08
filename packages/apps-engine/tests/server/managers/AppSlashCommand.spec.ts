import { Expect, SetupFixture, Test } from 'alsatian';

import type { ISlashCommand } from '../../../src/definition/slashcommands';
import type { ProxiedApp } from '../../../src/server/ProxiedApp';
import { AppSlashCommand } from '../../../src/server/managers/AppSlashCommand';

export class AppSlashCommandRegistrationTestFixture {
    private mockApp: ProxiedApp;

    @SetupFixture
    public setupFixture() {
        this.mockApp = {} as ProxiedApp;
    }

    @Test()
    public ensureAppSlashCommand() {
        Expect(() => new AppSlashCommand(this.mockApp, {} as ISlashCommand)).not.toThrow();

        const ascr = new AppSlashCommand(this.mockApp, {} as ISlashCommand);
        Expect(ascr.isRegistered).toBe(false);
        Expect(ascr.isEnabled).toBe(false);
        Expect(ascr.isDisabled).toBe(false);

        ascr.hasBeenRegistered();
        Expect(ascr.isDisabled).toBe(false);
        Expect(ascr.isEnabled).toBe(true);
        Expect(ascr.isRegistered).toBe(true);
    }
}
