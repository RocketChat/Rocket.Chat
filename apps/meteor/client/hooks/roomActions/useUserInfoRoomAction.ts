import { useMemo } from 'react';

import { MemberListRouter } from '../../views/room';
import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

export const useUserInfoRoomAction = () => {
	return useMemo(
		(): RoomToolboxActionConfig => ({
			id: 'user-info',
			groups: ['direct'],
			title: 'User_Info',
			icon: 'user',
			tabComponent: MemberListRouter,
			order: 1,
		}),
		[],
	);
};
