import URL from 'url';
import querystring from 'querystring';

import { camelCase } from 'change-case';
import _ from 'underscore';
import iconv from 'iconv-lite';
import ipRangeCheck from 'ip-range-check';
import he from 'he';
import jschardet from 'jschardet';
import type { OEmbedUrlContentResult, OEmbedUrlWithMetadata, IMessage, MessageAttachment, OEmbedMeta } from '@rocket.chat/core-typings';
import { isOEmbedUrlContentResult, isOEmbedUrlWithMetadata } from '@rocket.chat/core-typings';
import { OEmbedCache } from '@rocket.chat/models';

import { Logger } from '../../logger/server';
import { Messages } from '../../models/server';
import { callbacks } from '../../../lib/callbacks';
import { settings } from '../../settings/server';
import { isURL } from '../../../lib/utils/isURL';
import { Info } from '../../utils/server';
import { fetch } from '../../../server/lib/http/fetch';

const log = new Logger('OEmbed');
//  Detect encoding
//  Priority:
//  Detected == HTTP Header > Detected == HTML meta > HTTP Header > HTML meta > Detected > Default (utf-8)
//  See also: https://www.w3.org/International/questions/qa-html-encoding-declarations.en#quickanswer
const getCharset = function (contentType: string, body: Buffer): string {
	let detectedCharset;
	let httpHeaderCharset;
	let htmlMetaCharset;
	let result;

	contentType = contentType || '';

	const binary = body.toString('binary');
	const detected = jschardet.detect(binary);
	if (detected.confidence > 0.8) {
		detectedCharset = detected.encoding.toLowerCase();
	}
	const m1 = contentType.match(/charset=([\w\-]+)/i);
	if (m1) {
		httpHeaderCharset = m1[1].toLowerCase();
	}
	const m2 = binary.match(/<meta\b[^>]*charset=["']?([\w\-]+)/i);
	if (m2) {
		htmlMetaCharset = m2[1].toLowerCase();
	}
	if (detectedCharset) {
		if (detectedCharset === httpHeaderCharset) {
			result = httpHeaderCharset;
		} else if (detectedCharset === htmlMetaCharset) {
			result = htmlMetaCharset;
		}
	}
	if (!result) {
		result = httpHeaderCharset || htmlMetaCharset || detectedCharset;
	}
	return result || 'utf-8';
};

const toUtf8 = function (contentType: string, body: Buffer): string {
	return iconv.decode(body, getCharset(contentType, body));
};

const getUrlContent = async function (urlObjStr: string | URL.UrlWithStringQuery, redirectCount = 5): Promise<OEmbedUrlContentResult> {
	let urlObj: URL.UrlWithStringQuery;
	if (typeof urlObjStr === 'string') {
		urlObj = URL.parse(urlObjStr);
	} else {
		urlObj = urlObjStr;
	}

	const portsProtocol = new Map<string, string>(
		Object.entries({
			80: 'http:',
			8080: 'http:',
			443: 'https:',
		}),
	);

	const parsedUrl = _.pick(urlObj, ['host', 'hash', 'pathname', 'protocol', 'port', 'query', 'search', 'hostname']);
	const ignoredHosts = settings.get<string>('API_EmbedIgnoredHosts').replace(/\s/g, '').split(',') || [];
	if (parsedUrl.hostname && (ignoredHosts.includes(parsedUrl.hostname) || ipRangeCheck(parsedUrl.hostname, ignoredHosts))) {
		throw new Error('invalid host');
	}

	const safePorts = settings.get<string>('API_EmbedSafePorts').replace(/\s/g, '').split(',') || [];

	if (safePorts.length > 0 && parsedUrl.port && !safePorts.includes(parsedUrl.port)) {
		throw new Error('invalid/unsafe port');
	}

	if (safePorts.length > 0 && !parsedUrl.port && !safePorts.some((port) => portsProtocol.get(port) === parsedUrl.protocol)) {
		throw new Error('invalid/unsafe port');
	}

	const data = callbacks.run('oembed:beforeGetUrlContent', {
		urlObj,
		parsedUrl,
	});

	/*  This prop is neither passed or returned by the callback, so I'll just comment it for now
	if (data.attachments != null) {
		return data;
	} */

	const url = URL.format(data.urlObj);

	const sizeLimit = 250000;

	log.debug(`Fetching ${url} following redirects ${redirectCount} times`);
	const response = await fetch(
		url,
		{
			compress: true,
			follow: redirectCount,
			headers: {
				'User-Agent': `${settings.get('API_Embed_UserAgent')} Rocket.Chat/${Info.version}`,
				'Accept-Language': settings.get('Language') || 'en',
			},
			size: sizeLimit, // max size of the response body, this was not working as expected so I'm also manually verifying that on the iterator
		},
		settings.get('Allow_Invalid_SelfSigned_Certs'),
	);

	let totalSize = 0;
	const chunks = [];
	// @ts-expect-error from https://github.com/microsoft/TypeScript/issues/39051
	for await (const chunk of response.body) {
		totalSize += chunk.length;
		chunks.push(chunk);

		if (totalSize > sizeLimit) {
			log.warn({ msg: 'OEmbed request size exceeded', url });
			break;
		}
	}

	log.debug('Obtained response from server with length of', totalSize);
	const buffer = Buffer.concat(chunks);
	return {
		// @ts-expect-error - fetch types are kinda weird
		headers: Object.fromEntries(response.headers),
		body: toUtf8(response.headers.get('content-type') || 'text/plain', buffer),
		parsedUrl,
		statusCode: response.status,
	};
};

const getUrlMeta = async function (
	url: string,
	withFragment?: boolean,
): Promise<OEmbedUrlWithMetadata | OEmbedUrlContentResult | undefined> {
	log.debug('Obtaining metadata for URL', url);
	const urlObj = URL.parse(url);
	if (withFragment != null) {
		const queryStringObj = querystring.parse(urlObj.query || '');
		queryStringObj._escaped_fragment_ = '';
		urlObj.query = querystring.stringify(queryStringObj);
		let path = urlObj.pathname;
		if (urlObj.query != null) {
			path += `?${urlObj.query}`;
			urlObj.search = `?${urlObj.query}`;
		}
		urlObj.path = path;
	}
	log.debug('Fetching url content', urlObj.path);
	let content: OEmbedUrlContentResult | undefined;
	try {
		content = await getUrlContent(urlObj, 5);
	} catch (e) {
		log.error('Error fetching url content', e);
	}

	if (!content) {
		return;
	}

	if (content.attachments != null) {
		return content;
	}

	log.debug('Parsing metadata for URL', url);
	const metas: { [k: string]: string } = {};

	if (content?.body) {
		const escapeMeta = (name: string, value: string): string => {
			metas[name] = metas[name] || he.unescape(value);
			return metas[name];
		};
		content.body.replace(/<title[^>]*>([^<]*)<\/title>/gim, function (_meta, title) {
			return escapeMeta('pageTitle', title);
		});
		content.body.replace(/<meta[^>]*(?:name|property)=[']([^']*)['][^>]*\scontent=[']([^']*)['][^>]*>/gim, function (_meta, name, value) {
			return escapeMeta(camelCase(name), value);
		});
		content.body.replace(/<meta[^>]*(?:name|property)=["]([^"]*)["][^>]*\scontent=["]([^"]*)["][^>]*>/gim, function (_meta, name, value) {
			return escapeMeta(camelCase(name), value);
		});
		content.body.replace(/<meta[^>]*\scontent=[']([^']*)['][^>]*(?:name|property)=[']([^']*)['][^>]*>/gim, function (_meta, value, name) {
			return escapeMeta(camelCase(name), value);
		});
		content.body.replace(/<meta[^>]*\scontent=["]([^"]*)["][^>]*(?:name|property)=["]([^"]*)["][^>]*>/gim, function (_meta, value, name) {
			return escapeMeta(camelCase(name), value);
		});
		if (metas.fragment === '!' && withFragment == null) {
			return getUrlMeta(url, true);
		}
		delete metas.oembedHtml;
	}
	const headers: { [k: string]: string } = {};

	if (content?.headers) {
		const headerObj = content.headers;
		Object.keys(headerObj).forEach((header) => {
			headers[camelCase(header)] = headerObj[header];
		});
	}
	if (content && content.statusCode !== 200) {
		return;
	}
	return callbacks.run('oembed:afterParseContent', {
		url,
		meta: metas,
		headers,
		parsedUrl: content.parsedUrl,
		content,
	});
};

const getUrlMetaWithCache = async function (
	url: string,
	withFragment?: boolean,
): Promise<OEmbedUrlWithMetadata | undefined | OEmbedUrlContentResult> {
	log.debug('Getting oembed metadata for', url);
	const cache = await OEmbedCache.findOneById(url);

	if (cache != null) {
		log.debug('Found oembed metadata in cache for', url);
		return cache.data;
	}
	const data = await getUrlMeta(url, withFragment);
	if (data != null) {
		try {
			log.debug('Saving oembed metadata in cache for', url);
			await OEmbedCache.createWithIdAndData(url, data);
		} catch (_error) {
			log.error({ msg: 'OEmbed duplicated record', url });
		}
		return data;
	}
};

const hasOnlyContentLength = (obj: any): obj is { contentLength: string } => 'contentLength' in obj && Object.keys(obj).length === 1;
const hasOnlyContentType = (obj: any): obj is { contentType: string } => 'contentType' in obj && Object.keys(obj).length === 1;
const hasContentLengthAndContentType = (obj: any): obj is { contentLength: string; contentType: string } =>
	'contentLength' in obj && 'contentType' in obj && Object.keys(obj).length === 2;

const getRelevantHeaders = function (headersObj: {
	[key: string]: string;
}): { contentLength: string } | { contentType: string } | { contentLength: string; contentType: string } | void {
	const headers = {
		...(headersObj.contentLength && { contentLength: headersObj.contentLength }),
		...(headersObj.contentType && { contentType: headersObj.contentType }),
	};

	if (hasOnlyContentLength(headers) || hasOnlyContentType(headers) || hasContentLengthAndContentType(headers)) {
		return headers;
	}
};

const getRelevantMetaTags = function (metaObj: OEmbedMeta): Record<string, string> | void {
	const tags: Record<string, string> = {};
	Object.keys(metaObj).forEach((key) => {
		const value = metaObj[key];
		if (/^(og|fb|twitter|oembed|msapplication).+|description|title|pageTitle$/.test(key.toLowerCase()) && value && value.trim() !== '') {
			tags[key] = value;
		}
	});

	if (Object.keys(tags).length > 0) {
		return tags;
	}
};

const insertMaxWidthInOembedHtml = (oembedHtml?: string): string | undefined =>
	oembedHtml?.replace('iframe', 'iframe style="max-width: 100%;width:400px;height:225px"');

const rocketUrlParser = async function (message: IMessage): Promise<IMessage> {
	log.debug('Parsing message URLs');
	if (Array.isArray(message.urls)) {
		log.debug('URLs found', message.urls.length);
		const attachments: MessageAttachment[] = [];

		let changed = false;
		for await (const item of message.urls) {
			if (item.ignoreParse === true) {
				log.debug('URL ignored', item.url);
				break;
			}
			if (!isURL(item.url)) {
				break;
			}
			const data = await getUrlMetaWithCache(item.url);
			if (data != null) {
				if (isOEmbedUrlContentResult(data) && data.attachments) {
					attachments.push(...data.attachments);
					break;
				}
				if (isOEmbedUrlWithMetadata(data) && data.meta != null) {
					item.meta = getRelevantMetaTags(data.meta) || {};
					if (item.meta?.oembedHtml) {
						item.meta.oembedHtml = insertMaxWidthInOembedHtml(item.meta.oembedHtml) || '';
					}
				}
				if (data.headers != null) {
					const headers = getRelevantHeaders(data.headers);
					if (headers) {
						item.headers = headers;
					}
				}
				item.parsedUrl = data.parsedUrl;
				changed = true;
			}
		}
		if (attachments.length) {
			Messages.setMessageAttachments(message._id, attachments);
		}
		if (changed === true) {
			Messages.setUrlsById(message._id, message.urls);
		}
	}
	return message;
};

const OEmbed: {
	getUrlMeta: (url: string, withFragment?: boolean) => Promise<OEmbedUrlWithMetadata | undefined | OEmbedUrlContentResult>;
	getUrlMetaWithCache: (url: string, withFragment?: boolean) => Promise<OEmbedUrlWithMetadata | OEmbedUrlContentResult | undefined>;
	rocketUrlParser: (message: IMessage) => Promise<IMessage>;
} = {
	rocketUrlParser,
	getUrlMetaWithCache,
	getUrlMeta,
};

settings.watch('API_Embed', function (value) {
	if (value) {
		return callbacks.add(
			'afterSaveMessage',
			(message) => Promise.await(OEmbed.rocketUrlParser(message)),
			callbacks.priority.LOW,
			'API_Embed',
		);
	}
	return callbacks.remove('afterSaveMessage', 'API_Embed');
});

export { OEmbed };
