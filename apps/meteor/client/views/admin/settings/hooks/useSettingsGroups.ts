import type { ISetting } from '@rocket.chat/core-typings';
import { useSettings, TranslationKey, useTranslation } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export const useSettingsGroups = (filter: string): ISetting[] => {
	const settings = useSettings();
	const t = useTranslation();

	const filterPredicate = useMemo(() => {
		if (!filter) {
			return (): boolean => true;
		}

		const getMatchableStrings = (setting: ISetting): string[] =>
			[setting.i18nLabel && t(setting.i18nLabel as TranslationKey), t(setting._id as TranslationKey), setting._id].filter(Boolean);

		try {
			const filterRegex = new RegExp(filter, 'i');
			return (setting: ISetting): boolean => getMatchableStrings(setting).some((text) => filterRegex.test(text));
		} catch (e) {
			return (setting: ISetting): boolean => getMatchableStrings(setting).some((text) => text.slice(0, filter.length) === filter);
		}
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
