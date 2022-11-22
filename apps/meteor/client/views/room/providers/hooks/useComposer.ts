import { IMessage } from '@rocket.chat/core-typings';
import { useMemo } from 'react';

import { ChatMessages } from '../../../../../app/ui/client/lib/ChatMessages';
import { ChatAPI } from '../../contexts/ChatContext';

export const useComposer = ({
	chatMessages,
}: {
	/** @deprecated bad coupling */
	chatMessages: ChatMessages;
}): ChatAPI['composer'] =>
	useMemo(() => {
		const composer = {
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
			dismissQuotedMessage: async (mid: IMessage['_id']): Promise<void> => {
				chatMessages.quotedMessages.remove(mid);
			},
			dismissAllQuotedMessages: async (): Promise<void> => {
				chatMessages.quotedMessages.clear();
			},
			quotedMessages: {
				getSnapshot: () => chatMessages.quotedMessages.get(),
				subscribe: (callback: () => void) => chatMessages.quotedMessages.subscribe(callback),
			},
		} as const;

		return composer;
	}, [chatMessages.input, chatMessages.quotedMessages]);
