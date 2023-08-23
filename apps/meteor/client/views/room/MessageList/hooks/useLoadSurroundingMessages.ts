import type { IMessage } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { legacyJumpToMessage } from '../../../../lib/utils/legacyJumpToMessage';

export const useLoadSurroundingMessages = (msgId?: IMessage['_id']) => {
	const queryClient = useQueryClient();
	const getMessage = useEndpoint('GET', '/v1/chat.getMessage');

	useEffect(() => {
		if (!msgId) {
			return;
		}
		const abort = new AbortController();

		queryClient
			.fetchQuery({
				queryKey: ['chat.getMessage', msgId],
				queryFn: () => {
					return getMessage({ msgId });
				},
			})
			.then(({ message }) => {
				if (abort.signal.aborted) {
					return;
				}
				// Serialized IMessage dates are strings. For this function, only ts is needed
				legacyJumpToMessage({ ...message, ts: new Date(message.ts) } as any as IMessage);
			})
			.catch((error) => {
				console.warn(error);
			});
		return () => {
			abort.abort();
		};
	}, [msgId, queryClient, getMessage]);
};
