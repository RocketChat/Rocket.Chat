import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useCallback } from 'react';

/**
 * Persists a user-chosen order for the system/standard sidebar groups (menu-driven Move up / Move down).
 * Custom categories are ordered by their preference array instead.
 */
export const useSystemGroupsOrder = () => {
	const [order, setOrder] = useLocalStorage<string[]>('sidebarSystemGroupsOrder', []);

	const sortGroups = useCallback(
		<T extends { key: string }>(groups: T[]): T[] => {
			if (!order.length) {
				return groups;
			}
			const rank = (key: string) => {
				const index = order.indexOf(key);
				return index === -1 ? Number.MAX_SAFE_INTEGER : index;
			};
			return [...groups].sort((a, b) => rank(a.key) - rank(b.key));
		},
		[order],
	);

	/** Swap a group with its neighbor among the currently-visible system groups. */
	const move = useCallback(
		(visibleKeys: string[], key: string, direction: 'up' | 'down') => {
			const index = visibleKeys.indexOf(key);
			const target = direction === 'up' ? index - 1 : index + 1;
			if (index === -1 || target < 0 || target >= visibleKeys.length) {
				return;
			}
			const next = [...visibleKeys];
			[next[index], next[target]] = [next[target], next[index]];
			setOrder(next);
		},
		[setOrder],
	);

	return { sortGroups, move };
};
