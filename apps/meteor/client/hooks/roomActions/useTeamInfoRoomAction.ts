import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const TeamsInfoWithRooms = lazy(() => import('../../views/teams/contextualBar/info/TeamsInfoWithRooms'));

export const useTeamInfoRoomAction = () => {
	return useMemo(
		(): RoomToolboxActionConfig => ({
			id: 'team-info',
			groups: ['team'],
			anonymous: true,
			full: true,
			title: 'Teams_Info',
			icon: 'info-circled',
			tabComponent: TeamsInfoWithRooms,
			order: 1,
		}),
		[],
	);
};
