import parser from 'accept-language-parser';
import languages from 'languages';

export function get_language(languages_codes) {
	let language_name;
	const languages_parsed = parser.parse(languages_codes);
	if (languages_parsed.length===0) {
		language_name = null;
	} else {
		const priority_language = languages_parsed[0].code;
		const browser_language = languages.getLanguageInfo(priority_language);
		language_name = browser_language.name;
	}
	const languageResult = {
		channelType: 'language',
		channelName: language_name
	};
	return languageResult;
}




