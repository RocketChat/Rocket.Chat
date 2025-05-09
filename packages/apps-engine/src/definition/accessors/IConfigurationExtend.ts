import type { IApiExtend } from './IApiExtend';
import type { IExternalComponentsExtend } from './IExternalComponentsExtend';
import type { IHttpExtend } from './IHttp';
import type { ISchedulerExtend } from './ISchedulerExtend';
import type { ISettingsExtend } from './ISettingsExtend';
import type { ISlashCommandsExtend } from './ISlashCommandsExtend';
import type { IUIExtend } from './IUIExtend';
import type { IVideoConfProvidersExtend } from './IVideoConfProvidersExtend';

/**
 * This accessor provides methods for declaring the configuration
 * of your App. It is provided during initialization of your App.
 */
export interface IConfigurationExtend {
    /** Accessor for customing the handling of IHttp requests and responses your App causes. */
    readonly http: IHttpExtend;

    /** Accessor for declaring the settings your App provides. */
    readonly settings: ISettingsExtend;

    /** Accessor for declaring the commands which your App provides. */
    readonly slashCommands: ISlashCommandsExtend;

    /** Accessor for declaring api endpoints. */
    readonly api: IApiExtend;

    readonly externalComponents: IExternalComponentsExtend;

    /** Accessor for declaring tasks that can be scheduled (like cron) */
    readonly scheduler: ISchedulerExtend;
    /** Accessor for registering different elements in the host UI */
    readonly ui: IUIExtend;

    /** Accessor for declaring the videoconf providers which your App provides. */
    readonly videoConfProviders: IVideoConfProvidersExtend;
}
