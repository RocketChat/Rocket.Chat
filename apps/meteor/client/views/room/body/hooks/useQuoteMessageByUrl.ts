import { useSearchParameter } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { useChat } from '../../contexts/ChatContext';

export const useQuoteMessageByUrl = () => {
	const replyMID = useSearchParameter('reply');

	const chat = useChat();

	if (!chat) {
		throw new Error('No ChatContext provided');
	}

	useEffect(() => {
		if (!replyMID) {
			return;
		}

		chat.data.getMessageByID(replyMID).then((message) => {
			if (!message) {
				return;
			}

			chat.composer?.quoteMessage(message);
		});
	}, [chat.data, chat.composer, replyMID]);
};
