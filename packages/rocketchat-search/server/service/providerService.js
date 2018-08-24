/* globals RocketChat */
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
	use(id) {

		return new Promise((resolve, reject) => {
			if (!this.providers[id]) { throw new Error(`provider ${ id } cannot be found`); }

			let reason = 'switch';

			if (!this.activeProvider) {
				reason = 'startup';
			} else if (this.activeProvider.key === this.providers[id].key) {
				reason = 'update';
			}

			const stopProvider = () => {
				return new Promise((resolve, reject) => {
					if (this.activeProvider) {

						SearchLogger.debug(`Stopping provider '${ this.activeProvider.key }'`);

						this.activeProvider.stop(resolve, reject);
					} else {
						resolve();
					}
				});
			};

			stopProvider().then(() => {
				this.activeProvider = undefined;

				SearchLogger.debug(`Start provider '${ id }'`);

				try {

					this.providers[id].run(reason).then(() => {
						this.activeProvider = this.providers[id];
						resolve();
					}, reject);

				} catch (e) {
					reject(e);
				}
			}, reject);

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
				values: Object.keys(providers).map((key) => { return {key, i18nLabel: providers[key].i18nLabel}; }),
				public: true,
				i18nLabel: 'Search_Provider'
			});

			Object.keys(providers)
				.filter((key) => providers[key].settings && providers[key].settings.length > 0)
				.forEach(function(key) {
					self.section(providers[key].i18nLabel, function() {
						providers[key].settings.forEach((setting) => {

							const _options = {
								type: setting.type,
								...setting.options
							};

							_options.enableQuery = _options.enableQuery || [];

							_options.enableQuery.push({
								_id: 'Search.Provider',
								value: key
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
				this.use(providerId);//TODO do something with success and errors
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

		return new Promise((resolve, reject) => {

			payload = payload !== null ? payload : undefined;//TODO is this cleanup necessary?

			try {

				if (!searchProviderService.activeProvider) {
					throw new Error('Provider currently not active');
				}

				SearchLogger.debug('search: ', `\n\tText:${ text }\n\tContext:${ JSON.stringify(context) }\n\tPayload:${ JSON.stringify(payload) }`);

				searchProviderService.activeProvider.search(text, context, payload, (error, data) => {
					if (error) {
						reject(error);
					} else {
						resolve(validationService.validateSearchResult(data));
					}
				});
			} catch (e) {
				reject(e);
			}
		});
	},
	'rocketchatSearch.suggest'(text, context, payload) {

		return new Promise((resolve, reject) => {
			payload = payload !== null ? payload : undefined;//TODO is this cleanup necessary?

			try {

				if (!searchProviderService.activeProvider) { throw new Error('Provider currently not active'); }

				SearchLogger.debug('suggest: ', `\n\tText:${ text }\n\tContext:${ JSON.stringify(context) }\n\tPayload:${ JSON.stringify(payload) }`);

				searchProviderService.activeProvider.suggest(text, context, payload, (error, data) => {
					if (error) {
						reject(error);
					} else {
						resolve(data);
					}
				});
			} catch (e) {
				reject(e);
			}
		});
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
			icon: searchProviderService.activeProvider.iconName,
			resultTemplate: searchProviderService.activeProvider.resultTemplate,
			supportsSuggestions: searchProviderService.activeProvider.supportsSuggestions,
			suggestionItemTemplate: searchProviderService.activeProvider.suggestionItemTemplate,
			settings: _.mapObject(searchProviderService.activeProvider.settingsAsMap, (setting) => {
				return setting.value;
			})
		};
	}
});

