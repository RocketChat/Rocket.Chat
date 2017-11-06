import {
	SearchProvider,
	searchProviders,
	SearchProviderMetadata
} from 'meteor/rocketchat:search';

import {CustomSearchProviderRuntimeIntegration, CustomSearchProviderUi} from './SearchProvider';

export const SETTING_URL = 'SmartiSearchUrl';

class SmartiSearchProviderMetadata extends SearchProviderMetadata {
	supportsPermissions() {
		return true;
	}

	addSettings(section) {
		section.add(SETTING_URL, 'http://localhost:8080/rocketSearch', {type: 'string', public: true});
	}

	isConfigurationValid(logger) {
		const baseUrl = RocketChat.settings.get(SETTING_URL);

		if (!baseUrl || !baseUrl.trim()) {
			logger.error('Smarti search provider configured with an invalid URL');
			return false;
		}

		return true;
	}
}

/*
Don't know whether an own UI is really necessary
 */
class SmartiSearchProviderUi extends CustomSearchProviderUi {
	get displayName() {
		return 'Smarti Search';
	}

	get description() {
		return 'Open Source on premise - powered by the smart component of Assistify: https://assistify.github.io/smarti';
	}
}

/**
 * Smarti is a search provider based on Apache Solr - it's 100% Open Source and part of assistify
 */
class SmartiSearchProvider extends SearchProvider {
	constructor() {
		super('Smarti', new CustomSearchProviderRuntimeIntegration(), new SmartiSearchProviderMetadata(), new SmartiSearchProviderUi());
	}
}

Meteor.startup(function() {
	searchProviders.add(new SmartiSearchProvider());
});
