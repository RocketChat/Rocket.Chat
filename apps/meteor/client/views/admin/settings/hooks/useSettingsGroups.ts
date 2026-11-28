import type { ISetting } from '@rocket.chat/core-typings';
import { useSettings } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

export const useSettingsGroups = (filter: string): ISetting[] => {
	const settings = useSettings();
	const { t } = useTranslation();

	const getMatchableStrings = (setting: ISetting): string[] =>
		[setting.i18nLabel && t(setting.i18nLabel), t(setting._id), setting._id].filter(Boolean);

	const getFilterPredicate = (): ((setting: ISetting) => boolean) => {
		if (!filter) {
			return () => true;
		}

		try {
			const filterRegex = new RegExp(filter, 'i');
			return (setting) => getMatchableStrings(setting).some((text) => filterRegex.test(text));
		} catch (e) {
			return (setting) => getMatchableStrings(setting).some((text) => text.slice(0, filter.length) === filter);
		}
	};

	const groupIds = Array.from(
		new Set(
			settings.filter(getFilterPredicate()).map((setting) => {
				if (setting.type === 'group') {
					return setting._id;
				}

				return setting.group;
			}),
		),
	);

	return settings
		.filter(({ type, group, _id }) => type === 'group' && groupIds.includes(group || _id))
		.sort((a, b) => t(a.i18nLabel || a._id).localeCompare(t(b.i18nLabel || b._id)));
};
