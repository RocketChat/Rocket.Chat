import type { ISlashCommandsModify } from '../../definition/accessors';
import type { ISlashCommand } from '../../definition/slashcommands';
import type { AppSlashCommandManager } from '../managers';
export declare class SlashCommandsModify implements ISlashCommandsModify {
    private readonly manager;
    private readonly appId;
    constructor(manager: AppSlashCommandManager, appId: string);
    modifySlashCommand(slashCommand: ISlashCommand): Promise<void>;
    disableSlashCommand(command: string): Promise<void>;
    enableSlashCommand(command: string): Promise<void>;
}
