import { TranslationContext } from '@rocket.chat/ui-contexts';
import { TAPi18n, TAPi18next } from 'meteor/rocketchat:tap-i18n';
import { Tracker } from 'meteor/tracker';
import React, { useMemo } from 'react';

import { useReactiveValue } from '../hooks/useReactiveValue';

const createTranslateFunction = (language) =>
	Tracker.nonreactive(() => {
		const translate = (key, ...replaces) => {
			if (typeof replaces[0] === 'object') {
				const [options, lang_tag = language] = replaces;
				return TAPi18next.t(key, {
					ns: 'project',
					lng: lang_tag,
					...options,
				});
			}

			if (replaces.length === 0) {
				return TAPi18next.t(key, { ns: 'project', lng: language });
			}

			return TAPi18next.t(key, {
				postProcess: 'sprintf',
				sprintf: replaces,
				ns: 'project',
				lng: language,
			});
		};

		translate.has = (key, { lng = language, ...options } = {}) => !!key && TAPi18next.exists(key, { ns: 'project', lng, ...options });

		return translate;
	});

const getLanguages = () => {
	const result = Object.entries(TAPi18n.getLanguages())
		.map(([key, language]) => ({ ...language, key: key.toLowerCase() }))
		.sort((a, b) => a.key - b.key);

	result.unshift({
		name: 'Default',
		en: 'Default',
		key: '',
	});

	return result;
};

const getLanguage = () => TAPi18n.getLanguage();

const loadLanguage = (language) => {
	TAPi18n.setLanguage(language);
};

function TranslationProvider({ children }) {
	const languages = useReactiveValue(getLanguages);
	const language = useReactiveValue(getLanguage);

	const value = useMemo(
		() => ({
			languages,
			language,
			loadLanguage,
			translate: createTranslateFunction(language),
		}),
		[languages, language],
	);

	return <TranslationContext.Provider children={children} value={value} />;
}

export default TranslationProvider;
