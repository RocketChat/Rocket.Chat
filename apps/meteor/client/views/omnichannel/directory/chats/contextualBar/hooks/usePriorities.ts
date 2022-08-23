import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

export const usePriorities = (): UseQueryResult<{
	priorities: {
		name: string;
		description: string;
		dueTimeInMinutes: number;
		_id: string;
		_updatedAt: string;
	}[];
}> => {
	const getPriorities = useEndpoint('GET', '/v1/livechat/priorities');
	return useQuery(['livechat/priorities'], () => getPriorities({}));
};
