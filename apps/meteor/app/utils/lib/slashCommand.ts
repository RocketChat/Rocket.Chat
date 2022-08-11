import { Meteor } from 'meteor/meteor';
import type {
	IMessage,
	SlashCommand,
	SlashCommandOptions,
	RequiredField,
	SlashCommandPreviewItem,
	SlashCommandPreviews,
} from '@rocket.chat/core-typings';

export interface ISlashCommandAddParams<T extends string> {
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
	run(command: string, params: string, message: RequiredField<Partial<IMessage>, 'rid'>, triggerId?: string | undefined): void {
		const cmd = this.commands[command];
		if (typeof cmd?.callback !== 'function') {
			return;
		}

		if (!message || !message.rid) {
			throw new Meteor.Error('invalid-command-usage', 'Executing a command requires at least a message with a room id.');
		}

		return cmd.callback(command, params, message, triggerId);
	},
	getPreviews(command: string, params: string, message: IMessage): SlashCommandPreviews | undefined {
		const cmd = this.commands[command];
		if (typeof cmd?.previewer !== 'function') {
			return;
		}

		if (!message || !message.rid) {
			throw new Meteor.Error('invalid-command-usage', 'Executing a command requires at least a message with a room id.');
		}

		const previewInfo = cmd.previewer(command, params, message);

		if (!previewInfo?.items?.length) {
			return;
		}

		// A limit of ten results, to save time and bandwidth
		if (previewInfo.items.length >= 10) {
			previewInfo.items = previewInfo.items.slice(0, 10);
		}

		return previewInfo;
	},
	executePreview(command: string, params: string, message: IMessage, preview: SlashCommandPreviewItem, triggerId: string): void {
		const cmd = this.commands[command];
		if (typeof cmd?.previewCallback !== 'function') {
			return;
		}

		if (!message || !message.rid) {
			throw new Meteor.Error('invalid-command-usage', 'Executing a command requires at least a message with a room id.');
		}

		// { id, type, value }
		if (!preview.id || !preview.type || !preview.value) {
			throw new Meteor.Error('error-invalid-preview', 'Preview Item must have an id, type, and value.');
		}

		return cmd.previewCallback(command, params, message, preview, triggerId);
	},
};

Meteor.methods({
	slashCommand(command) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'slashCommand',
			});
		}

		if (!command || !command.cmd || !slashCommands.commands[command.cmd]) {
			throw new Meteor.Error('error-invalid-command', 'Invalid Command Provided', {
				method: 'executeSlashCommandPreview',
			});
		}
		return slashCommands.run(command.cmd, command.params, command.msg, command.triggerId);
	},
});
