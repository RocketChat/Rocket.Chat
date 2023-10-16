import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const ContactHistory = lazy(() => import('../../views/omnichannel/contactHistory/ContactHistory'));

export const useContactChatHistoryRoomAction = () => {
	return useMemo(
		(): RoomToolboxActionConfig => ({
			id: 'contact-chat-history',
			groups: ['live'],
			title: 'Contact_Chat_History',
			icon: 'clock',
			tabComponent: ContactHistory,
			order: 11,
		}),
		[],
	);
};
