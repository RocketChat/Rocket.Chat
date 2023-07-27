import { lazy, useMemo } from 'react';

import type { ToolboxActionConfig } from '../../views/room/lib/Toolbox';

const MentionsTab = lazy(() => import('../../views/room/contextualBar/MentionsTab'));

export const useMentionsRoomAction = (): ToolboxActionConfig => {
	return useMemo(
		() => ({
			id: 'mentions',
			groups: ['channel', 'group', 'team'],
			title: 'Mentions',
			icon: 'at',
			template: MentionsTab,
			order: 9,
		}),
		[],
	);
};
