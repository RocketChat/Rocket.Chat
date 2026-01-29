import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

const TeamsInfoWithData = lazy(() => import('../../views/teams/contextualBar/info/TeamsInfoWithData'));

export const useTeamInfoRoomAction = () => {
	return useMemo(
		(): RoomToolboxActionConfig => ({
			id: 'team-info',
			groups: ['team'],
			anonymous: true,
			full: true,
			title: 'Teams_Info',
			icon: 'info-circled',
			tabComponent: TeamsInfoWithData,
			order: 1,
		}),
		[],
	);
};
