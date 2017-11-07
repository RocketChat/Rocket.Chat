/* globals RocketChat */

import {getLogger} from './getLogger';
import {registerHooks} from '../server/runtime-integration/hooks';
import {SearchProvider} from './SearchProvider';

const SETTINGS_GROUP_NAME = 'SearchProviders';
const SETTINGS_SEARCH_ENABLED = 'SearchEnabled';
const SETTINGS_SEARCH_PROVIDER = 'SearchProvider';

export class SearchProviderRegistry {

	constructor() {
		this.PHASES = {
			STARTING: 0,
			CONFIGURE: 10,
			STARTED: 20
		};
		this.providerBuffer = new Array();
		this.providers = {};
		this.activeProviderIdentifier = RocketChat.models.Settings.findOneNotHiddenById(SETTINGS_SEARCH_PROVIDER).value;
		this._enabled = RocketChat.models.Settings.findOneNotHiddenById(SETTINGS_SEARCH_ENABLED).value; //copy on startup
		this.phase = this.PHASES.STARTING;

		// register handlers for change of relevant settings

		const _this = this;
		RocketChat.settings.onload(SETTINGS_SEARCH_ENABLED, (key, value) => {

			if (_this.phase === _this.PHASES.STARTED) {

				if (!_this.activeProvider) { //if the enabled setting is loaded first, no provider might be active
					_this.switchProvider(RocketChat.models.Settings.findOneNotHiddenById(SETTINGS_SEARCH_PROVIDER).value);
				}

				if (!_this.enabled && value === true) {
					_this.enable();
				}

				if (_this.enabled && value === false) {
					_this.disable();
				}
			}
		});

		RocketChat.settings.onload(SETTINGS_SEARCH_PROVIDER, (key, selectedProviderIdentifier) => {

			if (_this.phase === _this.PHASES.STARTED) {
				_this.switchProvider(selectedProviderIdentifier);
			}
		});
	}

	/**
	 * in order to manage search providers, they must not be effective until the server has started
	 */
	started() {

		registerHooks();

		this.phase = this.PHASES.STARTED;
	}

	configure() {
		this.phase = this.PHASES.CONFIGURE;

		while (this.providerBuffer.length) {
			const searchProvider = this.providerBuffer.pop();
			this.add(searchProvider);
		}

		this.provideSettings();
	}

	get enabled() {
		return this._enabled;
	}

	/**
	 * Setter provided in order to make the Setting reflect the internal state
	 * Must not be called from outside disable()
	 * @param enabled
	 */
	set enabled(enabled) {
		this._enabled = enabled;

		// Write the setting via the model (not via settings.set) as this is done by the server and not from a user
		RocketChat.models.Settings.updateValueById(SETTINGS_SEARCH_ENABLED, enabled);
	}

	get activeProvider() {
		return this.providers[this.activeProviderIdentifier];
	}

	set activeProvider(identifier) {
		this.activeProviderIdentifier = identifier;
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

			if (this.phase === this.PHASES.STARTING) {
				this.providerBuffer.push(searchProvider);
				return; //will be re-executed once started
			}

			this.providers[searchProvider.identifier] = searchProvider;

			return true;
		}
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
			// this can actually only happen when starting up the machine.
			// thus, ignore those calls as this would disable the previously active provider
			getLogger().error('Search provider', newProviderIdentifier, 'which shall be loaded is not available');
		}

		if (!newProvider.metadata.isConfigurationValid(getLogger())) {
			if (this.activeProvider) {
				RocketChat.models.Settings.updateValueById(SETTINGS_SEARCH_PROVIDER, this.activeProvider.identifier);
			}
			throw new Error('Provider-not-properly-configured');
		}

		//disable the current provider
		if (this.activeProvider && this.activeProvider !== newProvider) {
			this.disable();
		}
		this.activeProvider = newProviderIdentifier;
	}

	enable() {
		if (Meteor.isServer) {
			if (!this.activeProvider) {
				return;
			}

			if (this.activeProvider.metadata.isConfigurationValid(getLogger())) {

				// no way back from here

				// this.activeProvider.runtimeIntegration.initialLoad() //todo

				this.enabled = true;
			} else {
				getLogger().error(this.activeProvider.identifier, 'could not be enabled as the configuration is invalid');
			}
		}
	}

	disable() {
		this.enabled = false;
		if (this.activeProvider) {
			this.activeProvider.runtimeIntegration.onDisable(getLogger());
		}
	}
}

export const searchProviders = new SearchProviderRegistry();

/**
 * Enable the search provider registry
 */
Meteor.startup(function() {
	searchProviders.configure();
	searchProviders.started();
});
