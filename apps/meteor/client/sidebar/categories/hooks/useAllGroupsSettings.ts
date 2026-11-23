import type { ISidebarCategory } from '@rocket.chat/core-typings';
import { useCallback, useMemo } from 'react';

import { isActivityFilterable, useStoredActivityFilters } from './useActivityFilter';
import { usePersistCategoriesMutation } from './usePersistCategoriesMutation';
import { useUserSidebarCategories } from './useUserSidebarCategories';
import { withDynamicFirst } from '../../hooks/useCategoryList';
import { useSidebarSectionsOrder } from '../../hooks/useSidebarSectionsOrder';

/** A setting read across every group: the value they all share, or `mixed` once they disagree. */
export type SharedSetting<T> = { mixed: false; value: T } | { mixed: true };

const sharedValue = <T>(values: T[]): SharedSetting<T> =>
	values.every((value) => value === values[0]) ? { mixed: false, value: values[0] } : { mixed: true };

/**
 * The groups "All groups" speaks for: the static system groups and the custom categories, in the sidebar's order.
 * The dynamic groups (calls, queued chats, Unread) list rooms that need attention now, so they keep their own rules.
 */
export const useAllGroupsGroupKeys = (): string[] => {
	const { rawCategories } = useUserSidebarCategories();
	const sidebarSectionsOrder = useSidebarSectionsOrder();

	return useMemo(
		() =>
			withDynamicFirst(
				rawCategories.map((entry) => entry._id),
				sidebarSectionsOrder,
			).filter(isActivityFilterable),
		[rawCategories, sidebarSectionsOrder],
	);
};

/**
 * The settings every group has in common, and the writers that set one on all of them at once. "All groups" keeps
 * no state of its own: it reads as a value while every group agrees and as mixed once one group is changed on its
 * own, and setting it writes the same value to each group's `sidebarCategories` entry, creating the entries that
 * do not exist yet.
 */
export const useAllGroupsSettings = () => {
	const { rawCategories } = useUserSidebarCategories();
	const sidebarSectionsOrder = useSidebarSectionsOrder();
	const groupKeys = useAllGroupsGroupKeys();
	// A rejected write is reported by the mutation itself, so there is nothing for a caller to await or catch.
	const { mutate: persistCategories } = usePersistCategoriesMutation();

	const entries = useMemo(() => groupKeys.map((id) => rawCategories.find((entry) => entry._id === id)), [groupKeys, rawCategories]);

	// UI-PREVIEW ONLY: the activity filter lives in this browser's localStorage here (see useActivityFilter), so
	// "All rooms" reads the window there and writes it there for every group; the unread toggles still go to the
	// preference, which the server already accepts.
	const [filters, setFilters] = useStoredActivityFilters();
	const activityFilterHours = useMemo(() => sharedValue(groupKeys.map((id) => filters[id])), [groupKeys, filters]);
	const showUnreads = useMemo(() => sharedValue(entries.map((entry) => Boolean(entry?.showUnreads))), [entries]);
	const keepUnreadsOnTop = useMemo(() => sharedValue(entries.map((entry) => Boolean(entry?.keepUnreadsOnTop))), [entries]);

	const setForAllGroups = useCallback(
		(patch: Partial<ISidebarCategory>) => {
			const entryMap = new Map(rawCategories.map((entry) => [entry._id, entry]));
			for (const id of groupKeys) {
				entryMap.set(id, { ...(entryMap.get(id) ?? { _id: id, name: id, default: true }), ...patch });
			}

			// Every entry is listed explicitly, so a system group missing from an older `sidebarSectionsOrder` is
			// written too, the way `useUpsertGroupEntry` does for one group.
			const merged = withDynamicFirst([...entryMap.keys()], sidebarSectionsOrder);

			persistCategories(merged.map((key) => entryMap.get(key) ?? { _id: key, name: key, default: true }));
		},
		[rawCategories, groupKeys, sidebarSectionsOrder, persistCategories],
	);

	const setActivityFilterHours = useCallback(
		(hours: number | undefined) =>
			setFilters((current) => {
				const next = { ...current };
				for (const id of groupKeys) {
					if (hours) {
						next[id] = hours;
					} else {
						delete next[id];
					}
				}
				return next;
			}),
		[groupKeys, setFilters],
	);
	const setShowUnreads = useCallback((enabled: boolean) => setForAllGroups({ showUnreads: enabled }), [setForAllGroups]);
	const setKeepUnreadsOnTop = useCallback((enabled: boolean) => setForAllGroups({ keepUnreadsOnTop: enabled }), [setForAllGroups]);

	return { groupKeys, activityFilterHours, showUnreads, keepUnreadsOnTop, setActivityFilterHours, setShowUnreads, setKeepUnreadsOnTop };
};
