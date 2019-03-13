import { TAPi18n } from 'meteor/tap:i18n';

this.i18n_status_func = function(key, options) {
	return TAPi18n.__(key, options);
};
