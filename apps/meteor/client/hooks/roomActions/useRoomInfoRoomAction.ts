import { lazy, useEffect } from 'react';

import { ui } from '../../lib/ui';

const ChatsContextualBar = lazy(() => import('../../views/omnichannel/directory/chats/contextualBar/ChatsContextualBar'));

export const useRoomInfoRoomAction = () => {
	useEffect(() => {
		return ui.addRoomAction('room-info', {
			groups: ['live'],
			id: 'room-info',
			title: 'Room_Info',
			icon: 'info-circled',
			template: ChatsContextualBar,
			order: 0,
		});
	}, []);
};
