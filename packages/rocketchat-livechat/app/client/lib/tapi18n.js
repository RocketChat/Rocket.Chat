import _ from 'underscore';

this.t = function(key, ...replaces) {
	if (_.isObject(replaces[0])) {
		return TAPi18n.__(key, replaces);
	} else {
		return TAPi18n.__(key, {
			postProcess: 'sprintf',
			sprintf: replaces
		});
	}
};

this.tr = function(key, options, ...replaces) {
	if (_.isObject(replaces[0])) {
		return TAPi18n.__(key, options, replaces);
	} else {
		return TAPi18n.__(key, options, {
			postProcess: 'sprintf',
			sprintf: replaces
		});
	}
};

this.isRtl = (lang) => {
	const language = lang ? lang : localStorage.getItem('userLanguage');
	return ['ar', 'dv', 'fa', 'he', 'ku', 'ps', 'sd', 'ug', 'ur', 'yi'].includes(language.split('-').shift().toLowerCase());
};
