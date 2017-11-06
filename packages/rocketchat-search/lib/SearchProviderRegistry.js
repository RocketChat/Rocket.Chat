/* globals RocketChat */

import {getLogger} from './getLogger';
import {registerHooks} from '../server/runtime-integration/hooks';
import {SearchProvider} from './SearchProvider';

const SETTINGS_GROUP_NAME = 'SearchProviders';
const SETTINGS_SEARCH_ENABLED = 'SearchEnabled';
const SETTINGS_SEARCH_PROVIDER = 'SearchProvider';

export class SearchProviderRegistry {

	constructor() {
		this.providers = {};
		this.activeProviderIdentifier = '';
		this._enabled = false;

		// register handlers for change of relevant settings
		RocketChat.settings.onload(SETTINGS_SEARCH_ENABLED, (key, value) => {
			if (!this.enabled && value === true) {
				this.enable();
			}

			if (this.enabled && value === false) {
				this.disable();
			}
		});

		RocketChat.settings.onload(SETTINGS_SEARCH_PROVIDER, (key, selectedProviderIdentifier) => {
			const currentProvider = this.activeProvider ? this.activeProvider.identifier : null;
			if (currentProvider && currentProvider !== selectedProviderIdentifier) {
				this.disable();
			}

			if (selectedProviderIdentifier) { //the very first start, no provider might be set
				this.switchProvider(selectedProviderIdentifier);
			}
		});
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

			//re-create the settigns group since the providers have changed
			this.provideSettings();

			return true;
		}
	}

	get activeProvider() {
		return this.providers[this.activeProviderIdentifier];
	}

	set activeProvider(identifier) {
		this.activeProviderIdentifier = identifier;
	}

	provideSettings() {
		if (Meteor.isServer) {
			const _this = this;
			RocketChat.settings.addGroup(SETTINGS_GROUP_NAME, {}, function() {
				this.add(SETTINGS_SEARCH_ENABLED, false, {type: 'boolean', public: true});

				const searchProviderSelectValues = [];
				for (const providerIdentifier in _this.providers) {
					if (_this.providers.hasOwnProperty(providerIdentifier)) {
						const provider = _this.providers[providerIdentifier];
						searchProviderSelectValues.push({
							key: provider.identifier,
							i18nLabel: provider.ui.displayName
						});
					}
				}

				//selector
				this.add(SETTINGS_SEARCH_PROVIDER, '', {type: 'select', values: searchProviderSelectValues});

				for (const providerIdentifier in _this.providers) {
					if (_this.providers.hasOwnProperty(providerIdentifier)) {
						const provider = _this.providers[providerIdentifier];

						//each provider should get an own section
						this.section(providerIdentifier, function() {
							provider.metadata.addSettings(this, getLogger());
						});
					}
				}
			});
		}
	}

	switchProvider(newProviderIdentifier) {
		const newProvider = this.providers[newProviderIdentifier];
		if (!newProvider) {
			this.enabled = false;
			return;
		}

		if (!newProvider.metadata.isConfigurationValid(getLogger())) {

			RocketChat.models.Settings.updateValueById(SETTINGS_SEARCH_PROVIDER, this.activeProvider.identifier);
			throw new Error('Provider_not_properly_configured');
		}

		this.activeProvider = newProviderIdentifier;
	}

	enable() {
		if (Meteor.isServer) {
			registerHooks();

			this.activeProvider.runtimeIntegration.onEnable(getLogger());

			// this.activeProvider.runtimeIntegration.initialLoad() //todo
		}
	}

	disable() {
		if (this.activeProvider) {
			this.activeProvider.runtimeIntegration.onDisable(getLogger());
		}
	}

	/**
	 * Setter provided in order to make the Setting reflect the internal state
	 * @param enabled
	 */
	set enabled(enabled) {
		this._enabled = enabled;

		// Write the setting via the model (not via settings.set) as this is done by the server and not from a user
		RocketChat.models.Settings.updateValueById(SETTINGS_SEARCH_ENABLED, enabled);
	}

	get enabled() {
		return this._enabled;
	}
}

export const searchProviders = new SearchProviderRegistry();

/**
 * Enable the search provider registry
 */
Meteor.startup(function() {
	searchProviders.provideSettings();
});
