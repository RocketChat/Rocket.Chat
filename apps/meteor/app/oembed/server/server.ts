import type {
	OEmbedUrlContentResult,
	OEmbedUrlWithMetadata,
	IMessage,
	MessageAttachment,
	OEmbedMeta,
	MessageUrl,
} from '@rocket.chat/core-typings';
import { isOEmbedUrlWithMetadata } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Messages, OEmbedCache } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { camelCase } from 'change-case';
import he from 'he';
import iconv from 'iconv-lite';
import ipRangeCheck from 'ip-range-check';
import jschardet from 'jschardet';

import { callbacks } from '../../../lib/callbacks';
import { isURL } from '../../../lib/utils/isURL';
import { settings } from '../../settings/server';
import { Info } from '../../utils/rocketchat.info';

const MAX_EXTERNAL_URL_PREVIEWS = 5;
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

const getUrlContent = async (urlObj: URL, redirectCount = 5): Promise<OEmbedUrlContentResult> => {
	const portsProtocol = new Map<string, string>(
		Object.entries({
			80: 'http:',
			8080: 'http:',
			443: 'https:',
		}),
	);

	const ignoredHosts = settings.get<string>('API_EmbedIgnoredHosts').replace(/\s/g, '').split(',') || [];
	if (urlObj.hostname && (ignoredHosts.includes(urlObj.hostname) || ipRangeCheck(urlObj.hostname, ignoredHosts))) {
		throw new Error('invalid host');
	}

	const safePorts = settings.get<string>('API_EmbedSafePorts').replace(/\s/g, '').split(',') || [];

	// checks if the URL port is in the safe ports list
	if (safePorts.length > 0 && urlObj.port && !safePorts.includes(urlObj.port)) {
		throw new Error('invalid/unsafe port');
	}

	// if port is not detected, use protocol to verify instead
	if (safePorts.length > 0 && !urlObj.port && !safePorts.some((port) => portsProtocol.get(port) === urlObj.protocol)) {
		throw new Error('invalid/unsafe port');
	}

	const data = await callbacks.run('oembed:beforeGetUrlContent', {
		urlObj,
	});

	const url = data.urlObj.toString();
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
				...data.headerOverrides,
			},
			size: sizeLimit, // max size of the response body, this was not working as expected so I'm also manually verifying that on the iterator
		},
		settings.get('Allow_Invalid_SelfSigned_Certs'),
	);

	let totalSize = 0;
	const chunks = [];
	for await (const chunk of response.body) {
		totalSize += chunk.length;
		chunks.push(chunk as Buffer);

		if (totalSize > sizeLimit) {
			log.warn({ msg: 'OEmbed request size exceeded', url });
			break;
		}
	}

	log.debug('Obtained response from server with length of', totalSize);
	const buffer = Buffer.concat(chunks);

	return {
		headers: Object.fromEntries(response.headers),
		body: toUtf8(response.headers.get('content-type') || 'text/plain', buffer),
		statusCode: response.status,
	};
};

const parseUrl = async function (url: string): Promise<{ urlPreview: MessageUrl; foundMeta: boolean }> {
	const parsedUrlObject: MessageUrl = { url, meta: {} };
	let foundMeta = false;
	if (!isURL(url)) {
		return { urlPreview: parsedUrlObject, foundMeta };
	}

	const data = await getUrlMetaWithCache(url);
	if (!data) {
		return { urlPreview: parsedUrlObject, foundMeta };
	}

	if (isOEmbedUrlWithMetadata(data) && data.meta) {
		parsedUrlObject.meta = getRelevantMetaTags(data.meta) || {};
		if (parsedUrlObject.meta?.oembedHtml) {
			parsedUrlObject.meta.oembedHtml = insertMaxWidthInOembedHtml(parsedUrlObject.meta.oembedHtml) || '';
		}
	}

	foundMeta = true;
	return {
		urlPreview: {
			...parsedUrlObject,
			...((parsedUrlObject.headers || data.headers) && {
				headers: {
					...parsedUrlObject.headers,
					...(data.headers?.contentLength && { contentLength: data.headers.contentLength }),
					...(data.headers?.contentType && { contentType: data.headers.contentType }),
				},
			}),
		},
		foundMeta,
	};
};

const getUrlMeta = async function (
	url: string,
	withFragment?: boolean,
): Promise<OEmbedUrlWithMetadata | OEmbedUrlContentResult | undefined> {
	log.debug('Obtaining metadata for URL', url);
	const urlObj = new URL(url);

	if (withFragment) {
		urlObj.searchParams.set('_escaped_fragment_', '');
	}

	log.debug('Fetching url content', urlObj.toString());
	let content: OEmbedUrlContentResult | undefined;
	try {
		content = await getUrlContent(urlObj, 5);
	} catch (err) {
		log.error({ msg: 'Error fetching url content', err });
	}

	if (!content) {
		return;
	}

	log.debug('Parsing metadata for URL', url);
	const metas: { [k: string]: string } = {};

	if (content?.body) {
		const escapeMeta = (name: string, value: string): string => {
			metas[name] = metas[name] || he.unescape(value);
			return metas[name];
		};
		content.body.replace(/<title[^>]*>([^<]*)<\/title>/gim, (_meta, title) => {
			return escapeMeta('pageTitle', title);
		});
		content.body.replace(/<meta[^>]*(?:name|property)=[']([^']*)['][^>]*\scontent=[']([^']*)['][^>]*>/gim, (_meta, name, value) => {
			return escapeMeta(camelCase(name), value);
		});
		content.body.replace(/<meta[^>]*(?:name|property)=["]([^"]*)["][^>]*\scontent=["]([^"]*)["][^>]*>/gim, (_meta, name, value) => {
			return escapeMeta(camelCase(name), value);
		});
		content.body.replace(/<meta[^>]*\scontent=[']([^']*)['][^>]*(?:name|property)=[']([^']*)['][^>]*>/gim, (_meta, value, name) => {
			return escapeMeta(camelCase(name), value);
		});
		content.body.replace(/<meta[^>]*\scontent=["]([^"]*)["][^>]*(?:name|property)=["]([^"]*)["][^>]*>/gim, (_meta, value, name) => {
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
		content,
	});
};

const getUrlMetaWithCache = async function (
	url: string,
	withFragment?: boolean,
): Promise<OEmbedUrlWithMetadata | undefined | OEmbedUrlContentResult> {
	log.debug('Getting oembed metadata for', url);
	const cache = await OEmbedCache.findOneById(url);

	if (cache) {
		log.debug('Found oembed metadata in cache for', url);
		return cache.data;
	}

	const data = await getUrlMeta(url, withFragment);

	if (!data) {
		return;
	}

	try {
		log.debug('Saving oembed metadata in cache for', url);
		await OEmbedCache.createWithIdAndData(url, data);
	} catch (_error) {
		log.error({ msg: 'OEmbed duplicated record', url });
	}

	return data;
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

	if (!Array.isArray(message.urls)) {
		return message;
	}

	log.debug('URLs found', message.urls.length);

	if (
		(message.attachments && message.attachments.length > 0) ||
		message.urls.filter((item) => !item.url.includes(settings.get('Site_Url'))).length > MAX_EXTERNAL_URL_PREVIEWS
	) {
		log.debug('All URL ignored');
		return message;
	}

	const attachments: MessageAttachment[] = [];

	let changed = false;
	for await (const item of message.urls) {
		if (item.ignoreParse === true) {
			log.debug('URL ignored', item.url);
			continue;
		}

		const { urlPreview, foundMeta } = await parseUrl(item.url);

		Object.assign(item, foundMeta ? urlPreview : {});
		changed = changed || foundMeta;
	}

	if (attachments.length) {
		await Messages.setMessageAttachments(message._id, attachments);
	}

	if (changed === true) {
		await Messages.setUrlsById(message._id, message.urls);
	}

	return message;
};

const OEmbed: {
	getUrlMeta: (url: string, withFragment?: boolean) => Promise<OEmbedUrlWithMetadata | undefined | OEmbedUrlContentResult>;
	getUrlMetaWithCache: (url: string, withFragment?: boolean) => Promise<OEmbedUrlWithMetadata | OEmbedUrlContentResult | undefined>;
	rocketUrlParser: (message: IMessage) => Promise<IMessage>;
	parseUrl: (url: string) => Promise<{ urlPreview: MessageUrl; foundMeta: boolean }>;
} = {
	rocketUrlParser,
	getUrlMetaWithCache,
	getUrlMeta,
	parseUrl,
};

settings.watch('API_Embed', (value) => {
	if (value) {
		return callbacks.add('afterSaveMessage', (message) => OEmbed.rocketUrlParser(message), callbacks.priority.LOW, 'API_Embed');
	}
	return callbacks.remove('afterSaveMessage', 'API_Embed');
});

export { OEmbed };
