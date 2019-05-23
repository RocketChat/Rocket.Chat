import _ from 'underscore';
import { TAPi18n } from 'meteor/tap:i18n';

export const t = function(key, ...replaces) {
	if (_.isObject(replaces[0])) {
		return TAPi18n.__(key, ...replaces);
	}
	return TAPi18n.__(key, {
		postProcess: 'sprintf',
		sprintf: replaces,
	});
};

export const isRtl = (lang) => {
	const language = lang || localStorage.getItem('userLanguage') || 'en-US';
	return ['ar', 'dv', 'fa', 'he', 'ku', 'ps', 'sd', 'ug', 'ur', 'yi'].includes(language.split('-').shift().toLowerCase());
};
