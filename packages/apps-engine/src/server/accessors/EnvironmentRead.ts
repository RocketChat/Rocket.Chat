import type { IEnvironmentalVariableRead, IEnvironmentRead, IServerSettingRead, ISettingRead } from '../../definition/accessors';

export class EnvironmentRead implements IEnvironmentRead {
    constructor(
        private readonly settings: ISettingRead,
        private readonly serverSettings: IServerSettingRead,
        private readonly envRead: IEnvironmentalVariableRead,
    ) {}

    public getSettings(): ISettingRead {
        return this.settings;
    }

    public getServerSettings(): IServerSettingRead {
        return this.serverSettings;
    }

    public getEnvironmentVariables(): IEnvironmentalVariableRead {
        return this.envRead;
    }
}
