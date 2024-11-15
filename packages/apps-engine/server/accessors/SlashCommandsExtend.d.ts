import type { ISlashCommandsExtend } from '../../definition/accessors';
import type { ISlashCommand } from '../../definition/slashcommands';
import type { AppSlashCommandManager } from '../managers/AppSlashCommandManager';
export declare class SlashCommandsExtend implements ISlashCommandsExtend {
    private readonly manager;
    private readonly appId;
    constructor(manager: AppSlashCommandManager, appId: string);
    provideSlashCommand(slashCommand: ISlashCommand): Promise<void>;
}
