import { Expect, SetupFixture, Test } from 'alsatian';

import type { ISchedulerModify, IServerSettingsModify, ISlashCommandsModify } from '../../../src/definition/accessors';
import { ConfigurationModify } from '../../../src/server/accessors';

export class ConfigurationExtendTestFixture {
    private ssm: IServerSettingsModify;

    private scm: ISlashCommandsModify;

    private scheduler: ISchedulerModify;

    @SetupFixture
    public setupFixture() {
        this.ssm = {} as IServerSettingsModify;
        this.scm = {} as ISlashCommandsModify;
        this.scheduler = {} as ISchedulerModify;
    }

    @Test()
    public useConfigurationModify() {
        Expect(() => new ConfigurationModify(this.ssm, this.scm, this.scheduler)).not.toThrow();

        const sm = new ConfigurationModify(this.ssm, this.scm, this.scheduler);
        Expect(sm.serverSettings).toBeDefined();
        Expect(sm.slashCommands).toBeDefined();
    }
}
