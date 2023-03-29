import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { isObject } from '../../../lib/utils/isObject';

export const t = function (key, ...replaces) {
	if (isObject(replaces[0])) {
		return TAPi18n.__(key, ...replaces);
	}
	return TAPi18n.__(key, {
		postProcess: 'sprintf',
		sprintf: replaces,
	});
};
