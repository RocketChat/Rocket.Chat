import type { ISidebarCategory } from '@rocket.chat/core-typings';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { usePersistCategoriesMutation } from './usePersistCategoriesMutation';

export const useMoveCategoryPosition = () => {
	const allEntries = useUserPreference<ISidebarCategory[]>('sidebarCategories', []) ?? [];
	const persistMutation = usePersistCategoriesMutation();

	return useCallback(
		async (currentKeys: string[], key: string, direction: 'up' | 'down') => {
			const i = currentKeys.indexOf(key);
			const target = direction === 'up' ? i - 1 : i + 1;
			if (i === -1 || target < 0 || target >= currentKeys.length) return;
			const entryMap = new Map(allEntries.map((e) => [e._id, e]));
			const visibleEntries: ISidebarCategory[] = currentKeys.map((k) => entryMap.get(k) ?? { _id: k, name: k, default: true });
			const hiddenEntries = allEntries.filter((e) => !currentKeys.includes(e._id));
			const next = [...visibleEntries, ...hiddenEntries];
			[next[i], next[target]] = [next[target], next[i]];
			await persistMutation.mutateAsync(next);
		},
		[allEntries, persistMutation],
	);
};
