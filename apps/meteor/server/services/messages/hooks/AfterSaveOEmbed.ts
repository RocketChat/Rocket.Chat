import type {
	OEmbedUrlContentResult,
	MessageUrl,
	OEmbedUrlWithMetadata,
	OEmbedMeta,
	IMessage,
	OEmbedUrlContent,
} from '@rocket.chat/core-typings';
import { isOEmbedUrlWithMetadata } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { OEmbedCache, Messages } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { isAbsoluteURL } from '@rocket.chat/tools';
import he from 'he';
import iconv from 'iconv-lite';
import ipRangeCheck from 'ip-range-check';
import jschardet from 'jschardet';
import { camelCase } from 'lodash';

import { Info } from '../../../../rocketchat.info';
import { settings } from '../../../settings';
import { afterParseUrlContent, beforeGetUrlContent } from '../lib/oembed/providers';

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

export const isIgnoredHost = (hostname: string | undefined): boolean => {
	const normalizedHost = hostname
		?.toLowerCase()
		.replace(/\.+$/, '')
		.replace(/^\[|\]$/g, '');
	if (!normalizedHost) {
		return false;
	}

	const ignoredHosts =
		settings
			.get<string>('API_EmbedIgnoredHosts')
			?.replace(/\s/g, '')
			.split(',')
			.filter(Boolean)
			.map((host) =>
				host
					.toLowerCase()
					.replace(/\.+$/, '')
					.replace(/^\[|\]$/g, ''),
			) || [];

	if (!ignoredHosts.length) {
		return false;
	}

	const exactHosts = ignoredHosts.filter((h) => !h.includes('*'));
	if (exactHosts.includes(normalizedHost) || ipRangeCheck(normalizedHost, exactHosts)) {
		return true;
	}

	return ignoredHosts
		.filter((h) => h.includes('*'))
		.some((pattern) => {
			const validationRegex = /^(?:\*\.)?(?:\*|[a-z0-9-]+)(?:\.(?:\*|[a-z0-9-]+))*$/i;
			if (!validationRegex.test(pattern) || pattern === '*') {
				return false;
			}

			const escaped = pattern.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&');
			const source = `^${escaped.replace(/\*/g, '[^.]*')}$`;

			try {
				const regex = new RegExp(source, 'i');
				return regex.test(normalizedHost);
			} catch {
				// fail safe on invalid patterns
				return false;
			}
		});
};

const portsProtocol = new Map<string, string>(
	Object.entries({
		80: 'http:',
		8080: 'http:',
		443: 'https:',
	}),
);

export const isSafePortAndProtocol = (targetUrlObj: URL): boolean => {
	const safePorts = settings.get<string>('API_EmbedSafePorts')?.replace(/\s/g, '').split(',').filter(Boolean) || [];

	// checks if the URL port is in the safe ports list
	if (safePorts.length > 0 && targetUrlObj.port && !safePorts.includes(targetUrlObj.port)) {
		return false;
	}

	// if port is not detected, use protocol to verify instead
	if (safePorts.length > 0 && !targetUrlObj.port && !safePorts.some((port) => portsProtocol.get(port) === targetUrlObj.protocol)) {
		return false;
	}

	return true;
};

export const validateUrlPortsAndProtocol = (targetUrlObj: URL): void => {
	if (!isSafePortAndProtocol(targetUrlObj)) {
		throw new Error('invalid/unsafe port');
	}
};

export const getUrlContent = async (urlObj: URL, redirectCount = 5): Promise<OEmbedUrlContent> => {
	if (isIgnoredHost(urlObj.hostname)) {
		throw new Error('host is ignored');
	}

	validateUrlPortsAndProtocol(urlObj);

	const data = beforeGetUrlContent({ urlObj });

	if (isIgnoredHost(data.urlObj.hostname)) {
		throw new Error('host is ignored');
	}

	validateUrlPortsAndProtocol(data.urlObj);

	const url = data.urlObj.toString();
	const sizeLimit = 250000;

	log.debug({ msg: 'Fetching URL for OEmbed', url, redirectCount });
	const start = Date.now();
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
			timeout: settings.get<number>('API_EmbedTimeout') * 1000,
			size: sizeLimit, // max size of the response body, this was not working as expected so I'm also manually verifying that on the iterator
			ignoreSsrfValidation: false,
			allowList: settings.get<string>('SSRF_Allowlist'),
			onRedirect: (nextUrlObj: URL) => {
				if (isIgnoredHost(nextUrlObj.hostname)) {
					throw new Error('host is ignored');
				}
				validateUrlPortsAndProtocol(nextUrlObj);
			},
		},
		settings.get('Allow_Invalid_SelfSigned_Certs'),
	);
	const end = Date.now();

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

	log.debug({ msg: 'Obtained response from server', length: totalSize, timeSpent: `${end - start}ms` });
	const buffer = Buffer.concat(chunks);

	let effectiveUrlObj = data.urlObj;
	if (response.url) {
		try {
			effectiveUrlObj = new URL(response.url);
		} catch {
			// fallback to data.urlObj
		}
	}

	return {
		headers: Object.fromEntries(response.headers),
		body: toUtf8(response.headers.get('content-type') || 'text/plain', buffer),
		statusCode: response.status,
		urlObj: effectiveUrlObj,
	};
};

const parseUrl = async function (url: string): Promise<{ urlPreview: MessageUrl; foundMeta: boolean }> {
	const parsedUrlObject: MessageUrl = { url, meta: {} };
	let foundMeta = false;
	if (!isAbsoluteURL(url)) {
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

export const getUrlMeta = async function (
	url: string,
	withFragment?: boolean,
	parsedUrl?: URL,
): Promise<OEmbedUrlWithMetadata | OEmbedUrlContentResult | undefined> {
	log.debug({ msg: 'Obtaining metadata for URL', url });
	const urlObj = new URL(parsedUrl ? parsedUrl.toString() : url);

	if (withFragment) {
		urlObj.searchParams.set('_escaped_fragment_', '');
	}

	log.debug({ msg: 'Fetching URL content', url: urlObj.toString() });
	let content: OEmbedUrlContent | undefined;
	try {
		content = await getUrlContent(urlObj, 5);
	} catch (err) {
		log.error({ msg: 'Error fetching URL content', url: urlObj.toString(), err });
	}

	if (!content) {
		return;
	}

	log.debug({ msg: 'Parsing metadata for URL', url });
	const metas: OEmbedMeta = {} as any;

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
	const effectiveUrl = content.urlObj.toString();
	const parsedData = afterParseUrlContent({
		url,
		meta: metas,
		headers,
		content,
	});

	if (parsedData) {
		return {
			...parsedData,
			url: effectiveUrl,
		};
	}

	return parsedData;
};

export const getUrlMetaWithCache = async function (
	url: string,
	withFragment?: boolean,
): Promise<OEmbedUrlWithMetadata | undefined | OEmbedUrlContentResult> {
	log.debug({ msg: 'Getting OEmbed metadata for URL', url });

	let urlObj: URL;
	try {
		urlObj = new URL(url);
	} catch {
		return;
	}

	if (isIgnoredHost(urlObj.hostname) || !isSafePortAndProtocol(urlObj)) {
		log.debug({ msg: 'Host or port is ignored/unsafe for OEmbed', url, host: urlObj.hostname });
		return;
	}

	const cache = await OEmbedCache.findOneById(url);

	if (cache) {
		if (cache.data && typeof cache.data === 'object' && 'url' in cache.data && typeof cache.data.url === 'string') {
			try {
				const cachedTargetUrl = new URL(cache.data.url);
				if (isIgnoredHost(cachedTargetUrl.hostname) || !isSafePortAndProtocol(cachedTargetUrl)) {
					log.debug({ msg: 'Cached target host or port is ignored/unsafe for OEmbed', url, targetHost: cachedTargetUrl.hostname });
					return;
				}
			} catch {
				// Reject malformed cached target URLs
				return;
			}
		}

		log.debug({ msg: 'Found OEmbed metadata in cache for URL', url });
		return cache.data as OEmbedUrlWithMetadata | OEmbedUrlContentResult;
	}

	const data = await getUrlMeta(url, withFragment, urlObj);

	if (!data) {
		return;
	}

	try {
		log.debug({ msg: 'Saving OEmbed metadata in cache for URL', url });
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
	log.debug({ msg: 'Parsing message URLs' });

	if (!settings.get('API_Embed')) {
		return message;
	}

	if (!Array.isArray(message.urls)) {
		return message;
	}

	log.debug({ msg: 'URLs found in message', count: message.urls.length });

	if (
		(message.attachments && message.attachments.length > 0) ||
		message.urls.filter((item) => !item.url.includes(settings.get('Site_Url'))).length > MAX_EXTERNAL_URL_PREVIEWS
	) {
		log.debug({ msg: 'All URLs ignored for OEmbed' });
		return message;
	}

	let changed = false;
	for await (const item of message.urls) {
		if (item.ignoreParse === true) {
			log.debug({ msg: 'URL ignored for OEmbed', url: item.url });
			continue;
		}

		const { urlPreview, foundMeta } = await parseUrl(item.url);

		Object.assign(item, foundMeta ? urlPreview : {});
		changed = changed || foundMeta;
	}

	if (changed === true) {
		await Messages.setUrlsById(message._id, message.urls);
	}

	return message;
};

export const OEmbed: {
	rocketUrlParser: (message: IMessage) => Promise<IMessage>;
	parseUrl: (url: string) => Promise<{ urlPreview: MessageUrl; foundMeta: boolean }>;
} = {
	rocketUrlParser,
	parseUrl,
};
