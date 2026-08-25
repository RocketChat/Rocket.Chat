import type { ISidebarCategory } from '@rocket.chat/core-typings';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { usePersistCategoriesMutation } from './usePersistCategoriesMutation';
import { useSetCategory } from './useSetCategory';

export const useUpdateCategory = () => {
	const setCategory = useSetCategory();
	const persistCategories = usePersistCategoriesMutation();
	const allEntries = useUserPreference<ISidebarCategory[]>('sidebarCategories', []) ?? [];

	return useCallback(
		async (categoryId: string, name: string, addedRoomIds: string[], removedRoomIds: string[]) => {
			await persistCategories.mutateAsync(allEntries.map((entry) => (entry._id === categoryId ? { ...entry, name: name.trim() } : entry)));
			if (addedRoomIds.length > 0) await setCategory(addedRoomIds, categoryId);
			if (removedRoomIds.length > 0) await setCategory(removedRoomIds, null);
		},
		[allEntries, persistCategories, setCategory],
	);
};
