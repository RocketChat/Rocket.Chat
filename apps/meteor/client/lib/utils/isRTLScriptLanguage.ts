export const isRTLScriptLanguage = (lang: string): boolean => {
	const language = lang || 'en';
	const [languageCode] = language.split('-');

	if (!languageCode) {
		return false;
	}

	return ['ar', 'dv', 'fa', 'he', 'ku', 'ps', 'sd', 'ug', 'ur', 'yi'].includes(languageCode);
};
