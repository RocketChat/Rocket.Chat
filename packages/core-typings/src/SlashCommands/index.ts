import type { IMessage } from '../IMessage';
import type { RequiredField } from '../utils';

type SlashCommandCallback = (command: string, params: string, message: RequiredField<Partial<IMessage>, 'rid'>, triggerId?: string) => void;

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

export type SlashCommand = {
	command: string;
	callback?: SlashCommandCallback;
	params: SlashCommandOptions['params'];
	description: SlashCommandOptions['description'];
	permission: SlashCommandOptions['permission'];
	clientOnly?: SlashCommandOptions['clientOnly'];
	result?: (err: Meteor.Error, result: never, data: { cmd: string; params: string; msg: IMessage }) => void;
	providesPreview: boolean;
	previewer?: SlashCommandPreviewer;
	previewCallback?: SlashCommandPreviewCallback;
};
