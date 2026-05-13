import type {
	IConfigurationModify,
	ISchedulerModify,
	IServerSettingsModify,
	ISlashCommandsModify,
} from '@rocket.chat/apps-engine/definition/accessors';

export class ConfigurationModify implements IConfigurationModify {
	constructor(
		public readonly serverSettings: IServerSettingsModify,
		public readonly slashCommands: ISlashCommandsModify,
		public readonly scheduler: ISchedulerModify,
	) {}
}
