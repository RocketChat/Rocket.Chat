import { lazy, useEffect } from 'react';

import { ui } from '../../lib/ui';

const TeamsChannels = lazy(() => import('../../views/teams/contextualBar/channels/TeamsChannels'));

export const useTeamChannelsRoomAction = () => {
	useEffect(() => {
		return ui.addRoomAction('team-channels', {
			groups: ['team'],
			id: 'team-channels',
			anonymous: true,
			full: true,
			title: 'Team_Channels',
			icon: 'hash',
			template: TeamsChannels,
			order: 2,
		});
	}, []);
};
