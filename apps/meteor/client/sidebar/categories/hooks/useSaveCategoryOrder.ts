import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { usePersistCategoriesMutation } from './usePersistCategoriesMutation';
import { useUserSidebarCategories } from './useUserSidebarCategories';
import { withDynamicFirst } from '../../hooks/useCategoryList';
import { useSidebarSectionsOrder } from '../../hooks/useSidebarSectionsOrder';

/**
 * Saves the sidebar groups in the given order, keeping the dynamic groups first. A failed save is shown to the user and still rejects,
 * so the caller can tell the order did not change.
 */
export const useSaveCategoryOrder = () => {
	const { rawCategories } = useUserSidebarCategories();
	const sidebarSectionsOrder = useSidebarSectionsOrder();
	const { mutateAsync: persistCategories } = usePersistCategoriesMutation();
	const dispatchToastMessage = useToastMessageDispatch();

	return useCallback(
		async (keys: string[]) => {
			const entryMap = new Map(rawCategories.map((e) => [e._id, e]));
			const finalIds = withDynamicFirst(keys, sidebarSectionsOrder);
			try {
				await persistCategories(finalIds.map((k) => entryMap.get(k) ?? { _id: k, name: k, default: true }));
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
				throw error;
			}
		},
		[rawCategories, sidebarSectionsOrder, persistCategories, dispatchToastMessage],
	);
};
