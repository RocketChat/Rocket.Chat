import { useSetting } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const TeamsInfoWithRooms = lazy(() => import('../../views/teams/contextualBar/info/TeamsInfoWithRooms'));

export const useTeamInfoRoomAction = () => {
	const enabled = useSetting('Menu_Room_Info', true);

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!enabled) {
			return undefined;
		}

		return {
			id: 'team-info',
			groups: ['team'],
			anonymous: true,
			full: true,
			title: 'Teams_Info',
			icon: 'info-circled',
			tabComponent: TeamsInfoWithRooms,
			order: 1,
		};
	}, [enabled]);
};
