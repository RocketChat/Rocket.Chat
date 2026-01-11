import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useMessageHistory = (messageId: string) => {
	const getMessageHistory = useEndpoint('GET', '/v1/chat.getMessageHistory');

	return useQuery({
		queryKey: ['message-history', messageId],
		queryFn: () => getMessageHistory({ messageId }),
		enabled: !!messageId,
	});
};
