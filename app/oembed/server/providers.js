import URL from 'url';
import QueryString from 'querystring';

import { camelCase } from 'change-case';
import _ from 'underscore';

import { callbacks } from '../../callbacks';
import { OEmbed } from '../../models';

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

	loadProviders() {
		this.providers = [];
		const self = this;
		OEmbed.find().forEach(function(p) {
			if (p.urls) {
				self.registerProvider({
					urls: p.urls.map(function(u) { return new RegExp(u); }),
					endPoint: p.endPoint,
				});
			}
		});
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
providers.loadProviders();

export const oembed = {};

oembed.providers = providers;

callbacks.add('oembed:beforeGetUrlContent', function(data) {
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
}, callbacks.priority.MEDIUM, 'oembed-providers-before');

callbacks.add('oembed:afterParseContent', function(data) {
	if (data.parsedUrl && data.parsedUrl.query) {
		let queryString = data.parsedUrl.query;
		if (_.isString(data.parsedUrl.query)) {
			queryString = QueryString.parse(data.parsedUrl.query);
		}
		if (queryString.url != null) {
			const { url } = queryString;
			const provider = providers.getProviderForUrl(url);
			if (provider != null) {
				if (data.content && data.content.body) {
					try {
						const metas = JSON.parse(data.content.body);
						_.each(metas, function(value, key) {
							if (_.isString(value)) {
								data.meta[camelCase(`oembed_${ key }`)] = value;
							}
						});
						data.meta.oembedUrl = url;
					} catch (error) {
						console.log(error);
					}
				}
			}
		}
	}
	return data;
}, callbacks.priority.MEDIUM, 'oembed-providers-after');
