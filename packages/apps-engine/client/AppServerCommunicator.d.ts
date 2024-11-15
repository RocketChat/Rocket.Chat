import type { IAppInfo } from '../definition/metadata';
export declare abstract class AppServerCommunicator {
    abstract getEnabledApps(): Promise<Array<IAppInfo>>;
    abstract getDisabledApps(): Promise<Array<IAppInfo>>;
    abstract getLanguageAdditions(): Promise<Map<string, Map<string, object>>>;
    abstract getSlashCommands(): Promise<Map<string, Array<string>>>;
    abstract getContextualBarButtons(): Promise<Map<string, Array<object>>>;
}
