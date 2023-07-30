import { lazy, useMemo } from 'react';

import type { ToolboxActionConfig } from '../../views/room/lib/Toolbox';

const TeamsChannels = lazy(() => import('../../views/teams/contextualBar/channels/TeamsChannels'));

export const useTeamChannelsRoomAction = (): ToolboxActionConfig => {
	return useMemo(
		() => ({
			id: 'team-channels',
			groups: ['team'],
			anonymous: true,
			full: true,
			title: 'Team_Channels',
			icon: 'hash',
			template: TeamsChannels,
			order: 2,
		}),
		[],
	);
};
