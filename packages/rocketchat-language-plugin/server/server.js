const parser = Npm.require('accept-language-parser');
const languages = Npm.require('languages');

get_language = function(languages_codes) {
	let language_name;
	const languages_parsed = parser.parse(languages_codes);
	if (languages_parsed.length===0) {
		language_name = null;
	} else {
		const priority_language = languages_parsed[0].code;
		const browser_language = languages.getLanguageInfo(priority_language);
		language_name = browser_language.name;
	}
	plugin_handler.plugins.push({
		channelType: 'language',
		channelName: language_name
	});
};




