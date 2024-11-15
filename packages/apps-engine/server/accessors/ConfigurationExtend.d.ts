import type { IApiExtend, IConfigurationExtend, IExternalComponentsExtend, IHttpExtend, ISchedulerExtend, ISettingsExtend, ISlashCommandsExtend, IUIExtend, IVideoConfProvidersExtend } from '../../definition/accessors';
export declare class ConfigurationExtend implements IConfigurationExtend {
    readonly http: IHttpExtend;
    readonly settings: ISettingsExtend;
    readonly slashCommands: ISlashCommandsExtend;
    readonly api: IApiExtend;
    readonly externalComponents: IExternalComponentsExtend;
    readonly scheduler: ISchedulerExtend;
    readonly ui: IUIExtend;
    readonly videoConfProviders: IVideoConfProvidersExtend;
    constructor(http: IHttpExtend, settings: ISettingsExtend, slashCommands: ISlashCommandsExtend, api: IApiExtend, externalComponents: IExternalComponentsExtend, scheduler: ISchedulerExtend, ui: IUIExtend, videoConfProviders: IVideoConfProvidersExtend);
}
