import { AsyncTest, Expect, SetupFixture, SpyOn } from 'alsatian';

import type { ISlashCommand } from '../../../src/definition/slashcommands';
import { SlashCommandsModify } from '../../../src/server/accessors';
import type { AppSlashCommandManager } from '../../../src/server/managers';
import { TestData } from '../../test-data/utilities';

export class SlashCommandsModifyTestFixture {
    private cmd: ISlashCommand;

    private mockAppId: string;

    private mockCmdManager: AppSlashCommandManager;

    @SetupFixture
    public setupFixture() {
        this.cmd = TestData.getSlashCommand();
        this.mockAppId = 'testing-app';
        this.mockCmdManager = {
            modifyCommand(appId: string, command: ISlashCommand): void {},
            disableCommand(appId: string, command: string): void {},
            enableCommand(appId: string, command: string): void {},
        } as AppSlashCommandManager;
    }

    @AsyncTest()
    public async useSlashCommandsModify() {
        Expect(() => new SlashCommandsModify(this.mockCmdManager, this.mockAppId)).not.toThrow();

        const sp1 = SpyOn(this.mockCmdManager, 'modifyCommand');
        const sp2 = SpyOn(this.mockCmdManager, 'disableCommand');
        const sp3 = SpyOn(this.mockCmdManager, 'enableCommand');

        const scm = new SlashCommandsModify(this.mockCmdManager, this.mockAppId);

        Expect(await scm.modifySlashCommand(this.cmd)).not.toBeDefined();
        Expect(this.mockCmdManager.modifyCommand).toHaveBeenCalledWith(this.mockAppId, this.cmd);
        Expect(await scm.disableSlashCommand('testing-cmd')).not.toBeDefined();
        Expect(this.mockCmdManager.disableCommand).toHaveBeenCalledWith(this.mockAppId, 'testing-cmd');
        Expect(await scm.enableSlashCommand('testing-cmd')).not.toBeDefined();
        Expect(this.mockCmdManager.enableCommand).toHaveBeenCalledWith(this.mockAppId, 'testing-cmd');

        sp1.restore();
        sp2.restore();
        sp3.restore();
    }
}
