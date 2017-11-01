import {SearchProvider} from './SearchProvider';

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
		if (!(searchProvider instanceof SearchProvider)) {
			throw new Error('Invalid provider object, it must extend "SearchProvider"');
		}

		if (this.providers[searchProvider.identifier]) {
			return false;
		}

		this.providers[searchProvider.identifier] = searchProvider;

		return true;
	}

	get activeProvider() {
		return this.providers[this.activeProviderIdentifier];
	}

	set activeProvider(identifier) {
		this.activeProviderIdentifier = identifier;
	}
}

export const searchProviders = new SearchProviderRegistry();
