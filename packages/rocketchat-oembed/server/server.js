/*globals HTTPInternals, changeCase */
const indexOf = [].indexOf || function(item) { for (let i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) { return i; } } return -1; };

const URL = Npm.require('url');

const querystring = Npm.require('querystring');

const request = HTTPInternals.NpmModules.request.module;

const iconv = Npm.require('iconv-lite');

const ipRangeCheck = Npm.require('ip-range-check');

const he = Npm.require('he');

const jschardet = Npm.require('jschardet');

const OEmbed = {};

const getCharset = function(contentType, body) {
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

const toUtf8 = function(contentType, body) {
	return iconv.decode(body, getCharset(contentType, body));
};

const getUrlContent = function(urlObj, redirectCount, callback) {
	let ref;
	let ref1;
	if (redirectCount == null) {
		redirectCount = 5;
	}
	if (_.isString(urlObj)) {
		urlObj = URL.parse(urlObj);
	}

	const parsedUrl = _.pick(urlObj, ['host', 'hash', 'pathname', 'protocol', 'port', 'query', 'search', 'hostname']);
	const ignoredHosts = RocketChat.settings.get('API_EmbedIgnoredHosts').replace(/\s/g, '').split(',') || [];
	if ((ref = parsedUrl.hostname, indexOf.call(ignoredHosts, ref) >= 0) || ipRangeCheck(parsedUrl.hostname, ignoredHosts)) {
		return callback();
	}
	const safePorts = RocketChat.settings.get('API_EmbedSafePorts').replace(/\s/g, '').split(',') || [];
	if (parsedUrl.port && safePorts.length > 0 && (ref1 = parsedUrl.port, indexOf.call(safePorts, ref1) < 0)) {
		return callback();
	}
	const data = RocketChat.callbacks.run('oembed:beforeGetUrlContent', {
		urlObj,
		parsedUrl
	});
	if (data.attachments != null) {
		return callback(null, data);
	}
	const url = URL.format(data.urlObj);
	const opts = {
		url,
		strictSSL: !RocketChat.settings.get('Allow_Invalid_SelfSigned_Certs'),
		gzip: true,
		maxRedirects: redirectCount,
		headers: {
			'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36'
		}
	};
	let headers = null;
	let statusCode = null;
	let error = null;
	const chunks = [];
	let chunksTotalLength = 0;
	const stream = request(opts);
	stream.on('response', function(response) {
		statusCode = response.statusCode;
		headers = response.headers;
		if (response.statusCode !== 200) {
			return stream.abort();
		}
	});
	stream.on('data', function(chunk) {
		chunks.push(chunk);
		chunksTotalLength += chunk.length;
		if (chunksTotalLength > 250000) {
			return stream.abort();
		}
	});
	stream.on('end', Meteor.bindEnvironment(function() {
		if (error != null) {
			return callback(null, {
				error,
				parsedUrl
			});
		}
		const buffer = Buffer.concat(chunks);
		return callback(null, {
			headers,
			body: toUtf8(headers['content-type'], buffer),
			parsedUrl,
			statusCode
		});
	}));
	return stream.on('error', function(err) {
		return error = err;
	});
};

OEmbed.getUrlMeta = function(url, withFragment) {
	const getUrlContentSync = Meteor.wrapAsync(getUrlContent);
	const urlObj = URL.parse(url);
	if (withFragment != null) {
		const queryStringObj = querystring.parse(urlObj.query);
		queryStringObj._escaped_fragment_ = '';
		urlObj.query = querystring.stringify(queryStringObj);
		let path = urlObj.pathname;
		if (urlObj.query != null) {
			path += `?${ urlObj.query }`;
		}
		urlObj.path = path;
	}
	const content = getUrlContentSync(urlObj, 5);
	if (!content) {
		return;
	}
	if (content.attachments != null) {
		return content;
	}
	let metas = undefined;
	if (content && content.body) {
		metas = {};
		content.body.replace(/<title[^>]*>([^<]*)<\/title>/gmi, function(meta, title) {
			return metas.pageTitle != null ? metas.pageTitle : metas.pageTitle = he.unescape(title);
		});
		content.body.replace(/<meta[^>]*(?:name|property)=[']([^']*)['][^>]*\scontent=[']([^']*)['][^>]*>/gmi, function(meta, name, value) {
			let name1;
			return metas[name1 = changeCase.camelCase(name)] != null ? metas[name1] : metas[name1] = he.unescape(value);
		});
		content.body.replace(/<meta[^>]*(?:name|property)=["]([^"]*)["][^>]*\scontent=["]([^"]*)["][^>]*>/gmi, function(meta, name, value) {
			let name1;
			return metas[name1 = changeCase.camelCase(name)] != null ? metas[name1] : metas[name1] = he.unescape(value);
		});
		content.body.replace(/<meta[^>]*\scontent=[']([^']*)['][^>]*(?:name|property)=[']([^']*)['][^>]*>/gmi, function(meta, value, name) {
			let name1;
			return metas[name1 = changeCase.camelCase(name)] != null ? metas[name1] : metas[name1] = he.unescape(value);
		});
		content.body.replace(/<meta[^>]*\scontent=["]([^"]*)["][^>]*(?:name|property)=["]([^"]*)["][^>]*>/gmi, function(meta, value, name) {
			let name1;
			return metas[name1 = changeCase.camelCase(name)] != null ? metas[name1] : metas[name1] = he.unescape(value);
		});
		if (metas.fragment === '!' && (withFragment == null)) {
			return OEmbed.getUrlMeta(url, true);
		}
	}
	let headers = undefined;


	if (content && content.headers) {
		headers = {};
		const ref = content.headers;
		for (const header in ref) {
			const value = ref[header];
			headers[changeCase.camelCase(header)] = value;
		}
	}
	if (content && content.statusCode !== 200) {
		return;
	}
	const data = RocketChat.callbacks.run('oembed:afterParseContent', {
		meta: metas,
		headers,
		parsedUrl: content.parsedUrl,
		content
	});
	return data;
};

OEmbed.getUrlMetaWithCache = function(url, withFragment) {
	const cache = RocketChat.models.OEmbedCache.findOneById(url);
	if (cache != null) {
		return cache.data;
	}
	const data = OEmbed.getUrlMeta(url, withFragment);
	if (data != null) {
		try {
			RocketChat.models.OEmbedCache.createWithIdAndData(url, data);
		} catch (_error) {
			console.error('OEmbed duplicated record', url);
		}
		return data;
	}
};

const getRelevantHeaders = function(headersObj) {
	const headers = {};
	for (const key in headersObj) {
		const value = headersObj[key];
		let ref;
		if (((ref = key.toLowerCase()) === 'contenttype' || ref === 'contentlength') && (value != null ? value.trim() : void 0) !== '') {
			headers[key] = value;
		}
	}
	if (Object.keys(headers).length > 0) {
		return headers;
	}
};

const getRelevantMetaTags = function(metaObj) {
	const tags = {};
	for (const key in metaObj) {
		const value = metaObj[key];
		if (/^(og|fb|twitter|oembed|msapplication).+|description|title|pageTitle$/.test(key.toLowerCase()) && (value != null ? value.trim() : void 0) !== '') {
			tags[key] = value;
		}
	}
	if (Object.keys(tags).length > 0) {
		return tags;
	}
};

OEmbed.rocketUrlParser = function(message) {
	if (Array.isArray(message.urls)) {
		let attachments = [];
		let changed = false;
		message.urls.forEach(function(item) {
			if (item.ignoreParse === true) {
				return;
			}
			if (item.url.startsWith('grain://')) {
				changed = true;
				item.meta = {
					sandstorm: {
						grain: item.sandstormViewInfo
					}
				};
				return;
			}
			if (!/^https?:\/\//i.test(item.url)) {
				return;
			}
			const data = OEmbed.getUrlMetaWithCache(item.url);
			if (data != null) {
				if (data.attachments) {
					return attachments = _.union(attachments, data.attachments);
				} else {
					if (data.meta != null) {
						item.meta = getRelevantMetaTags(data.meta);
					}
					if (data.headers != null) {
						item.headers = getRelevantHeaders(data.headers);
					}
					item.parsedUrl = data.parsedUrl;
					return changed = true;
				}
			}
		});
		if (attachments.length) {
			RocketChat.models.Messages.setMessageAttachments(message._id, attachments);
		}
		if (changed === true) {
			RocketChat.models.Messages.setUrlsById(message._id, message.urls);
		}
	}
	return message;
};

RocketChat.settings.get('API_Embed', function(key, value) {
	if (value) {
		return RocketChat.callbacks.add('afterSaveMessage', OEmbed.rocketUrlParser, RocketChat.callbacks.priority.LOW, 'API_Embed');
	} else {
		return RocketChat.callbacks.remove('afterSaveMessage', 'API_Embed');
	}
});
