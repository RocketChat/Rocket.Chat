import { useDebouncedCallback, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useRef } from 'react';

const PERSIST_DEBOUNCE_MS = 700;

export const useAllGroupsOrder = () => {
	const [order, setOrder] = useLocalStorage<string[]>('sidebarCategoriesOrder', []);
	const savedOrder = useUserPreference<string[]>('sidebarCategoriesOrder');
	const hydrated = useRef(false);
	const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');

	// Restore server-saved order into localStorage on first load (new browser/device).
	useEffect(() => {
		if (!hydrated.current && !order.length && savedOrder?.length) {
			setOrder(savedOrder);
			hydrated.current = true;
		}
	}, [savedOrder]);

	const persist = useDebouncedCallback(async (next: string[]) => {
		await saveUserPreferences({ data: { sidebarCategoriesOrder: next } });
	}, PERSIST_DEBOUNCE_MS);

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
			persist(next);
		},
		[persist, setOrder],
	);

	return { sortGroups, move };
};
