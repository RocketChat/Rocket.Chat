import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useCallback } from 'react';

export const useCollapsedGroups = () => {
	const [collapsedGroups, setCollapsedGroups] = useLocalStorage<string[]>('sidebarGroups', []);

	const handleCollapsedGroups = useCallback(
		(group: string) => {
			if (collapsedGroups.includes(group)) {
				setCollapsedGroups(collapsedGroups.filter((item) => item !== group));
			} else {
				setCollapsedGroups([...collapsedGroups, group]);
			}
		},
		[collapsedGroups, setCollapsedGroups],
	);

	return { collapsedGroups, handleCollapsedGroups };
};
