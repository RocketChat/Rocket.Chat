import { useCallback } from 'react';

import { usePersistCategoriesMutation } from './usePersistCategoriesMutation';
import { useSetCategory } from './useSetCategory';
import { useUserSidebarCategories } from './useUserSidebarCategories';

export const useUpdateCategory = () => {
	const setCategory = useSetCategory();
	const persistCategories = usePersistCategoriesMutation();
	const { rawCategories } = useUserSidebarCategories();

	return useCallback(
		async (categoryId: string, name: string, addedRoomIds: string[], removedRoomIds: string[]) => {
			await persistCategories.mutateAsync(
				rawCategories.map((entry) => (entry._id === categoryId ? { ...entry, name: name.trim() } : entry)),
			);
			if (addedRoomIds.length > 0) await setCategory(addedRoomIds, categoryId);
			if (removedRoomIds.length > 0) await setCategory(removedRoomIds, null);
		},
		[rawCategories, persistCategories, setCategory],
	);
};
