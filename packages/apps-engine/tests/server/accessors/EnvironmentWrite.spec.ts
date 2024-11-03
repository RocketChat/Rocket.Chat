import { Expect, SetupFixture, Test } from 'alsatian';

import type { IServerSettingUpdater, ISettingUpdater } from '../../../src/definition/accessors';
import { EnvironmentWrite } from '../../../src/server/accessors';

export class EnvironmentWriteTestFixture {
    private sr: ISettingUpdater;

    private serverSettings: IServerSettingUpdater;

    @SetupFixture
    public setupFixture() {
        this.sr = {} as ISettingUpdater;
        this.serverSettings = {} as IServerSettingUpdater;
    }

    @Test()
    public useEnvironmentWrite() {
        Expect(() => new EnvironmentWrite(this.sr, this.serverSettings)).not.toThrow();

        const er = new EnvironmentWrite(this.sr, this.serverSettings);
        Expect(er.getSettings()).toBeDefined();
        Expect(er.getServerSettings()).toBeDefined();
    }
}
