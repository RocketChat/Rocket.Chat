import { SIDEBAR_SYSTEM_GROUP_KEYS } from '@rocket.chat/core-typings';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { usePersistCategoriesMutation } from './usePersistCategoriesMutation';
import { useUserSidebarCategories } from './useUserSidebarCategories';
import { withDynamicFirst } from '../../hooks/useCategoryList';

export const useMoveCategoryPosition = () => {
	const { rawCategories } = useUserSidebarCategories();
	const sidebarSectionsOrder: readonly string[] = useUserPreference<string[]>('sidebarSectionsOrder') ?? SIDEBAR_SYSTEM_GROUP_KEYS;
	const { mutateAsync: persistCategories } = usePersistCategoriesMutation();

	return useCallback(
		async (currentKeys: string[], key: string, direction: 'up' | 'down') => {
			const i = currentKeys.indexOf(key);
			const target = direction === 'up' ? i - 1 : i + 1;
			if (i === -1 || target < 0 || target >= currentKeys.length) return;

			const swappedKeys = [...currentKeys];
			[swappedKeys[i], swappedKeys[target]] = [swappedKeys[target], swappedKeys[i]];

			const entryMap = new Map(rawCategories.map((e) => [e._id, e]));
			const finalIds = withDynamicFirst(swappedKeys, sidebarSectionsOrder);
			await persistCategories(finalIds.map((k) => entryMap.get(k) ?? { _id: k, name: k, default: true }));
		},
		[rawCategories, sidebarSectionsOrder, persistCategories],
	);
};
