import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import type { KeyboardEvent } from 'react';
import { useCallback } from 'react';

export const useCollapsedGroups = () => {
	const [collapsedGroups, setCollapsedGroups] = useLocalStorage<string[]>('sidebarGroups', []);

	const handleClick = useCallback(
		(group: string) => {
			if (collapsedGroups.includes(group)) {
				setCollapsedGroups(collapsedGroups.filter((item) => item !== group));
			} else {
				setCollapsedGroups([...collapsedGroups, group]);
			}
		},
		[collapsedGroups, setCollapsedGroups],
	);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent, group: string) => {
			if (['Enter', 'Space'].includes(event.code)) {
				event.preventDefault();
				handleClick(group);
			}
		},
		[handleClick],
	);

	return { collapsedGroups, handleClick, handleKeyDown };
};
