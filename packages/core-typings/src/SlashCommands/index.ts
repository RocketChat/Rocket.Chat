import type { IMessage } from '../IMessage';
import type { RequiredField } from '../utils';

export type SlashCommandCallbackParams<T> = {
	command: T;
	params: string;
	message: RequiredField<Partial<IMessage>, 'rid' | '_id'>;
	userId: string;
	triggerId?: string;
};

type SlashCommandCallback<T extends string = string> = (params: SlashCommandCallbackParams<T>) => Promise<unknown> | unknown;

export type SlashCommandPreviewItem = {
	id: string;
	type: 'image' | 'video' | 'audio' | 'text' | 'other';
	value: string;
};

export type SlashCommandPreviews = {
	i18nTitle: string;
	items: SlashCommandPreviewItem[];
};

type SlashCommandPreviewer = (
	command: string,
	params: string,
	message: RequiredField<Partial<IMessage>, 'rid'>,
) => Promise<SlashCommandPreviews | undefined>;

type SlashCommandPreviewCallback = (
	command: string,
	params: string,
	message: RequiredField<Partial<IMessage>, 'rid'>,
	preview: SlashCommandPreviewItem,
	triggerId?: string,
) => void;

export type SlashCommandOptions = {
	params?: string;
	description?: string;
	permission?: string | string[];
	clientOnly?: boolean;
};

export type SlashCommand<T extends string = string> = {
	command: string;
	callback?: SlashCommandCallback<T>;
	params: SlashCommandOptions['params'];
	description: SlashCommandOptions['description'];
	permission: SlashCommandOptions['permission'];
	clientOnly?: SlashCommandOptions['clientOnly'];
	result?: (err: unknown, result: unknown, data: { cmd: string; params: string; msg: IMessage }) => void;
	providesPreview: boolean;
	previewer?: SlashCommandPreviewer;
	previewCallback?: SlashCommandPreviewCallback;
	appId?: string;
};

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

export interface ISlashCommands {
	commands: Record<string, SlashCommand>;
	add<T extends string>({
		command,
		callback,
		options,
		result,
		providesPreview,
		previewer,
		previewCallback,
		appId,
		description,
	}: ISlashCommandAddParams<T>): void;
	run({
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
	}): Promise<unknown>;
	getPreviews(command: string, params: string, message: RequiredField<Partial<IMessage>, 'rid'>): Promise<SlashCommandPreviews | undefined>;
	executePreview(
		command: string,
		params: string,
		message: Pick<IMessage, 'rid'> & Partial<Omit<IMessage, 'rid'>>,
		preview: SlashCommandPreviewItem,
		triggerId?: string,
	): Promise<any>;
	remove(command: string): void;
}
