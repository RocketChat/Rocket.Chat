import i18next from 'i18next';
import sprintf from 'i18next-sprintf-postprocessor';

import { isObject } from '../../../lib/utils/isObject';

export const i18n = i18next.use(sprintf);

export const addSprinfToI18n = function (t: (typeof i18n)['t']) {
	return function (key: string, ...replaces: any): string {
		if (replaces[0] === undefined || isObject(replaces[0])) {
			return t(key, ...replaces);
		}

		return t(key, {
			postProcess: 'sprintf',
			sprintf: replaces,
		});
	};
};

export const t = addSprinfToI18n(i18n.t.bind(i18n));
