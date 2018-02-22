import {searchProviderService} from 'meteor/rocketchat:search';
import {SearchProvider} from 'meteor/rocketchat:search';

class ChatpalProvider extends SearchProvider {

	constructor() {
		super();
		this.configuration = {
			name:'value'
		};
	}

	get id() {
		return 'search.provider.chatpal';
	}

	get name() {
		return 'Chatpal Provider';
	}

	get description() {
		return 'The chatpal provider uses a powerful search backend';
	}

	get resultTemplate() {
		return 'ChatpalSearchResultTemplate';
	}

	get adminTemplate() {
		return 'SearchChatpalProviderAdmin';
	}

	search(text, rid, payload, callback) {
		Meteor.setTimeout(()=>{
			callback(null, {result:`You are searching for ${ text } but I am currently not yet implemeted, sorry ;)`});
		}, 500);
	}
}

searchProviderService.register(new ChatpalProvider());
