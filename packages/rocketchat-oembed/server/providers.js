/*globals changeCase */
import _ from 'underscore';

const URL = Npm.require('url');

const QueryString = Npm.require('querystring');

class Providers {
	constructor() {
		this.providers = [];
	}

	static getConsumerUrl(provider, url) {
		const urlObj = URL.parse(provider.endPoint, true);
		urlObj.query['url'] = url;
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
		return _.find(this.providers, function(provider) {
			const candidate = _.find(provider.urls, function(re) {
				return re.test(url);
			});
			return candidate != null;
		});
	}
}

const providers = new Providers();

providers.registerProvider({
	urls: [new RegExp('https?://soundcloud.com/\\S+')],
	endPoint: 'https://soundcloud.com/oembed?format=json&maxheight=150'
});

providers.registerProvider({
	urls: [new RegExp('https?://vimeo.com/[^/]+'), new RegExp('https?://vimeo.com/channels/[^/]+/[^/]+'), new RegExp('https://vimeo.com/groups/[^/]+/videos/[^/]+')],
	endPoint: 'https://vimeo.com/api/oembed.json?maxheight=200'
});

providers.registerProvider({
	urls: [new RegExp('https?://www.youtube.com/\\S+'), new RegExp('https?://youtu.be/\\S+')],
	endPoint: 'https://www.youtube.com/oembed?maxheight=200'
});

providers.registerProvider({
	urls: [new RegExp('https?://www.rdio.com/\\S+'), new RegExp('https?://rd.io/\\S+')],
	endPoint: 'https://www.rdio.com/api/oembed/?format=json&maxheight=150'
});

providers.registerProvider({
	urls: [new RegExp('https?://www.slideshare.net/[^/]+/[^/]+')],
	endPoint: 'https://www.slideshare.net/api/oembed/2?format=json&maxheight=200'
});

providers.registerProvider({
	urls: [new RegExp('https?://www.dailymotion.com/video/\\S+')],
	endPoint: 'https://www.dailymotion.com/services/oembed?maxheight=200'
});

RocketChat.oembed = {};

RocketChat.oembed.providers = providers;

RocketChat.callbacks.add('oembed:beforeGetUrlContent', function(data) {
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
}, RocketChat.callbacks.priority.MEDIUM, 'oembed-providers-before');

RocketChat.callbacks.add('oembed:afterParseContent', function(data) {
	if (data.parsedUrl && data.parsedUrl.query) {
		let queryString = data.parsedUrl.query;
		if (_.isString(data.parsedUrl.query)) {
			queryString = QueryString.parse(data.parsedUrl.query);
		}
		if (queryString.url != null) {
			const url = queryString.url;
			const provider = providers.getProviderForUrl(url);
			if (provider != null) {
				if (data.content && data.content.body) {
					try {
						const metas = JSON.parse(data.content.body);
						_.each(metas, function(value, key) {
							if (_.isString(value)) {
								return data.meta[changeCase.camelCase(`oembed_${ key }`)] = value;
							}
						});
						data.meta['oembedUrl'] = url;
					} catch (error) {
						console.log(error);
					}
				}
			}
		}
	}
	return data;
}, RocketChat.callbacks.priority.MEDIUM, 'oembed-providers-after');
