import { lazy, useMemo } from 'react';

import type { ToolboxActionConfig } from '../../views/room/lib/Toolbox';

const ContactHistory = lazy(() => import('../../views/omnichannel/contactHistory/ContactHistory'));

export const useContactChatHistoryRoomAction = (): ToolboxActionConfig => {
	return useMemo(
		() => ({
			id: 'contact-chat-history',
			groups: ['live'],
			title: 'Contact_Chat_History',
			icon: 'clock',
			template: ContactHistory,
			order: 11,
		}),
		[],
	);
};
