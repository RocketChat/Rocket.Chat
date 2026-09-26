import type { IMessage } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useStore } from 'zustand';

import { onClientMessageReceived } from '../../../../../lib/onClientMessageReceived';
import { mapMessageFromApi } from '../../../../../lib/utils/mapMessageFromApi';
import { Messages } from '../../../../../stores';

/** What this throws when the server refuses the message — it is gone, or was never this reader's to have. */
export const MESSAGE_NOT_FOUND = 'Message not found';

export const useGetMessageByID = (shouldStoreMessage: boolean = true) => {
	const getMessage = useEndpoint('GET', '/v1/chat.getMessage');
	const storeMessage = useStore(Messages.use, (state) => state.store);

	return useCallback(
		async (mid: IMessage['_id']) => {
			try {
				const { message: rawMessage } = await getMessage({ msgId: mid });
				const mappedMessage = mapMessageFromApi(rawMessage);
				const message = (await onClientMessageReceived(mappedMessage)) || mappedMessage;
				if (shouldStoreMessage) {
					storeMessage(message);
				}
				return message;
			} catch (error) {
				if (typeof error === 'object' && error !== null && 'success' in error) {
					throw new Error(MESSAGE_NOT_FOUND);
				}

				throw error;
			}
		},
		[getMessage, shouldStoreMessage, storeMessage],
	);
};
