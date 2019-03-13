import { TAPi18n } from 'meteor/tap:i18n';
import _ from 'underscore';
import s from 'underscore.string';
import toastr from 'toastr';

export const handleError = function(error, useToastr = true) {
	if (_.isObject(error.details)) {
		for (const key in error.details) {
			if (error.details.hasOwnProperty(key)) {
				error.details[key] = TAPi18n.__(error.details[key]);
			}
		}
	}

	if (useToastr) {
		const details = Object.entries(error.details || {})
			.reduce((obj, [key, value]) => ({ ...obj, [key] : s.escapeHTML(value) }), {});
		const message = TAPi18n.__(error.error, details);
		const title = details.errorTitle && TAPi18n.__(details.errorTitle);

		return toastr.error(message, title);
	}

	return s.escapeHTML(TAPi18n.__(error.error, error.details));
};
