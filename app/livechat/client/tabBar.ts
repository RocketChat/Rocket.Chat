import { lazy } from 'react';

import { addAction } from '../../../client/views/room/lib/Toolbox';

addAction('room-info', {
	groups: ['live'],
	id: 'room-info',
	title: 'Room_Info',
	icon: 'info-circled',
	template: lazy(() => import('../../../client/views/omnichannel/directory/chats/contextualBar/ChatsContextualBar')),
	order: 0,
});

addAction('voip-room-info', {
	groups: ['voip'],
	id: 'voip-room-info',
	title: 'Call_Information',
	icon: 'info-circled',
	template: lazy(() => import('../../../client/views/omnichannel/directory/chats/contextualBar/VoipInfo')),
	order: 0,
});

addAction('contact-chat-history', {
	groups: ['live' /* , 'voip'*/],
	id: 'contact-chat-history',
	title: 'Contact_Chat_History',
	icon: 'clock',
	template: 'contactChatHistory',
	order: 11,
});
