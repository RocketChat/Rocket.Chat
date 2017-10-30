import {
	SearchProvider,
	SearchProviderMetadata,
	SearchProviderRuntime,
	SearchProviderRegistry,
	SearchProviderUi
} from 'meteor/rocketchat:search-lib';

class RedlinkSearchProviderRuntime extends SearchProviderRuntime {

}

class RedlinkSearchProviderMetadata extends SearchProviderMetadata {
	supportsPermissions() {
		return true;
	}
}

class RedlinkSearchProviderUi extends SearchProviderUi {

}

class RedlinkSearchProvider extends SearchProvider {
	constructor() {
		super(new RedlinkSearchProviderRuntime(), new RedlinkSearchProviderMetadata(), new RedlinkSearchProviderUi());
	}
}

SearchProviderRegistry.add(new RedlinkSearchProvider());
