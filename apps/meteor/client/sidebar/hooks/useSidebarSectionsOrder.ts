import { SIDEBAR_SYSTEM_GROUP_KEYS, isSidebarSystemGroupKey } from '@rocket.chat/core-typings';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export const useSidebarSectionsOrder = (): readonly string[] => {
	const stored = useUserPreference<string[]>('sidebarSectionsOrder');

	return useMemo(() => (stored ? stored.filter(isSidebarSystemGroupKey) : SIDEBAR_SYSTEM_GROUP_KEYS), [stored]);
};
