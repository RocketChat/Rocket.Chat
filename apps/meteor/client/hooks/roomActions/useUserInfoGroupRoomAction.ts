import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { MemberListRouter } from '../../views/room';
import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

export const useUserInfoGroupRoomAction = () => {
	const enabled = useSetting('Menu_Room_Members', true);

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!enabled) {
			return undefined;
		}

		return {
			id: 'user-info-group',
			groups: ['direct_multiple'],
			title: 'Members',
			icon: 'members',
			tabComponent: MemberListRouter,
			order: 1,
		};
	}, [enabled]);
};
