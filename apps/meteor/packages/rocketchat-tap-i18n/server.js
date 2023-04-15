export const TAPi18n = {
	__(text) {
		return text;
	},
};

export const TAPi18next = {
	addResourceBundle(language, project, scopedTranslations) {},
	exists(key) {
		return true;
	},
	init() {},
	lng() {
		return 'en';
	},
	setLng(lang) {
		return true;
	},
	t(key) {
		return key;
	},
};
