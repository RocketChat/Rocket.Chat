import type { IMessage, RequiredField, SlashCommand, SlashCommandPreviews } from '@rocket.chat/core-typings';
import type { ISlashCommandPreviewItem } from '@rocket.chat/apps-engine/definition/slashcommands';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';

import type { ISlashCommandService } from '../../sdk/types/ISlashCommandService';
import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { slashCommands } from '../../../app/utils/server';
import { parseParameters } from '../../../lib/utils/parseParameters';
import { AppsConverter, AppsManager } from '../../sdk';

export class SlashCommandService extends ServiceClassInternal implements ISlashCommandService {
	protected name = 'slashcommand';

	getCommand(cmd: string): SlashCommand<string> {
		return slashCommands.commands[cmd];
	}

	setCommand(command: SlashCommand<string>): void {
		const cmd = command.command.toLocaleLowerCase();

		slashCommands.commands[cmd] = command;
	}

	setAppCommand(command: SlashCommand<string>): void {
		const cmd = command.command.toLocaleLowerCase();

		command.callback = this._appCommandExecutor.bind(this);
		command.previewer = command.previewer ? this._appCommandPreviewer.bind(this) : undefined;
		command.previewCallback = command.previewCallback
			? (this._appCommandPreviewExecutor.bind(this) as typeof slashCommands.commands[string]['previewCallback'])
			: undefined;

		slashCommands.commands[cmd] = command;
	}

	removeCommand(command: string): void {
		delete slashCommands.commands[command];
	}

	private async _appCommandExecutor(
		command: string,
		parameters: any,
		message: RequiredField<Partial<IMessage>, 'rid'>,
		triggerId?: string,
		userId?: string,
	): Promise<void> {
		const user = await AppsConverter.convertUserById(userId as string);
		const room = await AppsConverter.convertRoomById(message.rid);
		const threadId = message.tmid;
		const params = parseParameters(parameters);

		const context = new SlashCommandContext(
			Object.freeze(user),
			Object.freeze(room),
			Object.freeze(params) as string[],
			threadId,
			triggerId,
		);

		await AppsManager.commandExecuteCommand(command, context);
	}

	private async _appCommandPreviewer(
		command: string,
		parameters: string,
		message: IMessage,
		userId?: string,
	): Promise<SlashCommandPreviews> {
		const user = await AppsConverter.convertUserById(userId as string);
		const room = await AppsConverter.convertRoomById(message.rid);
		const threadId = message.tmid;
		const params = parseParameters(parameters);

		const context = new SlashCommandContext(Object.freeze(user), Object.freeze(room), Object.freeze(params) as string[], threadId);
		const preview = await AppsManager.getCommandPreviews(command, context);

		return preview as SlashCommandPreviews;
	}

	private async _appCommandPreviewExecutor(
		command: string,
		parameters: any,
		message: IMessage,
		preview: ISlashCommandPreviewItem,
		triggerId: string,
		userId?: string,
	): Promise<void> {
		const user = await AppsConverter.convertUserById(userId as string);
		const room = await AppsConverter.convertRoomById(message.rid);
		const threadId = message.tmid;
		const params = parseParameters(parameters);

		const context = new SlashCommandContext(
			Object.freeze(user),
			Object.freeze(room),
			Object.freeze(params) as string[],
			threadId,
			triggerId,
		);

		await AppsManager.commandExecutePreview(command, preview, context);
	}
}
