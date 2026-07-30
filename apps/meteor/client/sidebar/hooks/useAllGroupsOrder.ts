import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useCallback } from 'react';

/**
 * Unified ordering for all sidebar groups (custom categories + system groups combined).
 * Persisted in localStorage so moves survive page reloads without a server round-trip.
 * When the order array is empty the groups appear in their natural default order
 * (custom categories first, then system groups in their sidebarSectionsOrder).
 */
export const useAllGroupsOrder = () => {
	const [order, setOrder] = useLocalStorage<string[]>('sidebarAllGroupsOrder', []);

	const sortGroups = useCallback(
		<T extends { key: string }>(groups: T[]): T[] => {
			if (!order.length) return groups;
			const rank = (key: string) => {
				const i = order.indexOf(key);
				return i === -1 ? -1 : i;
			};
			return [...groups].sort((a, b) => rank(a.key) - rank(b.key));
		},
		[order],
	);

	const move = useCallback(
		(currentKeys: string[], key: string, direction: 'up' | 'down') => {
			const i = currentKeys.indexOf(key);
			const target = direction === 'up' ? i - 1 : i + 1;
			if (i === -1 || target < 0 || target >= currentKeys.length) return;
			const next = [...currentKeys];
			[next[i], next[target]] = [next[target], next[i]];
			setOrder(next);
		},
		[setOrder],
	);

	return { sortGroups, move };
};
