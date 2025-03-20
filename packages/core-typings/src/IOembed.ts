import type { MessageAttachment } from './IMessage';

export type OEmbedMeta = {
	[key: string]: string;
} & {
	oembedHtml: string | undefined;
	oembedUrl: string | string[];
};

export type OEmbedUrlContent = {
	urlObj: URL;
	headers: { [k: string]: string };
	body: string;
	statusCode: number;
};

export type OEmbedProvider = {
	urls: RegExp[];
	endPoint?: string;
	getHeaderOverrides?: () => { [k: string]: string };
};

export type OEmbedUrlContentResult = {
	headers: { [key: string]: string };
	body: string;
	statusCode: number;
	attachments?: MessageAttachment[];
};

export const isOEmbedUrlContentResult = (value: any): value is OEmbedUrlContentResult => 'attachments' in value;

export type OEmbedUrlWithMetadata = {
	url: string;
	meta: OEmbedMeta;
	headers: { [k: string]: string };
	content: OEmbedUrlContent;
};

export const isOEmbedUrlWithMetadata = (value: any): value is OEmbedUrlWithMetadata => 'meta' in value;
