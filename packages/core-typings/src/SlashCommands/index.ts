import type { IMessage } from '../IMessage';
import type { RequiredField } from '../utils';

type SlashCommandCallback<T extends string = string> = (
	command: T,
	params: string,
	message: RequiredField<Partial<IMessage>, 'rid'>,
	triggerId?: string,
) => void;

export type SlashCommandPreviewItem = {
	id: string;
	type: 'image' | 'video' | 'audio' | 'text' | 'other';
	value: string;
};

export type SlashCommandPreviews = {
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
