import URL from 'url';
import querystring from 'querystring';

import { camelCase } from 'change-case';
import _ from 'underscore';
import iconv from 'iconv-lite';
import ipRangeCheck from 'ip-range-check';
import he from 'he';
import jschardet from 'jschardet';

import { Messages } from '../../models/server';
import { OEmbedCache } from '../../models/server/raw';
import { callbacks } from '../../../lib/callbacks';
import { settings } from '../../settings/server';
import { isURL } from '../../utils/lib/isURL';
import { SystemLogger } from '../../../server/lib/logger/system';
import { Info } from '../../utils/server';
import { fetch } from '../../../server/lib/http/fetch';

const OEmbed = {};

//  Detect encoding
//  Priority:
//  Detected == HTTP Header > Detected == HTML meta > HTTP Header > HTML meta > Detected > Default (utf-8)
//  See also: https://www.w3.org/International/questions/qa-html-encoding-declarations.en#quickanswer
const getCharset = function (contentType, body) {
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

const toUtf8 = function (contentType, body) {
	return iconv.decode(body, getCharset(contentType, body));
};

const getUrlContent = async function (urlObj, redirectCount = 5) {
	if (_.isString(urlObj)) {
		urlObj = URL.parse(urlObj);
	}

	const portsProtocol = {
		80: 'http:',
		8080: 'http:',
		443: 'https:',
	};

	const parsedUrl = _.pick(urlObj, ['host', 'hash', 'pathname', 'protocol', 'port', 'query', 'search', 'hostname']);
	const ignoredHosts = settings.get('API_EmbedIgnoredHosts').replace(/\s/g, '').split(',') || [];
	if (ignoredHosts.includes(parsedUrl.hostname) || ipRangeCheck(parsedUrl.hostname, ignoredHosts)) {
		throw new Error('invalid host');
	}

	const safePorts = settings.get('API_EmbedSafePorts').replace(/\s/g, '').split(',') || [];

	if (safePorts.length > 0 && parsedUrl.port && !safePorts.includes(parsedUrl.port)) {
		throw new Error('invalid/unsafe port');
	}

	if (safePorts.length > 0 && !parsedUrl.port && !safePorts.some((port) => portsProtocol[port] === parsedUrl.protocol)) {
		throw new Error('invalid/unsafe port');
	}

	const data = callbacks.run('oembed:beforeGetUrlContent', {
		urlObj,
		parsedUrl,
	});
	if (data.attachments != null) {
		return data;
	}

	const url = URL.format(data.urlObj);

	const sizeLimit = 250000;

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
	for await (const chunk of response.body) {
		totalSize += chunk.length;
		chunks.push(chunk);

		if (totalSize > sizeLimit) {
			SystemLogger.info({ msg: 'OEmbed request size exceeded', url });
			break;
		}
	}

	const buffer = Buffer.concat(chunks);

	return {
		headers: Object.fromEntries(response.headers),
		body: toUtf8(response.headers.get('content-type'), buffer),
		parsedUrl,
		statusCode: response.status,
	};
};

OEmbed.getUrlMeta = function (url, withFragment) {
	const urlObj = URL.parse(url);
	if (withFragment != null) {
		const queryStringObj = querystring.parse(urlObj.query);
		queryStringObj._escaped_fragment_ = '';
		urlObj.query = querystring.stringify(queryStringObj);
		let path = urlObj.pathname;
		if (urlObj.query != null) {
			path += `?${urlObj.query}`;
			urlObj.search = `?${urlObj.query}`;
		}
		urlObj.path = path;
	}
	const content = Promise.await(getUrlContent(urlObj, 5));

	if (!content) {
		return;
	}

	if (content.attachments != null) {
		return content;
	}

	let metas = undefined;
	if (content && content.body) {
		metas = {};
		const escapeMeta = (name, value) => {
			metas[name] = metas[name] || he.unescape(value);
			return metas[name];
		};
		content.body.replace(/<title[^>]*>([^<]*)<\/title>/gim, function (meta, title) {
			return escapeMeta('pageTitle', title);
		});
		content.body.replace(/<meta[^>]*(?:name|property)=[']([^']*)['][^>]*\scontent=[']([^']*)['][^>]*>/gim, function (meta, name, value) {
			return escapeMeta(camelCase(name), value);
		});
		content.body.replace(/<meta[^>]*(?:name|property)=["]([^"]*)["][^>]*\scontent=["]([^"]*)["][^>]*>/gim, function (meta, name, value) {
			return escapeMeta(camelCase(name), value);
		});
		content.body.replace(/<meta[^>]*\scontent=[']([^']*)['][^>]*(?:name|property)=[']([^']*)['][^>]*>/gim, function (meta, value, name) {
			return escapeMeta(camelCase(name), value);
		});
		content.body.replace(/<meta[^>]*\scontent=["]([^"]*)["][^>]*(?:name|property)=["]([^"]*)["][^>]*>/gim, function (meta, value, name) {
			return escapeMeta(camelCase(name), value);
		});
		if (metas.fragment === '!' && withFragment == null) {
			return OEmbed.getUrlMeta(url, true);
		}
		delete metas.oembedHtml;
	}
	let headers = undefined;

	if (content?.headers) {
		headers = {};
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

OEmbed.getUrlMetaWithCache = async function (url, withFragment) {
	const cache = await OEmbedCache.findOneById(url);

	if (cache != null) {
		return cache.data;
	}
	const data = OEmbed.getUrlMeta(url, withFragment);
	if (data != null) {
		try {
			await OEmbedCache.createWithIdAndData(url, data);
		} catch (_error) {
			SystemLogger.error({ msg: 'OEmbed duplicated record', url });
		}
		return data;
	}
};

const getRelevantHeaders = function (headersObj) {
	const headers = {};
	Object.keys(headersObj).forEach((key) => {
		const value = headersObj[key];
		const lowerCaseKey = key.toLowerCase();
		if ((lowerCaseKey === 'contenttype' || lowerCaseKey === 'contentlength') && value && value.trim() !== '') {
			headers[key] = value;
		}
	});

	if (Object.keys(headers).length > 0) {
		return headers;
	}
};

const getRelevantMetaTags = function (metaObj) {
	const tags = {};
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

const insertMaxWidthInOembedHtml = (oembedHtml) => oembedHtml?.replace('iframe', 'iframe style="max-width: 100%;width:400px;height:225px"');

OEmbed.rocketUrlParser = async function (message) {
	if (Array.isArray(message.urls)) {
		const attachments = [];
		let changed = false;
		for await (const item of message.urls) {
			if (item.ignoreParse === true) {
				return;
			}
			if (!isURL(item.url)) {
				return;
			}
			const data = await OEmbed.getUrlMetaWithCache(item.url);
			if (data != null) {
				if (data.attachments) {
					attachments.push(...data.attachments);
					return;
				}
				if (data.meta != null) {
					item.meta = getRelevantMetaTags(data.meta);
					if (item.meta && item.meta.oembedHtml) {
						item.meta.oembedHtml = insertMaxWidthInOembedHtml(item.meta.oembedHtml);
					}
				}
				if (data.headers != null) {
					item.headers = getRelevantHeaders(data.headers);
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
