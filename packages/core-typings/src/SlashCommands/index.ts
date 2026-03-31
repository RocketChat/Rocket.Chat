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
