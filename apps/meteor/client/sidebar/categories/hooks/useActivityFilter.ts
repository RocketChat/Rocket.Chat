import type { SidebarCategoryActivityFilter } from '@rocket.chat/core-typings';
import { useCallback, useEffect, useState } from 'react';

import { useUpsertGroupEntry } from './useUpsertGroupEntry';
import { useUserSidebarCategories } from './useUserSidebarCategories';
import { SIDEBAR_DYNAMIC_GROUP_KEYS } from '../../hooks/useCategoryList';

const DAY = 24 * 60 * 60 * 1000;

export const ACTIVITY_FILTER_WINDOW: Record<SidebarCategoryActivityFilter, number> = {
	'1d': DAY,
	'7d': 7 * DAY,
	'30d': 30 * DAY,
};

const CLOCK_INTERVAL = 5 * 60 * 1000;

// Dynamic groups list rooms that need attention right now (calls, queued and open chats, unreads), so none of
// them may be hidden for being quiet.
export const isActivityFilterable = (groupKey: string): boolean => !SIDEBAR_DYNAMIC_GROUP_KEYS.includes(groupKey);

export const useActivityFilter = () => {
	const { rawCategories } = useUserSidebarCategories();
	const upsertGroupEntry = useUpsertGroupEntry();

	const getActivityFilter = useCallback(
		(id: string): SidebarCategoryActivityFilter | undefined => rawCategories.find((entry) => entry._id === id)?.activityFilter,
		[rawCategories],
	);

	const setActivityFilter = useCallback(
		(id: string, activityFilter: SidebarCategoryActivityFilter | undefined) => upsertGroupEntry(id, { activityFilter }),
		[upsertGroupEntry],
	);

	const hasActivityFilters = rawCategories.some((entry) => entry.activityFilter);

	return { getActivityFilter, setActivityFilter, hasActivityFilters };
};

/** The current time, refreshed while `enabled` so a room leaves a filtered group once its activity ages out. */
export const useActivityFilterClock = (enabled: boolean): number => {
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		if (!enabled) {
			return;
		}

		setNow(Date.now());
		const interval = setInterval(() => setNow(Date.now()), CLOCK_INTERVAL);
		return () => clearInterval(interval);
	}, [enabled]);

	return now;
};
