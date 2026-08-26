import type { ISidebarCategory } from '@rocket.chat/core-typings';
import { SIDEBAR_SYSTEM_GROUP_KEYS } from '@rocket.chat/core-typings';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { usePersistCategoriesMutation } from './usePersistCategoriesMutation';
import { withDynamicFirst } from '../../hooks/useCategoryList';

export const useToggleUnreads = () => {
	const allEntries = useUserPreference<ISidebarCategory[]>('sidebarCategories', []) ?? [];
	const sidebarSectionsOrder: readonly string[] = useUserPreference<string[]>('sidebarSectionsOrder') ?? SIDEBAR_SYSTEM_GROUP_KEYS;
	const persistMutation = usePersistCategoriesMutation();

	const upsertGroupEntry = useCallback(
		async (id: string, patch: Partial<ISidebarCategory>) => {
			const existing = allEntries.find((entry) => entry._id === id);
			if (existing) {
				await persistMutation.mutateAsync(allEntries.map((entry) => (entry._id === id ? { ...entry, ...patch } : entry)));
				return;
			}

			const entryMap = new Map(allEntries.map((entry) => [entry._id, entry]));
			entryMap.set(id, { _id: id, name: id, default: true, ...patch });

			const merged = withDynamicFirst(
				allEntries.map((entry) => entry._id),
				sidebarSectionsOrder,
			);

			await persistMutation.mutateAsync(merged.map((key) => entryMap.get(key) ?? { _id: key, name: key, default: true }));
		},
		[allEntries, sidebarSectionsOrder, persistMutation],
	);

	const isShowUnreads = useCallback((id: string) => allEntries.find((entry) => entry._id === id)?.showUnreads ?? false, [allEntries]);

	const isKeepUnreadsOnTop = useCallback(
		(id: string) => allEntries.find((entry) => entry._id === id)?.keepUnreadsOnTop ?? false,
		[allEntries],
	);

	const toggleShowUnreads = useCallback(
		(id: string) => upsertGroupEntry(id, { showUnreads: !isShowUnreads(id) }),
		[upsertGroupEntry, isShowUnreads],
	);

	const toggleKeepUnreadsOnTop = useCallback(
		(id: string) => upsertGroupEntry(id, { keepUnreadsOnTop: !isKeepUnreadsOnTop(id) }),
		[upsertGroupEntry, isKeepUnreadsOnTop],
	);

	return { toggleShowUnreads, toggleKeepUnreadsOnTop, isShowUnreads, isKeepUnreadsOnTop };
};
