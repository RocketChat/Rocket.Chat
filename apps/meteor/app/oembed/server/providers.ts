import URL from 'url';
import QueryString from 'querystring';

import { camelCase } from 'change-case';
import _ from 'underscore';
import type { OEmbedMeta, OEmbedUrlContent, ParsedUrl, OEmbedProvider } from '@rocket.chat/core-typings';

import { callbacks } from '../../../lib/callbacks';
import { SystemLogger } from '../../../server/lib/logger/system';

type OEmbedExecutor = {
	providers: Providers;
};

class Providers {
	private providers: OEmbedProvider[];

	constructor() {
		this.providers = [];
	}

	static getConsumerUrl(provider: OEmbedProvider, url: string): string {
		const urlObj = new URL.URL(provider.endPoint);
		urlObj.searchParams.set('url', url);

		return URL.format(urlObj);
	}

	registerProvider(provider: OEmbedProvider): number {
		return this.providers.push(provider);
	}

	getProviders(): OEmbedProvider[] {
		return this.providers;
	}

	getProviderForUrl(url: string): OEmbedProvider | undefined {
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

export const oembed: OEmbedExecutor = {
	providers,
};

callbacks.add(
	'oembed:beforeGetUrlContent',
	function (data) {
		if (data.parsedUrl != null) {
			const url = URL.format(data.parsedUrl);
			const provider = providers.getProviderForUrl(url);
			if (provider != null) {
				const consumerUrl = Providers.getConsumerUrl(provider, url);

				const parsedConsumerUrl = URL.parse(consumerUrl, true);
				_.extend(data.parsedUrl, parsedConsumerUrl);

				data.urlObj.port = parsedConsumerUrl.port;
				data.urlObj.hostname = parsedConsumerUrl.hostname;
				data.urlObj.pathname = parsedConsumerUrl.pathname;
				data.urlObj.query = parsedConsumerUrl.query;

				delete data.urlObj.search;
				delete data.urlObj.host;
			}
		}
		return data;
	},
	callbacks.priority.MEDIUM,
	'oembed-providers-before',
);

const cleanupOembed = (data: {
	url: string;
	meta: OEmbedMeta;
	headers: { [k: string]: string };
	parsedUrl: ParsedUrl;
	content: OEmbedUrlContent;
}): {
	url: string;
	meta: Omit<OEmbedMeta, 'oembedHtml'>;
	headers: { [k: string]: string };
	parsedUrl: ParsedUrl;
	content: OEmbedUrlContent;
} => {
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
