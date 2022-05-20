import type Url from 'url';

export type ParsedUrl = Pick<Url.UrlWithParsedQuery, 'host' | 'hash' | 'pathname' | 'protocol' | 'port' | 'query' | 'search' | 'hostname'>;

export type OEmbedMeta = {
	[key: string]: string;
} & {
	oembedHtml: unknown;
	oembedUrl: string | string[];
};

export type OEmbedUrlContent = {
	urlObj: Url.UrlWithParsedQuery;
	parsedUrl: ParsedUrl;
	headers: { [k: string]: string };
	body: string;
	statusCode: number;
};

export type OEmbedProvider = {
	urls: RegExp[];
	endPoint: string;
};
