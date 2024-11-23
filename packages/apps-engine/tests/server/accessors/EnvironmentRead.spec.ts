import { Expect, SetupFixture, Test } from 'alsatian';

import type { IEnvironmentalVariableRead, IServerSettingRead, ISettingRead } from '../../../src/definition/accessors';
import { EnvironmentRead } from '../../../src/server/accessors';

export class EnvironmentReadTestFixture {
    private evr: IEnvironmentalVariableRead;

    private ssr: IServerSettingRead;

    private sr: ISettingRead;

    @SetupFixture
    public setupFixture() {
        this.evr = {} as IEnvironmentalVariableRead;
        this.ssr = {} as IServerSettingRead;
        this.sr = {} as ISettingRead;
    }

    @Test()
    public useEnvironmentRead() {
        Expect(() => new EnvironmentRead(this.sr, this.ssr, this.evr)).not.toThrow();

        const er = new EnvironmentRead(this.sr, this.ssr, this.evr);
        Expect(er.getSettings()).toBeDefined();
        Expect(er.getServerSettings()).toBeDefined();
        Expect(er.getEnvironmentVariables()).toBeDefined();
    }
}
