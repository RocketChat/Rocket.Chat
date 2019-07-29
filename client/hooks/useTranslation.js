import { TAPi18n } from 'meteor/tap:i18n';
import { Tracker } from 'meteor/tracker';

import { useReactiveValue } from './useReactiveValue';

const translator = (key, ...replaces) => Tracker.nonreactive(() => {
	if (typeof replaces[0] === 'object') {
		return TAPi18n.__(key, ...replaces);
	}

	return TAPi18n.__(key, {
		postProcess: 'sprintf',
		sprintf: replaces,
	});
});

export const useTranslation = () => {
	useReactiveValue(() => TAPi18n.getLanguage());

	return translator;
};
