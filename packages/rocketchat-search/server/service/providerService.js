/* globals SystemLogger, RocketChat */
import Future from 'fibers/future';
import _ from 'underscore';

class SearchSettings {

	static get BASE_ID() { return 'rocketchat.search.'; }

	static setValue(name, value) {
		const id = `${ this.BASE_ID }${ name }`;
		if (RocketChat.models.Settings.findById(id).fetch()[0]) {
			RocketChat.models.Settings.updateValueById(id, value);
		} else {
			RocketChat.models.Settings.createWithIdAndValue(id, value);
		}
	}

	static getValue(name) {
		const value = RocketChat.models.Settings.findById(`${ this.BASE_ID }${ name }`).fetch()[0];
		return value ? value.value : undefined;
	}

}

class SearchProviderService {

	constructor() {
		this.enabled = false;
		this.providers = {};
		this.activeProvider = undefined;
	}

	get DEFAULT_ID() {
		return 'search.provider.default';
	}

	use(id, configuration, enabled) {

		const future = new Future();

		if (!this.providers[id]) { throw new Error(`provider ${ id } cannot be found`); }

		const stopProvider = (callback) => {
			if (this.activeProvider) {

				SystemLogger.debug(`Stopping provider '${ this.activeProvider.id }'`);

				this.activeProvider.stop(callback);
			} else {
				callback();
			}
		};

		stopProvider((err)=>{

			if (!err) {
				SearchSettings.setValue('enabled', enabled);
				this.enabled = enabled;

				SystemLogger.debug(`Initiating provider '${ id }'`, JSON.stringify(configuration, null, 2));

				try {
					this.activeProvider = this.providers[id].init(configuration);

					SystemLogger.debug(`Store configuration for provider '${ id }'`);

					SearchSettings.setValue(`provider.${ id }`, configuration);
					SearchSettings.setValue('provider', id);

					SystemLogger.debug(`Start provider '${ id }'`);

					this.activeProvider.start((err) => {
						if (err) {
							future.throw(err);
						} else {
							future.return();
						}
					});

				} catch (e) {
					future.throw(e);
				}
			} else {
				future.throw(err);
			}

		});

		return future.wait();

	}

	register(provider) {
		this.providers[provider.id] = provider;
	}

	start() {
		SystemLogger.debug('Load data for all providers');

		Object.keys(this.providers).forEach(key => {

			SystemLogger.info(`Initialize search provider ${ key }`);

			const configuration = SearchSettings.getValue(`provider.${ key }`);

			this.providers[key].init(configuration);
		});

		const active = SearchSettings.getValue('provider');

		if (active) {
			this.activeProvider = this.providers[active];
		} else {
			this.activeProvider = this.providers[this.DEFAULT_ID];
		}

		this.enabled = SearchSettings.getValue('enabled') && SearchSettings.getValue('enabled') === true;

		if (!this.activeProvider) {
			SystemLogger.warn(`Current active provider ${ active } is not running on the system`);
		} else if (this.enabled) {
			this.activeProvider.start((err) => {
				if (err) {
					SystemLogger.error('Could not start search provider', err);
				} else {
					SystemLogger.info('Search provider started successfully');
				}
			});
		}
	}

}

export const searchProviderService = new SearchProviderService();

Meteor.startup(() => {
	searchProviderService.start();
});

class SearchExecutorService {
	static search(text, rid, payload) {

		const future = new Future();

		if (!searchProviderService.activeProvider) { future.throw(new Error('No active provider defined')); }

		try {
			searchProviderService.activeProvider.search(text, rid, payload, (error, data) => {
				if (error) { future.throw(error); } else { future.return(data); }
			});
		} catch (e) {
			future.throw(e);
		}

		return future.wait();
	}
}

Meteor.methods({
	'rocketchatSearchGetConfiguration'() {
		return {
			active: searchProviderService.activeProvider.id,
			providers: _.chain(searchProviderService.providers)
				.values()
				.map((provider) => {
					return {
						id: provider.id,
						configuration: provider.configuration,
						name: provider.name,
						description: provider.description,
						adminTemplate: provider.adminTemplate
					};
				})
				.value(),
			enabled: searchProviderService.enabled
		};
	},
	'rocketchatSetActiveProvider'(id, configuration, enabled) {
		return searchProviderService.use(id, configuration, enabled);
	},
	'rocketchatSearchSearch'(text, rid, payload) {
		return SearchExecutorService.search(text, rid, payload);
	},
	'rocketchatSearchResultTemplate'() {
		return searchProviderService.activeProvider.resultTemplate;
	}
});

