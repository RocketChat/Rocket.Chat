import { useCallback, useEffect, useState } from 'react';

import { useUpsertGroupEntry } from './useUpsertGroupEntry';
import { useUserSidebarCategories } from './useUserSidebarCategories';
import { SIDEBAR_DYNAMIC_GROUP_KEYS } from '../../hooks/useCategoryList';

export const HOUR = 60 * 60 * 1000;

const CLOCK_INTERVAL = 5 * 60 * 1000;

// Dynamic groups list rooms that need attention right now (calls, queued and open chats, unreads), so none of
// them may be hidden for being quiet.
export const isActivityFilterable = (groupKey: string): boolean => !SIDEBAR_DYNAMIC_GROUP_KEYS.includes(groupKey);

export const useActivityFilter = () => {
	const { rawCategories } = useUserSidebarCategories();
	const upsertGroupEntry = useUpsertGroupEntry();

	const getActivityFilterHours = useCallback(
		(id: string): number | undefined => rawCategories.find((entry) => entry._id === id)?.activityFilterHours,
		[rawCategories],
	);

	const setActivityFilterHours = useCallback(
		(id: string, activityFilterHours: number | undefined) => upsertGroupEntry(id, { activityFilterHours }),
		[upsertGroupEntry],
	);

	const hasActivityFilters = rawCategories.some((entry) => entry.activityFilterHours);

	return { getActivityFilterHours, setActivityFilterHours, hasActivityFilters };
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
