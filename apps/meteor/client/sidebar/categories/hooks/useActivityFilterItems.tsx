import { Icon } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useLanguage } from '@rocket.chat/ui-contexts';
import type { TFunction } from 'i18next';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useSetActivityFilterHours } from './useActivityFilter';

// The windows the menus offer. Any whole number of hours is a valid filter; these are just the choices.
const ACTIVITY_FILTER_PRESETS: { hours: number | undefined; label: TranslationKey }[] = [
	{ hours: undefined, label: 'All' },
	{ hours: 24, label: 'Last_24_hours' },
	{ hours: 24 * 7, label: 'Last_7_days' },
	{ hours: 24 * 30, label: 'Last_30_days' },
];

/** The window as a count of days when it is a whole number of days, two or more; of hours otherwise. */
const getActivityFilterWindow = (hours: number): { unit: 'day' | 'hour'; value: number } =>
	hours >= 48 && hours % 24 === 0 ? { unit: 'day', value: hours / 24 } : { unit: 'hour', value: hours };

/** Words a count of days or hours in the user's language, with the CLDR unit names; English as the fallback for a tag `Intl` rejects. */
const formatActivityFilterWindow = (language: string, hours: number, unitDisplay: 'narrow' | 'long'): string => {
	const { unit, value } = getActivityFilterWindow(hours);
	try {
		return new Intl.NumberFormat(language, { style: 'unit', unit, unitDisplay }).format(value);
	} catch {
		return new Intl.NumberFormat('en', { style: 'unit', unit, unitDisplay }).format(value);
	}
};

/**
 * The window on its own, as short as the language abbreviates it, for the chip: "24h", "7d" in English, "24 h",
 * "7 dias" in Portuguese. Where the CLDR has no short form the language's full word is the shortest there is.
 */
export const getActivityFilterWindowLabel = (language: string, hours: number): string =>
	formatActivityFilterWindow(language, hours, 'narrow');

/** The filter as the menus name it: "All", "Last 7 days", … — or the window spelled out ("36 hours") for a value no preset matches. */
export const getActivityFilterLabel = (t: TFunction, language: string, hours: number | undefined): string => {
	const preset = ACTIVITY_FILTER_PRESETS.find((option) => option.hours === hours);
	return preset ? t(preset.label) : formatActivityFilterWindow(language, hours ?? 0, 'long');
};

export const useActivityFilterWindowLabel = (hours: number): string => getActivityFilterWindowLabel(useLanguage(), hours);

export const useActivityFilterLabel = (hours: number | undefined): string => {
	const { t } = useTranslation();
	const language = useLanguage();
	return getActivityFilterLabel(t, language, hours);
};

/** The menu item id of a filter, `all` when there is none. */
export const getActivityFilterItemId = (hours: number | undefined): string => `activity-filter-${hours ?? 'all'}`;

/**
 * One menu item per preset for a group, the current one checked. Choosing one stores it and reports the choice
 * to `onChoose`, so the owner can close the menu and announce the outcome.
 */
export const useActivityFilterItems = (
	groupId: string,
	activityFilterHours: number | undefined,
	onChoose?: (hours: number | undefined) => void,
): GenericMenuItemProps[] => {
	const { t } = useTranslation();
	const setActivityFilterHours = useSetActivityFilterHours();

	return useMemo(
		() =>
			ACTIVITY_FILTER_PRESETS.map(({ hours, label }) => ({
				id: getActivityFilterItemId(hours),
				content: t(label),
				onClick: () => {
					onChoose?.(hours);
					setActivityFilterHours(groupId, hours);
				},
				addon: hours === activityFilterHours ? <Icon name='check' size='x16' /> : undefined,
			})),
		[t, groupId, activityFilterHours, onChoose, setActivityFilterHours],
	);
};
