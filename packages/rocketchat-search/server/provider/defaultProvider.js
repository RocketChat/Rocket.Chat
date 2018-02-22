import {searchProviderService} from '../service/providerService';
import SearchProvider from '../service/provider';

class DefaultProvider extends SearchProvider {

	constructor() {
		super();
		this.configuration = {
			searchAll:true
		};
	}

	get id() {
		return searchProviderService.DEFAULT_ID;
	}

	get name() {
		return 'Default provider';
	}

	get description() {
		return 'The default provider uses mongodb for search';
	}

	get resultTemplate() {
		return 'DefaultSearchResultTemplate';
	}

	get adminTemplate() {
		return 'SearchDefaultProviderAdmin';
	}

	search(text, rid, payload, callback) {

		if (!payload) {
			payload = {limit:1};
		}

		rid = payload.searchAll || this.configuration.searchAll ? rid : undefined;

		Meteor.call('messageSearch', text, rid, payload.limit, callback);
	}
}

searchProviderService.register(new DefaultProvider());
