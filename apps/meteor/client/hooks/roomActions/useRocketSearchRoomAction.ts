import { lazy, useMemo } from 'react';

import type { ToolboxActionConfig } from '../../views/room/lib/Toolbox';

const MessageSearchTab = lazy(() => import('../../views/room/contextualBar/MessageSearchTab'));

export const useRocketSearchRoomAction = (): ToolboxActionConfig => {
	return useMemo(
		() => ({
			id: 'rocket-search',
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'live', 'team'],
			title: 'Search_Messages',
			icon: 'magnifier',
			template: MessageSearchTab,
			order: 6,
		}),
		[],
	);
};
