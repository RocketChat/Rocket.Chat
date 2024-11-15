import type { IEnvironmentalVariableRead, IEnvironmentRead, IServerSettingRead, ISettingRead } from '../../definition/accessors';
export declare class EnvironmentRead implements IEnvironmentRead {
    private readonly settings;
    private readonly serverSettings;
    private readonly envRead;
    constructor(settings: ISettingRead, serverSettings: IServerSettingRead, envRead: IEnvironmentalVariableRead);
    getSettings(): ISettingRead;
    getServerSettings(): IServerSettingRead;
    getEnvironmentVariables(): IEnvironmentalVariableRead;
}
