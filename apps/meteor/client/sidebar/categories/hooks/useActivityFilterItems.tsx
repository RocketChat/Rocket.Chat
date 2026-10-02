import { Icon } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useActivityFilter } from './useActivityFilter';

// The windows the menus offer. Any whole number of hours is a valid filter; these are just the choices.
const ACTIVITY_FILTER_PRESETS: { hours: number | undefined; label: TranslationKey }[] = [
	{ hours: undefined, label: 'All' },
	{ hours: 24, label: 'Last_24_hours' },
	{ hours: 24 * 7, label: 'Last_7_days' },
	{ hours: 24 * 30, label: 'Last_30_days' },
];

/** The window on its own, short enough for a chip: "24 hours", "7 days", "36 hours", … */
export const useActivityFilterWindowLabel = (hours: number): string => {
	const { t } = useTranslation();
	return hours >= 48 && hours % 24 === 0 ? t('Days_count', { count: hours / 24 }) : t('Hours_count', { count: hours });
};

/** The filter as the menus name it: "All", "Last 7 days", … — or the bare window for a value no preset matches. */
export const useActivityFilterLabel = (hours: number | undefined): string => {
	const { t } = useTranslation();
	const windowLabel = useActivityFilterWindowLabel(hours ?? 0);
	const preset = ACTIVITY_FILTER_PRESETS.find((option) => option.hours === hours);
	return preset ? t(preset.label) : windowLabel;
};

/** One menu item per preset for a group, the current one checked. */
export const useActivityFilterItems = (
	groupId: string,
	activityFilterHours: number | undefined,
	onSelect?: () => void,
): GenericMenuItemProps[] => {
	const { t } = useTranslation();
	const { setActivityFilterHours } = useActivityFilter();

	return useMemo(
		() =>
			ACTIVITY_FILTER_PRESETS.map(({ hours, label }) => ({
				id: `activity-filter-${hours ?? 'all'}`,
				content: t(label),
				onClick: () => {
					onSelect?.();
					void setActivityFilterHours(groupId, hours);
				},
				addon: hours === activityFilterHours ? <Icon name='check' size='x16' /> : undefined,
			})),
		[t, groupId, activityFilterHours, onSelect, setActivityFilterHours],
	);
};
