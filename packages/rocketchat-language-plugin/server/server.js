import parser from 'accept-language-parser';
import languages from 'languages';

import {plugin_handler} from 'meteor/rocketchat:plugin-handler';

const getLanguage = function(user) {
	let language_name;
	const languages_parsed = parser.parse(user.connection.httpHeaders['accept-language']);
	if (languages_parsed.length===0) {
		language_name = null;
	} else {
		const priority_language = languages_parsed[0].code;
		const browser_language = languages.getLanguageInfo(priority_language);
		language_name = browser_language.name;
	}

	return language_name;
};


plugin_handler.addPlugin({
	pluginName: 'language',
	getChannelName: getLanguage,
	enable: RocketChat.settings.get('Enable_Language'),
	blacklistAllowed: RocketChat.settings.get('Blacklist_Language')
});

