import { useCallback } from 'react';

import { usePersistCategoriesMutation } from './usePersistCategoriesMutation';
import { useUserSidebarCategories } from './useUserSidebarCategories';
import { withDynamicFirst } from '../../hooks/useCategoryList';
import { useSidebarSectionsOrder } from '../../hooks/useSidebarSectionsOrder';

/**
 * Saves the sidebar groups in the given order, keeping the dynamic groups first.
 */
export const useSaveCategoryOrder = () => {
	const { rawCategories } = useUserSidebarCategories();
	const sidebarSectionsOrder = useSidebarSectionsOrder();
	const { mutateAsync: persistCategories } = usePersistCategoriesMutation();

	return useCallback(
		async (keys: string[]) => {
			const entryMap = new Map(rawCategories.map((e) => [e._id, e]));
			const finalIds = withDynamicFirst(keys, sidebarSectionsOrder);
			await persistCategories(finalIds.map((k) => entryMap.get(k) ?? { _id: k, name: k, default: true }));
		},
		[rawCategories, sidebarSectionsOrder, persistCategories],
	);
};
