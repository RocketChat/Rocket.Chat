import {SearchProvider} from '../lib/SearchProvider';
import {RoomSearchResult} from '../lib/RoomSearchResult';
import {SearchProviderMetadata} from '../lib/SearchProviderMetadata';
import {SearchProviderUi} from '../lib/SearchProviderUi';
import {SearchProviderRuntimeIntegration} from '../lib/SearchProviderRuntimeIntegration';
import {searchProviders} from '../lib/SearchProviderRegistry';

class MockProviderMetadata extends SearchProviderMetadata {
	supportsPermissions() {
		//suppress additional filtering
		return true;
	}

	addSettings() {
		//none
	}
}

class MockProviderUi extends SearchProviderUi {
	get displayName() {
		return 'Mock provider for testing';
	}

	get description() {
		return 'This provider is only intended to test the  search provider integration - not to be activated productively';
	}
}

export class MockProvider extends SearchProvider {

	constructor() {
		super('mock', new SearchProviderRuntimeIntegration(), new MockProviderMetadata(), new MockProviderUi());
	}

	findRooms() {
		const mockResult = [];

		mockResult.push(new RoomSearchResult('1', 'First result', 'Some excerpt'));
		mockResult.push(new RoomSearchResult('2', 'Second result', 'Some excerpt'));
		mockResult.push(new RoomSearchResult('3', 'Third result', 'Some excerpt'));

		return mockResult;
	}
}

Meteor.startup(() => {
	searchProviders.add(new MockProvider());
});
