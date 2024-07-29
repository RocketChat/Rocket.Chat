import type {
    IApiExtend,
    IConfigurationExtend,
    IExternalComponentsExtend,
    IHttpExtend,
    ISchedulerExtend,
    ISettingsExtend,
    ISlashCommandsExtend,
    IUIExtend,
    IVideoConfProvidersExtend,
} from '../../definition/accessors';

export class ConfigurationExtend implements IConfigurationExtend {
    constructor(
        public readonly http: IHttpExtend,
        public readonly settings: ISettingsExtend,
        public readonly slashCommands: ISlashCommandsExtend,
        public readonly api: IApiExtend,
        public readonly externalComponents: IExternalComponentsExtend,
        public readonly scheduler: ISchedulerExtend,
        public readonly ui: IUIExtend,
        public readonly videoConfProviders: IVideoConfProvidersExtend,
    ) {}
}
