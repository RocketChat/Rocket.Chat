import type { IEnvironmentWrite, IServerSettingUpdater, ISettingUpdater } from '@rocket.chat/apps-engine/definition/accessors/index.js';

export class EnvironmentWrite implements IEnvironmentWrite {
	constructor(
		private readonly settings: ISettingUpdater,
		private readonly serverSettings: IServerSettingUpdater,
	) {}

	public getSettings(): ISettingUpdater {
		return this.settings;
	}

	public getServerSettings(): IServerSettingUpdater {
		return this.serverSettings;
	}
}
