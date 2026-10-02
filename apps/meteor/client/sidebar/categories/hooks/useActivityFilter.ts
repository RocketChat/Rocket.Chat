import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useCallback, useEffect, useState } from 'react';

import { SIDEBAR_DYNAMIC_GROUP_KEYS } from '../../hooks/useCategoryList';

export const HOUR = 60 * 60 * 1000;

const CLOCK_INTERVAL = 5 * 60 * 1000;

// Dynamic groups list rooms that need attention right now (calls, queued and open chats, unreads), so none of
// them may be hidden for being quiet.
export const isActivityFilterable = (groupKey: string): boolean => !SIDEBAR_DYNAMIC_GROUP_KEYS.includes(groupKey);

const isValidHours = (hours: unknown): hours is number => typeof hours === 'number' && Number.isInteger(hours) && hours > 0;

export const useActivityFilter = () => {
	// Kept in this browser for now, not on the user's preferences, so the UI also runs against servers that do
	// not accept `activityFilterHours` yet.
	const [filters, setFilters] = useLocalStorage<Record<string, number>>('sidebarActivityFilters', {});

	const getActivityFilterHours = useCallback(
		(id: string): number | undefined => (isValidHours(filters[id]) ? filters[id] : undefined),
		[filters],
	);

	const setActivityFilterHours = useCallback(
		(id: string, activityFilterHours: number | undefined) =>
			setFilters((current) => {
				const { [id]: _previous, ...others } = current;
				return isValidHours(activityFilterHours) ? { ...others, [id]: activityFilterHours } : others;
			}),
		[setFilters],
	);

	const hasActivityFilters = Object.values(filters).some(isValidHours);

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
