import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useIsEnterprise } from '@rocket.chat/ui-client';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useState } from 'react';

import { SIDEBAR_DYNAMIC_GROUP_KEYS } from '../../hooks/useCategoryList';

export const HOUR = 60 * 60 * 1000;

const CLOCK_INTERVAL = 5 * 60 * 1000;

// Dynamic groups list rooms that need attention right now (calls, queued and open chats, unreads), so none of
// them may be hidden for being quiet.
export const isActivityFilterable = (groupKey: string): boolean => !SIDEBAR_DYNAMIC_GROUP_KEYS.includes(groupKey);

type StoredActivityFilters = Record<string, number>;
type StoredHidesUnreads = Record<string, boolean>;

/**
 * UI-PREVIEW ONLY: the filters live in this browser's `localStorage`, one map per user, instead of the user's
 * `sidebarCategories` preference, so the web client can be previewed against a server without the server side
 * of RocketChat/Rocket.Chat#42525. Not for merging.
 */
const useStoredActivityFilters = () => {
	const userId = useUserId();
	return useLocalStorage<StoredActivityFilters>(`sidebarActivityFilters-${userId ?? 'anonymous'}`, {});
};

/** UI-PREVIEW ONLY: the "Hide inactive unreads" toggles, a second map beside the windows. */
const useStoredHidesUnreads = () => {
	const userId = useUserId();
	return useLocalStorage<StoredHidesUnreads>(`sidebarActivityFilterHidesUnreads-${userId ?? 'anonymous'}`, {});
};

/**
 * Reads the activity filter of each group: its window, and whether it hides the unread rooms too. Like the
 * custom categories, it needs an enterprise license: without one the stored filters read as none, so no caller
 * has to check the license itself. A dynamic group never has one either, whatever is stored.
 */
export const useActivityFilterHours = () => {
	const { data: { isEnterprise = false } = {} } = useIsEnterprise();
	const [filters] = useStoredActivityFilters();
	const [hidesUnreads] = useStoredHidesUnreads();

	const getActivityFilterHours = useCallback(
		(id: string): number | undefined => (isEnterprise && isActivityFilterable(id) ? filters[id] : undefined),
		[isEnterprise, filters],
	);

	// Read on its own, not with the window: the choice is kept while the filter is off, so it is back when a window
	// is chosen again.
	const getActivityFilterHidesUnreads = useCallback(
		(id: string): boolean => (isEnterprise && isActivityFilterable(id) ? Boolean(hidesUnreads[id]) : false),
		[isEnterprise, hidesUnreads],
	);

	const hasActivityFilters = isEnterprise && Object.entries(filters).some(([id, hours]) => hours && isActivityFilterable(id));

	return { getActivityFilterHours, getActivityFilterHidesUnreads, hasActivityFilters };
};

/** Stores a group's activity filter in this browser; `undefined` clears it. */
export const useSetActivityFilterHours = () => {
	const [, setFilters] = useStoredActivityFilters();

	return useCallback(
		(id: string, activityFilterHours: number | undefined) =>
			setFilters(({ [id]: _previous, ...others }) => (activityFilterHours ? { ...others, [id]: activityFilterHours } : others)),
		[setFilters],
	);
};

/** Stores whether a group's activity filter hides its unread rooms too, in this browser. */
export const useSetActivityFilterHidesUnreads = () => {
	const [, setHidesUnreads] = useStoredHidesUnreads();

	return useCallback(
		(id: string, activityFilterHidesUnreads: boolean) =>
			setHidesUnreads(({ [id]: _previous, ...others }) => (activityFilterHidesUnreads ? { ...others, [id]: true } : others)),
		[setHidesUnreads],
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
