import { Meteor } from 'meteor/meteor';
import type { IMessage } from '@rocket.chat/core-typings';

type SlashCommandCallback<T extends string> = (command: T, params: string, message: IMessage, triggerId: string) => void;

type SlashCommandPreviewItem = {
	id: string;
	type: 'image' | 'video' | 'audio' | 'text' | 'other';
	value: string;
};

type SlashCommandPreviews = {
	i18nTitle: string;
	items: SlashCommandPreviewItem[];
};

type SlashCommandPreviewer = (command: string, params: string, message: IMessage) => SlashCommandPreviews | undefined;

type SlashCommandPreviewCallback = (
	command: string,
	params: string,
	message: IMessage,
	preview: SlashCommandPreviewItem,
	triggerId: string,
) => void;

type SlashCommandOptions = {
	params?: string;
	description?: string;
	permission?: string | string[];
	clientOnly?: boolean;
};

type SlashCommand<T extends string> = {
	command: T;
	callback?: SlashCommandCallback<T>;
	params: SlashCommandOptions['params'];
	description: SlashCommandOptions['description'];
	permission: SlashCommandOptions['permission'];
	clientOnly?: SlashCommandOptions['clientOnly'];
	result?: (err: Meteor.Error, result: never, data: { cmd: T; params: string; msg: IMessage }) => void;
	providesPreview: boolean;
	previewer?: SlashCommandPreviewer;
	previewCallback?: SlashCommandPreviewCallback;
};

export const slashCommands = {
	commands: {} as Record<string, SlashCommand<string>>,
	add<T extends string>(
		command: T,
		callback?: SlashCommand<T>['callback'],
		options: SlashCommandOptions = {},
		result?: SlashCommand<T>['result'],
		providesPreview = false,
		previewer?: SlashCommand<T>['previewer'],
		previewCallback?: SlashCommand<T>['previewCallback'],
	): void {
		this.commands[command] = {
			command,
			callback,
			params: options.params,
			description: options.description,
			permission: options.permission,
			clientOnly: options.clientOnly || false,
			result,
			providesPreview,
			previewer,
			previewCallback,
		} as SlashCommand<string>;
	},
	run(command: string, params: string, message: IMessage, triggerId: string): void {
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
