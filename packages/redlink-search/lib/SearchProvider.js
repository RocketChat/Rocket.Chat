import {
	SearchProvider,
	searchProviders,
	SearchProviderMetadata,
	SearchProviderRuntimeIntegration,
	SearchProviderUi
} from 'meteor/rocketchat:search';

export const SETTING_URL = 'RedlinkSearchUrl';

class RedlinkSearchProviderRuntimeIntegration extends SearchProviderRuntimeIntegration {

}

class RedlinkSearchProviderMetadata extends SearchProviderMetadata {
	supportsPermissions() {
		return true;
	}

	addSettings(section) {
		section.add(SETTING_URL, '');
	}

	isConfigurationValid(settings, logger) {
		logger.debug('Validating settings', settings);
		if (!settings[SETTING_URL] || settings[SETTING_URL] === '') {
			return false;
		}
	}
}

/*
Don't know whether an own UI is really necessary
 */
class RedlinkSearchProviderUi extends SearchProviderUi {

}

class RedlinkSearchProvider extends SearchProvider {
	constructor() {
		super('redlink', new RedlinkSearchProviderRuntimeIntegration(), new RedlinkSearchProviderMetadata(), new RedlinkSearchProviderUi());
	}
}

Meteor.startup(function() {
	searchProviders.add(new RedlinkSearchProvider());
});
