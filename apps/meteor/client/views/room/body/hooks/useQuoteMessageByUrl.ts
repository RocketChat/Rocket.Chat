import { useSearchParameter } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { useChat, useChatComposer } from '../../contexts/ChatContext';

export const useQuoteMessageByUrl = () => {
	const replyMID = useSearchParameter('reply');

	const chat = useChat();
	const composer = useChatComposer();

	if (!chat) {
		throw new Error('No ChatContext provided');
	}

	useEffect(() => {
		if (!replyMID || !composer) {
			return;
		}

		chat.data.getMessageByID(replyMID).then((message) => {
			if (!message) {
				return;
			}

			composer.quoteMessage(message);
		});
	}, [chat.data, composer, replyMID]);
};
