import { useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

export const useGetTopMessageRoomAction = () => {
	return useMemo((): RoomToolboxActionConfig | undefined => {
		return {
			id: 'go-to-start-of-the-conversation',
			title: 'Go_to_first_message',
			icon: 'arrow-up',
			order: 21,
			type: 'organization',
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
		};
	}, []);
};
