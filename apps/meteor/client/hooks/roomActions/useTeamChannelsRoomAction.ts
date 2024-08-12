import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const TeamsChannels = lazy(() => import('../../views/teams/contextualBar/channels'));

export const useTeamChannelsRoomAction = () => {
	return useMemo(
		(): RoomToolboxActionConfig => ({
			id: 'team-channels',
			groups: ['team'],
			anonymous: true,
			full: true,
			title: 'Team_Channels',
			icon: 'hash',
			tabComponent: TeamsChannels,
			order: 2,
		}),
		[],
	);
};
