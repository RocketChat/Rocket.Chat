import i18next from 'i18next';
import sprintf from 'i18next-sprintf-postprocessor';

import { isObject } from '../../../lib/utils/isObject';

export const i18n = i18next.use(sprintf);

type HasCounter = {
	counter?: number;
};

const hasCounterProperty = (obj: any): obj is HasCounter => obj?.hasOwnProperty('counter') && typeof obj.counter === 'number';

export const addSprinfToI18n = function (t: (typeof i18n)['t'], i18nInstance?: typeof i18n) {
	return function (key: string, ...replaces: any): string {
		if (replaces[0] === undefined) {
			return t(key, ...replaces);
		}

		if (isObject(replaces[0]) && !Array.isArray(replaces[0])) {
			if (!hasCounterProperty(replaces[0])) {
				return t(key, ...replaces);
			}

			const pluralKey = `${key}_plural`;
			const pluralKeyExists = i18nInstance?.exists(pluralKey);
			const counter = replaces[0]?.counter;

			if (counter !== undefined && pluralKeyExists) {
				return counter === 1 ? t(key, ...replaces) : t(pluralKey, ...replaces);
			}

			return t(key, ...replaces);
		}

		return t(key, {
			postProcess: 'sprintf',
			sprintf: replaces,
		});
	};
};

export const t = addSprinfToI18n(i18n.t.bind(i18n));
