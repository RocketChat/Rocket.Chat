import { useCallback } from 'react';

import { useSaveCategoryOrder } from './useSaveCategoryOrder';

export const useMoveCategoryPosition = () => {
	const saveCategoryOrder = useSaveCategoryOrder();

	return useCallback(
		async (currentKeys: string[], key: string, direction: 'up' | 'down') => {
			const i = currentKeys.indexOf(key);
			const target = direction === 'up' ? i - 1 : i + 1;
			if (i === -1 || target < 0 || target >= currentKeys.length) return;

			const swappedKeys = [...currentKeys];
			[swappedKeys[i], swappedKeys[target]] = [swappedKeys[target], swappedKeys[i]];

			await saveCategoryOrder(swappedKeys);
		},
		[saveCategoryOrder],
	);
};
