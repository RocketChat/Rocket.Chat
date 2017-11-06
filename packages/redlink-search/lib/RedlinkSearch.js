import {
	SearchProvider,
	searchProviders,
	SearchProviderMetadata
} from 'meteor/rocketchat:search';

import {CustomSearchProviderRuntimeIntegration, CustomSearchProviderUi} from './SearchProvider';

export const SETTING_URL = 'RedlinkSearchUrl';

class RedlinkSearchProviderMetadata extends SearchProviderMetadata {
	supportsPermissions() {
		return true;
	}

	addSettings(section) {
		section.add(SETTING_URL, 'http://redlink.io/rocketSearch', {type: 'string', public: true});
	}

	isConfigurationValid(logger) {
		const baseUrl = RocketChat.settings.get(SETTING_URL);

		if (!baseUrl || !baseUrl.trim()) {
			logger.error('Redlink search provider configured with an invalid URL');
			return false;
		}

		return true;
	}
}

/*
Don't know whether an own UI is really necessary
 */
class RedlinkSearchProviderUi extends CustomSearchProviderUi {
	get displayName() {
		return 'Redlink Search';
	}

	get description() {
		return 'Powers your Rocket.Chat by employing the Redlink Semantic Search Platform';
	}
}

class RedlinkSearchProvider extends SearchProvider {
	constructor() {
		super('redlink', new CustomSearchProviderRuntimeIntegration(), new RedlinkSearchProviderMetadata(), new RedlinkSearchProviderUi());
	}
}

Meteor.startup(function() {
	searchProviders.add(new RedlinkSearchProvider());
});
