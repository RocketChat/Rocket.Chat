import { useCallback, useEffect, useState } from 'react';

import { useUpsertGroupEntry } from './useUpsertGroupEntry';
import { useUserSidebarCategories } from './useUserSidebarCategories';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
import { SIDEBAR_DYNAMIC_GROUP_KEYS } from '../../hooks/useCategoryList';

export const HOUR = 60 * 60 * 1000;

const CLOCK_INTERVAL = 5 * 60 * 1000;

// Dynamic groups list rooms that need attention right now (calls, queued and open chats, unreads), so none of
// them may be hidden for being quiet.
export const isActivityFilterable = (groupKey: string): boolean => !SIDEBAR_DYNAMIC_GROUP_KEYS.includes(groupKey);

/**
 * Reads the activity filter of each group. Like the custom categories, it needs an enterprise license: without
 * one the stored filters read as none, so no caller has to check the license itself. A dynamic group never has
 * one either, whatever its entry says.
 */
export const useActivityFilterHours = () => {
	const { data: { isEnterprise = false } = {} } = useIsEnterprise();
	const { rawCategories } = useUserSidebarCategories();

	const getActivityFilterHours = useCallback(
		(id: string): number | undefined =>
			isEnterprise && isActivityFilterable(id) ? rawCategories.find((entry) => entry._id === id)?.activityFilterHours : undefined,
		[isEnterprise, rawCategories],
	);

	const hasActivityFilters = isEnterprise && rawCategories.some((entry) => entry.activityFilterHours && isActivityFilterable(entry._id));

	return { getActivityFilterHours, hasActivityFilters };
};

/** Stores a group's activity filter on its `sidebarCategories` entry; `undefined` clears it. */
export const useSetActivityFilterHours = () => {
	const upsertGroupEntry = useUpsertGroupEntry();

	return useCallback(
		(id: string, activityFilterHours: number | undefined) => upsertGroupEntry(id, { activityFilterHours }),
		[upsertGroupEntry],
	);
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
