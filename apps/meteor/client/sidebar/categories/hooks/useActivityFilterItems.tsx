import type { SidebarCategoryActivityFilter } from '@rocket.chat/core-typings';
import { Icon } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ACTIVITY_FILTER_WINDOW, useActivityFilter } from './useActivityFilter';

const ACTIVITY_FILTER_OPTIONS: { value: SidebarCategoryActivityFilter | undefined; label: TranslationKey }[] = [
	{ value: undefined, label: 'All' },
	{ value: '1d', label: 'Last_24_hours' },
	{ value: '7d', label: 'Last_7_days' },
	{ value: '30d', label: 'Last_30_days' },
];

const HOUR = 60 * 60 * 1000;

/** The filter's name as the menus list it: "All", "Last 7 days", … */
export const getActivityFilterLabel = (activityFilter: SidebarCategoryActivityFilter | undefined): TranslationKey =>
	ACTIVITY_FILTER_OPTIONS.find(({ value }) => value === activityFilter)?.label ?? 'All';

/** The filter's window on its own, short enough for a chip: "24 hours", "7 days", … */
export const useActivityFilterWindowLabel = (activityFilter: SidebarCategoryActivityFilter): string => {
	const { t } = useTranslation();
	const hours = ACTIVITY_FILTER_WINDOW[activityFilter] / HOUR;
	return hours < 48 ? t('Hours_count', { count: hours }) : t('Days_count', { count: hours / 24 });
};

/** One menu item per filter choice for a group, the current one checked. */
export const useActivityFilterItems = (
	groupId: string,
	activityFilter: SidebarCategoryActivityFilter | undefined,
	onSelect?: () => void,
): GenericMenuItemProps[] => {
	const { t } = useTranslation();
	const { setActivityFilter } = useActivityFilter();

	return useMemo(
		() =>
			ACTIVITY_FILTER_OPTIONS.map(({ value, label }) => ({
				id: `activity-filter-${value ?? 'all'}`,
				content: t(label),
				onClick: () => {
					onSelect?.();
					void setActivityFilter(groupId, value);
				},
				addon: value === activityFilter ? <Icon name='check' size='x16' /> : undefined,
			})),
		[t, groupId, activityFilter, onSelect, setActivityFilter],
	);
};
