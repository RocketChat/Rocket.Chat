import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import type { SidebarPresentation, SidebarViewMode } from '../lib/sidebarPresentation';
import { rowHeightByViewMode } from '../lib/sidebarPresentation';

export type { SidebarPresentation, SidebarViewMode };

/** Asked once, for the whole sidebar. */
export const useSidebarPresentation = (): SidebarPresentation => {
	const sidebarViewMode = useUserPreference<SidebarViewMode>('sidebarViewMode');
	const sidebarDisplayAvatar = useUserPreference('sidebarDisplayAvatar');

	return useMemo(() => {
		const viewMode: SidebarViewMode = sidebarViewMode ?? 'extended';

		return {
			viewMode,
			extended: viewMode === 'extended',
			showAvatar: Boolean(sidebarDisplayAvatar),
			rowHeight: rowHeightByViewMode[viewMode],
		};
	}, [sidebarViewMode, sidebarDisplayAvatar]);
};
