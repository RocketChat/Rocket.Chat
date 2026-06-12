import type { ISetting } from '@rocket.chat/core-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useSettings } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const useSettingsGroups = (filter: string): ISetting[] => {
	const settings = useSettings();
	const { t } = useTranslation();

	const filterPredicate = useMemo(() => {
		if (!filter) {
			return (): boolean => true;
		}

		const getMatchableStrings = (setting: ISetting): string[] =>
			[setting.i18nLabel && t(setting.i18nLabel as TranslationKey), t(setting._id as TranslationKey), setting._id].filter(Boolean);

		const filterRegex = new RegExp(escapeRegExp(filter), 'i');
		return (setting: ISetting): boolean => getMatchableStrings(setting).some((text) => filterRegex.test(text));
	}, [filter, t]);

	return useMemo(() => {
		const groupIds = Array.from(
			new Set(
				settings.filter(filterPredicate).map((setting) => {
					if (setting.type === 'group') {
						return setting._id;
					}

					return setting.group;
				}),
			),
		);

		return settings
			.filter(({ type, group, _id }) => type === 'group' && groupIds.includes(group || _id))
			.sort((a, b) => t((a.i18nLabel || a._id) as TranslationKey).localeCompare(t((b.i18nLabel || b._id) as TranslationKey)));
	}, [settings, filterPredicate, t]);
};
