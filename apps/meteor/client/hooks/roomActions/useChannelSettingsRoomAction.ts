import { useSetting } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const Info = lazy(() => import('../../views/room/contextualBar/Info'));

export const useChannelSettingsRoomAction = () => {
	const enabled = useSetting('Menu_Room_Info', true);

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!enabled) {
			return undefined;
		}

		return {
			id: 'channel-settings',
			groups: ['channel', 'group'],
			anonymous: true,
			full: true,
			title: 'Room_Info',
			icon: 'info-circled',
			tabComponent: Info,
			order: 1,
		};
	}, [enabled]);
};
