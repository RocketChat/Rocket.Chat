import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { MemberListRouter } from '../../views/room';
import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

export const useUserInfoRoomAction = () => {
	const enabled = useSetting('Menu_User_Info', true);

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!enabled) {
			return undefined;
		}

		return {
			id: 'user-info',
			groups: ['direct'],
			title: 'User_Info',
			icon: 'user',
			tabComponent: MemberListRouter,
			order: 1,
		};
	}, [enabled]);
};
