import type { IConfigurationModify, ISchedulerModify, IServerSettingsModify, ISlashCommandsModify } from '../../definition/accessors';
export declare class ConfigurationModify implements IConfigurationModify {
    readonly serverSettings: IServerSettingsModify;
    readonly slashCommands: ISlashCommandsModify;
    readonly scheduler: ISchedulerModify;
    constructor(serverSettings: IServerSettingsModify, slashCommands: ISlashCommandsModify, scheduler: ISchedulerModify);
}
