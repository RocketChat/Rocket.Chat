/* globals RocketChat */

import {SearchProvider} from './SearchProvider';

const SETTINGS_GROUP_NAME = 'SearchProviders';
const SETTINGS_SEARCH_ENABLED = 'SearchEnabled';

export class SearchProviderRegistry {

	constructor() {
		this.providers = {};
		this.activeProviderIdentifier = '';
	}

	/**
	 * Registers a search provider which can potentially provide full-text-search
	 * @param searchProvider
	 * @return {boolean} whether the provider has been registered successfully
	 */
	add(searchProvider) {
		if (Meteor.isServer) {
			if (!(searchProvider instanceof SearchProvider)) {
				throw new Error('Invalid provider object, it must extend "SearchProvider"');
			}

			if (this.providers[searchProvider.identifier]) {
				return false;
			}

			this.providers[searchProvider.identifier] = searchProvider;

			RocketChat.settings.addGroup(SETTINGS_GROUP_NAME, {}, function() {
				const group = this;
				group.section(searchProvider.identifier, function() {
					searchProvider.metadata.addSettings(this);
				});
			});

			return true;
		}
	}

	get activeProvider() {
		return this.providers[this.activeProviderIdentifier];
	}

	set activeProvider(identifier) {
		this.activeProviderIdentifier = identifier;
	}

	provideSettingsGroup() {
		if (Meteor.isServer) {
			RocketChat.settings.addGroup(SETTINGS_GROUP_NAME, {}, function() {
				this.add(SETTINGS_SEARCH_ENABLED, false);
				this.add('ActiveSearchProvider', 0);
			});
		}
	}
}

export const searchProviders = new SearchProviderRegistry();

Meteor.startup(function() {
	searchProviders.provideSettingsGroup();
});
