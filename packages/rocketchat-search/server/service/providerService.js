/* globals RocketChat */
import Future from 'fibers/future';
import _ from 'underscore';

import {validationService} from '../service/validationService';
import SearchLogger from '../logger/logger';

class SearchProviderService {

	constructor() {
		this.providers = {};
		this.activeProvider = undefined;
	}

	/**
	 * Stop current provider (if there is one) and start the new
	 * @param id the id of the provider which should be started
	 * @param cb a possible callback if provider is active or not (currently not in use)
	 */
	use(id, cb = function() {}) {

		if (!this.providers[id]) { throw new Error(`provider ${ id } cannot be found`); }

		let reason = 'switch';

		if (!this.activeProvider) {
			reason = 'startup';
		} else if (this.activeProvider.key === this.providers[id].key) {
			reason = 'update';
		}

		const stopProvider = (callback) => {
			if (this.activeProvider) {

				SearchLogger.debug(`Stopping provider '${ this.activeProvider.key }'`);

				this.activeProvider.stop(callback);
			} else {
				callback();
			}
		};

		stopProvider((err)=>{

			if (!err) {

				this.activeProvider = undefined;

				SearchLogger.debug(`Start provider '${ id }'`);

				try {

					this.providers[id].run(reason, (err) => {
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

	/**
	 * Registers a search provider on system startup
	 * @param provider
	 */
	register(provider) {
		this.providers[provider.key] = provider;
	}

	/**
	 * Starts the service (loads provider settings for admin ui, add lister not setting changes, enable current provider
	 */
	start() {
		SearchLogger.debug('Load data for all providers');

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

		//add listener to react on setting changes
		const configProvider = _.debounce(Meteor.bindEnvironment(() => {
			const providerId = RocketChat.settings.get('Search.Provider');

			if (providerId) {
				this.use(providerId);
			}

		}), 1000);

		RocketChat.settings.get(/^Search\./, configProvider);
	}

}

export const searchProviderService = new SearchProviderService();

Meteor.startup(() => {
	searchProviderService.start();
});

Meteor.methods({
	/**
	 * Search using the current search provider and check if results are valid for the user. The search result has
	 * the format {messages:{start:0,numFound:1,docs:[{...}]},users:{...},rooms:{...}}
	 * @param text the search text
	 * @param context the context (uid, rid)
	 * @param payload custom payload (e.g. for paging)
	 * @returns {*}
	 */
	'rocketchatSearch.search'(text, context, payload) {
		const future = new Future();

		if (!searchProviderService.activeProvider) { future.throw(new Error('No active provider defined')); }

		payload = payload !== null ? payload : undefined;//TODO is this cleanup necessary?

		try {

			SearchLogger.debug('query: ', `Search:\n\tText:${ text }\n\tContext:${ JSON.stringify(context) }\n\tPayload:${ JSON.stringify(payload) }`);

			searchProviderService.activeProvider.search(text, context, payload, (error, data) => {
				if (error) {
					future.throw(error);
				} else {
					future.return(validationService.validateSearchResult(data));
				}
			});
		} catch (e) {
			future.throw(e);
		}

		return future.wait();
	},
	/**
	 * Get the current provider with key, description, resultTemplate, suggestionItemTemplate and settings (as Map)
	 * @returns {*}
	 */
	'rocketchatSearch.getProvider'() {
		if (!searchProviderService.activeProvider) { return undefined; }

		return {
			key: searchProviderService.activeProvider.key,
			description: searchProviderService.activeProvider.i18nDescription,
			resultTemplate: searchProviderService.activeProvider.resultTemplate,
			suggestionItemTemplate: searchProviderService.activeProvider.suggestionItemTemplate,
			settings: _.mapObject(searchProviderService.activeProvider.settingsAsMap, (setting) => {
				return setting.value;
			})
		};
	}
});

