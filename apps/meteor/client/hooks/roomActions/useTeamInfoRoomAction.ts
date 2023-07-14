import { lazy, useEffect } from 'react';

import { ui } from '../../lib/ui';

const TeamsInfoWithRooms = lazy(() => import('../../views/teams/contextualBar/info/TeamsInfoWithRooms'));

export const useTeamInfoRoomAction = () => {
	useEffect(() => {
		return ui.addRoomAction('team-info', {
			groups: ['team'],
			id: 'team-info',
			anonymous: true,
			full: true,
			title: 'Teams_Info',
			icon: 'info-circled',
			template: TeamsInfoWithRooms,
			order: 1,
		});
	}, []);
};
