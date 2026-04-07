import type { ISlashCommandsExtend } from '../../definition/accessors';
import type { ISlashCommand } from '../../definition/slashcommands';
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
