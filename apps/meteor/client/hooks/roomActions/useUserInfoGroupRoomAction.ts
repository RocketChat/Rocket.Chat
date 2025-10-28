import { useMemo } from 'react';

import { MemberListRouter } from '../../views/room';
import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

export const useUserInfoGroupRoomAction = () => {
	return useMemo(
		(): RoomToolboxActionConfig => ({
			id: 'user-info-group',
			groups: ['direct_multiple'],
			title: 'Members',
			icon: 'members',
			tabComponent: MemberListRouter,
			order: 1,
		}),
		[],
	);
};
