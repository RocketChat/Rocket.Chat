import type { IMessage } from '@rocket.chat/core-typings';
import { useQuery } from '@tanstack/react-query';

import { useChat } from '../../../views/room/contexts/ChatContext';

export const useSubscriptionFromMessageQuery = (message: IMessage) => {
	const chat = useChat();

	return useQuery({
		queryKey: ['messages', message._id, 'subscription'],

		queryFn: async () => {
			return chat?.data.getSubscriptionFromMessage(message) ?? null;
		},
	});
};
