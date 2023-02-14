import _ from 'underscore';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

export const t = function (key, ...replaces) {
	if (_.isObject(replaces[0])) {
		return TAPi18n.__(key, ...replaces);
	}
	return TAPi18n.__(key, {
		postProcess: 'sprintf',
		sprintf: replaces,
	});
};
