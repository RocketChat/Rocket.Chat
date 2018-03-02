import {searchProviderService} from 'meteor/rocketchat:search';
import {SearchProvider} from 'meteor/rocketchat:search';

class ChatpalProvider extends SearchProvider {

	constructor() {
		super('chatpalProvider');
		this._settings.add('Backend', 'select', 'cloud', {
			values:[
				{key: 'cloud', i18nLabel: 'Cloud Service'},
				{key: 'onsite', i18nLabel: 'On-Site'}
			]
		});
		this._settings.add('API_Key', 'string', '', {
			enableQuery:[{
				_id: 'Search.chatpalProvider.Backend',
				value: 'cloud'
			}],
			i18nLabel: 'Chatpal_API_Key',
			i18nDescription: 'Chatpal_API_Key_Description'
		});
		this._settings.add('Base_URL', 'string', '', {
			enableQuery:[{
				_id: 'Search.chatpalProvider.Backend',
				value: 'onsite'
			}]
		});
		this._settings.add('HTTP_Headers', 'string', '', {
			enableQuery:[{
				_id: 'Search.chatpalProvider.Backend',
				value: 'onsite'
			}],
			multiline: true,
			i18nLabel: 'Chatpal_HTTP_Headers',
			i18nDescription: 'Chatpal_HTTP_Headers_Description'
		});
		this._settings.add('Main_Language', 'select', 'en', {
			values: [
				{key: 'none', i18nLabel: 'Not_set'},
				{key: 'de', i18nLabel: 'German'},
				{key: 'en', i18nLabel: 'English'}
			]
		});
	}

	get i18nLabel() {
		return 'Chatpal Provider';
	}

	get i18nDescription() {
		return 'The chatpal provider uses a powerful search backend';
	}

	get resultTemplate() {
		return 'ChatpalSearchResultTemplate';
	}

	start(callback) {
		callback();
	}

	search(text, rid, payload, callback) {
		Meteor.setTimeout(()=>{
			callback(null, {result:`You are searching for ${ text } but I am currently not yet implemeted, sorry ;)`});
		}, 500);
	}
}

searchProviderService.register(new ChatpalProvider());
