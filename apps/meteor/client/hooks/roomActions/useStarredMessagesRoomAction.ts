import { lazy, useMemo } from 'react';

import type { ToolboxActionConfig } from '../../views/room/lib/Toolbox';

const StarredMessagesTab = lazy(() => import('../../views/room/contextualBar/StarredMessagesTab'));

export const useStarredMessagesRoomAction = (): ToolboxActionConfig => {
	return useMemo(
		() => ({
			id: 'starred-messages',
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
			title: 'Starred_Messages',
			icon: 'star',
			template: StarredMessagesTab,
			order: 10,
		}),
		[],
	);
};
