import { lazy, useEffect } from 'react';

import { ui } from '../../lib/ui';

const ContactHistory = lazy(() => import('../../views/omnichannel/contactHistory/ContactHistory'));

export const useContactChatHistoryRoomAction = () => {
	useEffect(() => {
		return ui.addRoomAction('contact-chat-history', {
			groups: ['live'],
			id: 'contact-chat-history',
			title: 'Contact_Chat_History',
			icon: 'clock',
			template: ContactHistory,
			order: 11,
		});
	}, []);
};
