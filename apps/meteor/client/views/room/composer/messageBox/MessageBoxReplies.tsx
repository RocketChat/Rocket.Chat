import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { memo, useSyncExternalStore } from 'react';

import MessageBoxReply from './MessageBoxReply';
import { useChat } from '../../contexts/ChatContext';

const MessageBoxReplies = (): ReactElement | null => {
	const chat = useChat();

	if (!chat?.composer?.quotedMessages) {
		throw new Error('Chat context not found');
	}

	const replies = useSyncExternalStore(chat.composer.quotedMessages.subscribe, chat.composer.quotedMessages.get);

	if (!replies.length) {
		return null;
	}

	return (
		<Box mbe={8} position='relative' overflowY='auto' maxHeight='x256'>
			{replies.map((reply) => (
				<MessageBoxReply key={reply._id} reply={reply} />
			))}
		</Box>
	);
};

export default memo(MessageBoxReplies);
