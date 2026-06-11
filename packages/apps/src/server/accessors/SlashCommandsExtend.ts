import type { ISlashCommandsExtend } from '@rocket.chat/apps-engine/definition/accessors';
import type { ISlashCommand } from '@rocket.chat/apps-engine/definition/slashcommands';

import type { AppSlashCommandManager } from '../managers/AppSlashCommandManager';

export class SlashCommandsExtend implements ISlashCommandsExtend {
	constructor(
		private readonly manager: AppSlashCommandManager,
		private readonly appId: string,
	) {}

	public async provideSlashCommand(slashCommand: ISlashCommand): Promise<void> {
		await this.manager.addCommand(this.appId, slashCommand);
	}
}
