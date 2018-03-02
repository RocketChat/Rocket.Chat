/* globals SystemLogger, RocketChat */
import Future from 'fibers/future';
import _ from 'underscore';

class SearchProviderService {

	constructor() {
		this.providers = {};
		this.activeProvider = undefined;
	}

	use(id, cb = function() {}) {

		if (!this.providers[id]) { throw new Error(`provider ${ id } cannot be found`); }

		const stopProvider = (callback) => {
			if (this.activeProvider) {

				SystemLogger.debug(`Stopping provider '${ this.activeProvider.key }'`);

				this.activeProvider.stop(callback);
			} else {
				callback();
			}
		};

		stopProvider((err)=>{

			if (!err) {

				this.activeProvider = undefined;

				SystemLogger.debug(`Start provider '${ id }'`);

				try {

					this.providers[id].run((err) => {
						if (err) {
							cb(err);
						} else {
							this.activeProvider = this.providers[id];
							cb();
						}
					});

				} catch (e) {
					cb(e);
				}
			} else {
				cb(err);
			}

		});

	}

	register(provider) {
		this.providers[provider.key] = provider;
	}

	start() {
		SystemLogger.debug('Load data for all providers');

		const providers = this.providers;

		//add settings for admininistration
		RocketChat.settings.addGroup('Search', function() {

			const self = this;

			self.add('Search.Provider', 'defaultProvider', {
				type: 'select',
				values: _.map(providers, (p) => { return {key:p.key, i18nLabel: p.i18nLabel}; }),
				public: true
			});

			_.chain(providers)
				.filter((provider) => provider.settings && provider.settings.length > 0)
				.each(function(provider) {
					self.section(provider.i18nLabel, function() {
						provider.settings.forEach((setting) => {

							const _options = {
								type: setting.type
							};

							_.extend(_options, setting.options);

							_options.enableQuery = _options.enableQuery || [];

							_options.enableQuery.push({
								_id: 'Search.Provider',
								value: provider.key
							});

							this.add(setting.id, setting.defaultValue, _options);
						});
					});
				});
		});

		const configProvider = _.debounce(() => {
			const providerId = RocketChat.settings.get('Search.Provider');

			if (providerId) {
				this.use(providerId);
			}
		}, 1000);

		RocketChat.settings.get(/^Search\./, configProvider);
	}

}

export const searchProviderService = new SearchProviderService();

Meteor.startup(() => {
	searchProviderService.start();
});

Meteor.methods({
	'rocketchatSearch.search'(text, context, payload) {
		const future = new Future();

		if (!searchProviderService.activeProvider) { future.throw(new Error('No active provider defined')); }

		payload = payload !== null ? payload : undefined;//TODO is this cleanup necessary?

		try {

			SystemLogger.debug(`Search:\n\tText:${ text }\n\tContext:${ JSON.stringify(context) }\n\tPayload:${ JSON.stringify(payload) }`);

			searchProviderService.activeProvider.search(text, context, payload, (error, data) => {
				if (error) {
					future.throw(error);
				} else {
					//TODO could do some access checks
					future.return(data);
				}
			});
		} catch (e) {
			future.throw(e);
		}

		return future.wait();
	},
	'rocketchatSearch.getProvider'() {
		console.log(searchProviderService.activeProvider);
		if (!searchProviderService.activeProvider) { return undefined; }

		return {
			key: searchProviderService.activeProvider.key,
			resultTemplate: searchProviderService.activeProvider.resultTemplate,
			settings: _.mapObject(searchProviderService.activeProvider.settingsAsMap, (setting) => {
				return setting.value;
			})
		};
	}
});

