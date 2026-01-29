import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { MemberListRouter } from '../../views/room';

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
