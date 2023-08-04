import { useSetting } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const TeamsChannels = lazy(() => import('../../views/teams/contextualBar/channels/TeamsChannels'));

export const useTeamChannelsRoomAction = () => {
	const enabled = useSetting('Menu_Team_Channels');

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!enabled) {
			return undefined;
		}

		return {
			id: 'team-channels',
			groups: ['team'],
			anonymous: true,
			full: true,
			title: 'Team_Channels',
			icon: 'hash',
			tabComponent: TeamsChannels,
			order: 2,
		};
	}, [enabled]);
};
