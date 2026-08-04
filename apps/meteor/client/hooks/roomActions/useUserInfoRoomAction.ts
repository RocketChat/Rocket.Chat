import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { MemberListRouter } from '../../views/room';

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
