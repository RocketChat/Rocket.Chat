import type { ISidebarCategory } from '@rocket.chat/core-typings';
import { useCallback } from 'react';

import { usePersistCategoriesMutation } from './usePersistCategoriesMutation';
import { useUserSidebarCategories } from './useUserSidebarCategories';
import { withDynamicFirst } from '../../hooks/useCategoryList';
import { useSidebarSectionsOrder } from '../../hooks/useSidebarSectionsOrder';

/** Persists display metadata for a group, creating its `sidebarCategories` entry when it has none yet. */
export const useUpsertGroupEntry = () => {
	const { rawCategories } = useUserSidebarCategories();
	const sidebarSectionsOrder = useSidebarSectionsOrder();
	const { mutateAsync: persistCategories } = usePersistCategoriesMutation();

	return useCallback(
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
};
