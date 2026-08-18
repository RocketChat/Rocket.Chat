export const normalizeLanguage = (language: string): string => {
	if (!language) {
		return language;
	}

	const lang = language.replace(/_/g, '-');

	// Traditional Chinese variants
	if (/^zh-(hant-hk|hk|hant-mo|mo)/i.test(lang)) {
		return 'zh-HK';
	}
	if (/^zh-(hant(-tw)?|cht|tw)/i.test(lang)) {
		return 'zh-TW';
	}
	// Simplified Chinese variants
	if (/^zh-(hans|cn|sg|chs)/i.test(lang) || lang.toLowerCase() === 'zh') {
		return 'zh';
	}

	// Fix browsers having all-lowercase language settings eg. pt-br, en-us
	const regex = /^([a-z]{2,3})-([a-z]{2,4})$/i;
	const matches = regex.exec(lang);
	if (matches) {
		return `${matches[1].toLowerCase()}-${matches[2].toUpperCase()}`;
	}

	return language;
};
