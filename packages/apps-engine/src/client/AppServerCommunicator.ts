import type { IAppInfo } from '../definition/metadata';

export abstract class AppServerCommunicator {
    public abstract getEnabledApps(): Promise<Array<IAppInfo>>;

    public abstract getDisabledApps(): Promise<Array<IAppInfo>>;

    // Map<appId, Map<language, translations>>
    public abstract getLanguageAdditions(): Promise<Map<string, Map<string, object>>>;

    // Map<appId, Array<commands>>
    public abstract getSlashCommands(): Promise<Map<string, Array<string>>>;

    // Map<appId, Array<to-be-determined>>
    public abstract getContextualBarButtons(): Promise<Map<string, Array<object>>>;
}
