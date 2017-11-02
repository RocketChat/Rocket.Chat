import {
	SearchProvider,
	searchProviders,
	SearchProviderMetadata,
	SearchProviderRuntimeIntegration,
	SearchProviderUi
} from 'meteor/rocketchat:search';


class RedlinkSearchProviderRuntimeIntegration extends SearchProviderRuntimeIntegration {

}

class RedlinkSearchProviderMetadata extends SearchProviderMetadata {
	supportsPermissions() {
		return true;
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

searchProviders.add(new RedlinkSearchProvider());
