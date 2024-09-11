import type { AppSlashCommandManager } from '../managers/AppSlashCommandManager';
import type { ISlashCommandsExtend } from '../../definition/accessors';
import type { ISlashCommand } from '../../definition/slashcommands';

export class SlashCommandsExtend implements ISlashCommandsExtend {
    constructor(private readonly manager: AppSlashCommandManager, private readonly appId: string) {}

    public provideSlashCommand(slashCommand: ISlashCommand): Promise<void> {
        return Promise.resolve(this.manager.addCommand(this.appId, slashCommand));
    }
}
