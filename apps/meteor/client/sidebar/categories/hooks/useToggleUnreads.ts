import type { ISidebarCategory } from '@rocket.chat/core-typings';
import { SIDEBAR_SYSTEM_GROUP_KEYS } from '@rocket.chat/core-typings';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { usePersistCategoriesMutation } from './usePersistCategoriesMutation';
import { useUserSidebarCategories } from './useUserSidebarCategories';
import { withDynamicFirst } from '../../hooks/useCategoryList';

export const useToggleUnreads = () => {
	const { rawCategories } = useUserSidebarCategories();
	const sidebarSectionsOrder: readonly string[] = useUserPreference<string[]>('sidebarSectionsOrder') ?? SIDEBAR_SYSTEM_GROUP_KEYS;
	const { mutateAsync: persistCategories } = usePersistCategoriesMutation();

	const upsertGroupEntry = useCallback(
		async (id: string, patch: Partial<ISidebarCategory>) => {
			const existing = rawCategories.find((entry) => entry._id === id);
			if (existing) {
				await persistCategories(rawCategories.map((entry) => (entry._id === id ? { ...entry, ...patch } : entry)));
				return;
			}

			const entryMap = new Map(rawCategories?.map((entry) => [entry._id, entry]));
			entryMap.set(id, { _id: id, name: id, default: true, ...patch });

			const merged = withDynamicFirst(
				rawCategories.map((entry) => entry._id),
				sidebarSectionsOrder,
			);

			await persistCategories(merged.map((key) => entryMap.get(key) ?? { _id: key, name: key, default: true }));
		},
		[rawCategories, sidebarSectionsOrder, persistCategories],
	);

	const isShowUnreads = useCallback((id: string) => rawCategories.find((entry) => entry._id === id)?.showUnreads ?? false, [rawCategories]);

	const isKeepUnreadsOnTop = useCallback(
		(id: string) => rawCategories.find((entry) => entry._id === id)?.keepUnreadsOnTop ?? false,
		[rawCategories],
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
