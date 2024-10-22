import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import React from 'react';

import ContactHistoryMessagesList from '../contactHistory/MessageList/ContactHistoryMessagesList';
import ChatFiltersContextualBar from './chats/ChatFiltersContextualBar';
import ChatsProvider from './chats/ChatsProvider';

const ChatsContextualBar = () => {
	const router = useRouter();
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const handleOpenRoom = () => id && router.navigate(`/live/${id}`);
	const handleClose = () => router.navigate('/omnichannel-directory/chats');

	if (context === 'filters') {
		return (
			<ChatsProvider>
				<ChatFiltersContextualBar onClose={handleClose} />
			</ChatsProvider>
		);
	}

	if (context === 'info' && id) {
		return <ContactHistoryMessagesList chatId={id} onClose={handleClose} onOpenRoom={handleOpenRoom} />;
	}

	return null;
};

export default ChatsContextualBar;
