import i18next from 'i18next';
import sprintf from 'i18next-sprintf-postprocessor';

import { isObject } from '../../../lib/utils/isObject';

export const i18n = i18next.use(sprintf);

export const t = function (key: string, ...replaces: any): string {
	if (isObject(replaces[0])) {
		return i18n.t(key, ...replaces);
	}
	return i18n.t(key, {
		postProcess: 'sprintf',
		sprintf: replaces,
	});
};
