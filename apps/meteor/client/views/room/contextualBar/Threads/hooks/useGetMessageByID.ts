import type { IMessage } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { onClientMessageReceived } from '../../../../../lib/onClientMessageReceived';
import { mapMessageFromApi } from '../../../../../lib/utils/mapMessageFromApi';
import { Messages } from '../../../../../stores';

export const useGetMessageByID = () => {
	const getMessage = useEndpoint('GET', '/v1/chat.getMessage');
	const storeMessage = Messages.use((state) => state.store);

	return useCallback(
		async (mid: IMessage['_id']) => {
			try {
				const { message: rawMessage } = await getMessage({ msgId: mid });
				const mappedMessage = mapMessageFromApi(rawMessage);
				const message = (await onClientMessageReceived(mappedMessage)) || mappedMessage;
				storeMessage(message);
				return message;
			} catch (error) {
				if (typeof error === 'object' && error !== null && 'success' in error) {
					throw new Error('Message not found');
				}

				throw error;
			}
		},
		[getMessage, storeMessage],
	);
};
