import { translationHelper } from '../../../../client/lib/i18n/i18nHelper';
import { isObject } from '../../../../lib/utils/isObject';

export const t = function (key: string, ...replaces: any): string {
	if (isObject(replaces[0])) {
		return translationHelper.t(key, ...replaces);
	}
	return translationHelper.t(key, {
		postProcess: 'sprintf',
		sprintf: replaces,
	});
};
