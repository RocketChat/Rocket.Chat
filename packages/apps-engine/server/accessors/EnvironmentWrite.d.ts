import type { IEnvironmentWrite, IServerSettingUpdater, ISettingUpdater } from '../../definition/accessors';
export declare class EnvironmentWrite implements IEnvironmentWrite {
    private readonly settings;
    private readonly serverSettings;
    constructor(settings: ISettingUpdater, serverSettings: IServerSettingUpdater);
    getSettings(): ISettingUpdater;
    getServerSettings(): IServerSettingUpdater;
}
