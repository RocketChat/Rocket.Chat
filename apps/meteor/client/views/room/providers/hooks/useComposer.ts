import { IMessage } from '@rocket.chat/core-typings';
import { useMemo } from 'react';

import { ChatMessages } from '../../../../../app/ui/client/lib/ChatMessages';
import { ChatAPI } from '../../contexts/ChatContext';

export const useComposer = ({ chatMessages }: { chatMessages: ChatMessages }): ChatAPI['composer'] =>
	useMemo(
		() =>
			({
				replyWith: async (text: string): Promise<void> => {
					if (chatMessages?.input) {
						chatMessages.input.value = text;
						chatMessages.input.focus();
					}
				},
				quoteMessage: async (message: IMessage): Promise<void> => {
					chatMessages.quotedMessages.add(message);

					if (chatMessages.input) $(chatMessages.input)?.trigger('focus').data('mention-user', false).trigger('dataChange');
				},
			} as const),
		[chatMessages.input, chatMessages.quotedMessages],
	);
