import type { IMessage } from '@rocket.chat/core-typings';
import { useQuery } from '@tanstack/react-query';

import { messagesQueryKeys } from '../../../lib/queryKeys';
import { useChat } from '../../../views/room/contexts/ChatContext';

export const useSubscriptionFromMessageQuery = (message: IMessage) => {
	const chat = useChat();

	return useQuery({
		queryKey: messagesQueryKeys.subscription(message._id),

		queryFn: async () => {
			return chat?.data.getSubscriptionFromMessage(message) ?? null;
		},
	});
};
