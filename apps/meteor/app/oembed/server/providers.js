import URL from 'url';
import QueryString from 'querystring';

import { camelCase } from 'change-case';
import _ from 'underscore';

import { callbacks } from '../../../lib/callbacks';
import { SystemLogger } from '../../../server/lib/logger/system';

class Providers {
	constructor() {
		this.providers = [];
	}

	static getConsumerUrl(provider, url) {
		const urlObj = URL.parse(provider.endPoint, true);
		urlObj.query.url = url;
		delete urlObj.search;
		return URL.format(urlObj);
	}

	registerProvider(provider) {
		return this.providers.push(provider);
	}

	getProviders() {
		return this.providers;
	}

	getProviderForUrl(url) {
		return _.find(this.providers, function (provider) {
			const candidate = _.find(provider.urls, function (re) {
				return re.test(url);
			});
			return candidate != null;
		});
	}
}

const providers = new Providers();

providers.registerProvider({
	urls: [new RegExp('https?://soundcloud\\.com/\\S+')],
	endPoint: 'https://soundcloud.com/oembed?format=json&maxheight=150',
});

providers.registerProvider({
	urls: [
		new RegExp('https?://vimeo\\.com/[^/]+'),
		new RegExp('https?://vimeo\\.com/channels/[^/]+/[^/]+'),
		new RegExp('https://vimeo\\.com/groups/[^/]+/videos/[^/]+'),
	],
	endPoint: 'https://vimeo.com/api/oembed.json?maxheight=200',
});

providers.registerProvider({
	urls: [new RegExp('https?://www\\.youtube\\.com/\\S+'), new RegExp('https?://youtu\\.be/\\S+')],
	endPoint: 'https://www.youtube.com/oembed?maxheight=200',
});

providers.registerProvider({
	urls: [new RegExp('https?://www\\.rdio\\.com/\\S+'), new RegExp('https?://rd\\.io/\\S+')],
	endPoint: 'https://www.rdio.com/api/oembed/?format=json&maxheight=150',
});

providers.registerProvider({
	urls: [new RegExp('https?://www\\.slideshare\\.net/[^/]+/[^/]+')],
	endPoint: 'https://www.slideshare.net/api/oembed/2?format=json&maxheight=200',
});

providers.registerProvider({
	urls: [new RegExp('https?://www\\.dailymotion\\.com/video/\\S+')],
	endPoint: 'https://www.dailymotion.com/services/oembed?maxheight=200',
});

providers.registerProvider({
	urls: [new RegExp('https?://twitter\\.com/[^/]+/status/\\S+')],
	endPoint: 'https://publish.twitter.com/oembed',
});

providers.registerProvider({
	urls: [new RegExp('https?://(play|open)\\.spotify\\.com/(track|album|playlist|show)/\\S+')],
	endPoint: 'https://open.spotify.com/oembed',
});

export const oembed = {};

oembed.providers = providers;

callbacks.add(
	'oembed:beforeGetUrlContent',
	function (data) {
		if (data.parsedUrl != null) {
			const url = URL.format(data.parsedUrl);
			const provider = providers.getProviderForUrl(url);
			if (provider != null) {
				let consumerUrl = Providers.getConsumerUrl(provider, url);
				consumerUrl = URL.parse(consumerUrl, true);
				_.extend(data.parsedUrl, consumerUrl);
				data.urlObj.port = consumerUrl.port;
				data.urlObj.hostname = consumerUrl.hostname;
				data.urlObj.pathname = consumerUrl.pathname;
				data.urlObj.query = consumerUrl.query;
				delete data.urlObj.search;
				delete data.urlObj.host;
			}
		}
		return data;
	},
	callbacks.priority.MEDIUM,
	'oembed-providers-before',
);

const cleanupOembed = (data) => {
	if (!data?.meta) {
		return data;
	}

	// remove oembedHtml key from original meta
	const { oembedHtml, ...meta } = data.meta;

	return {
		...data,
		meta,
	};
};

callbacks.add(
	'oembed:afterParseContent',
	function (data) {
		if (!data || !data.url || !data.content?.body || !data.parsedUrl?.query) {
			return cleanupOembed(data);
		}

		let queryString = data.parsedUrl.query;
		if (_.isString(data.parsedUrl.query)) {
			queryString = QueryString.parse(data.parsedUrl.query);
		}

		if (!queryString.url) {
			return cleanupOembed(data);
		}

		const { url: originalUrl } = data;
		const provider = providers.getProviderForUrl(originalUrl);
		if (!provider) {
			return cleanupOembed(data);
		}

		const { url } = queryString;
		data.meta.oembedUrl = url;

		try {
			const metas = JSON.parse(data.content.body);
			_.each(metas, function (value, key) {
				if (_.isString(value)) {
					data.meta[camelCase(`oembed_${key}`)] = value;
				}
			});
		} catch (error) {
			SystemLogger.error(error);
		}
		return data;
	},
	callbacks.priority.MEDIUM,
	'oembed-providers-after',
);
