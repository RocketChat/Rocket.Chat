import type { IMessage, ISubscription, ITranslatedMessage } from '@rocket.chat/core-typings';
import { useEffect } from 'react';

import { MessageAction } from '../../../../app/ui-utils/client';
import { useAutoTranslate } from '../../../views/room/MessageList/hooks/useAutoTranslate';
import { useChat } from '../../../views/room/contexts/ChatContext';

export const useQuoteMessageAction = (
	message: IMessage & Partial<ITranslatedMessage>,
	{ subscription }: { subscription: ISubscription | undefined },
) => {
	const chat = useChat();
	const autoTranslateOptions = useAutoTranslate(subscription);

	useEffect(() => {
		if (!subscription) {
			return;
		}

		MessageAction.addButton({
			id: 'quote-message',
			icon: 'quote',
			label: 'Quote',
			context: ['message', 'message-mobile', 'threads', 'federated'],
			async action() {
				if (message && autoTranslateOptions?.autoTranslateEnabled && autoTranslateOptions.showAutoTranslate(message)) {
					message.msg =
						message.translations && autoTranslateOptions.autoTranslateLanguage
							? message.translations[autoTranslateOptions.autoTranslateLanguage]
							: message.msg;
				}

				await chat?.composer?.quoteMessage(message);
			},
			order: -2,
			group: 'message',
		});

		return () => {
			MessageAction.removeButton('quote-message');
		};
	}, [autoTranslateOptions, chat?.composer, message, subscription]);
};
