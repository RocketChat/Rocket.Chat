import type {
	IMessage,
	SlashCommand,
	SlashCommandOptions,
	RequiredField,
	SlashCommandPreviewItem,
	SlashCommandPreviews,
} from '@rocket.chat/core-typings';

import { InvalidCommandUsage, InvalidPreview } from '../../../client/lib/errors';

interface ISlashCommandAddParams<T extends string> {
	command: string;
	callback?: SlashCommand<T>['callback'];
	options?: SlashCommandOptions;
	result?: SlashCommand['result'];
	providesPreview?: boolean;
	previewer?: SlashCommand['previewer'];
	previewCallback?: SlashCommand['previewCallback'];
	appId?: string;
	description?: string;
}

export const slashCommands = {
	commands: {} as Record<string, SlashCommand>,
	add<T extends string>({
		command,
		callback,
		options = {},
		result,
		providesPreview = false,
		previewer,
		previewCallback,
		appId,
		description = '',
	}: ISlashCommandAddParams<T>): void {
		if (this.commands[command]) {
			return;
		}
		this.commands[command] = {
			command,
			callback,
			params: options.params,
			description: options.description || description,
			permission: options.permission,
			clientOnly: options.clientOnly || false,
			result,
			providesPreview: Boolean(providesPreview),
			previewer,
			previewCallback,
			appId,
		} as SlashCommand;
	},
	async run({
		command,
		message,
		params,
		triggerId,
		userId,
	}: {
		command: string;
		params: string;
		message: RequiredField<Partial<IMessage>, 'rid' | '_id'>;
		userId: string;
		triggerId?: string | undefined;
	}): Promise<unknown> {
		const cmd = this.commands[command];
		if (typeof cmd?.callback !== 'function') {
			return;
		}

		if (!message?.rid) {
			throw new InvalidCommandUsage();
		}

		return cmd.callback({ command, params, message, triggerId, userId });
	},
	async getPreviews(
		command: string,
		params: string,
		message: RequiredField<Partial<IMessage>, 'rid'>,
	): Promise<SlashCommandPreviews | undefined> {
		const cmd = this.commands[command];
		if (typeof cmd?.previewer !== 'function') {
			return;
		}

		if (!message?.rid) {
			throw new InvalidCommandUsage();
		}

		const previewInfo = await cmd.previewer(command, params, message);

		if (!previewInfo?.items?.length) {
			return;
		}

		// A limit of ten results, to save time and bandwidth
		if (previewInfo.items.length >= 10) {
			previewInfo.items = previewInfo.items.slice(0, 10);
		}

		return previewInfo;
	},
	async executePreview(
		command: string,
		params: string,
		message: Pick<IMessage, 'rid'> & Partial<Omit<IMessage, 'rid'>>,
		preview: SlashCommandPreviewItem,
		triggerId?: string,
	) {
		const cmd = this.commands[command];
		if (typeof cmd?.previewCallback !== 'function') {
			return;
		}

		if (!message?.rid) {
			throw new InvalidCommandUsage();
		}

		// { id, type, value }
		if (!preview.id || !preview.type || !preview.value) {
			throw new InvalidPreview();
		}

		return cmd.previewCallback(command, params, message, preview, triggerId);
	},
};

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		slashCommand(params: { cmd: string; params: string; msg: IMessage; triggerId: string }): unknown;
	}
}
