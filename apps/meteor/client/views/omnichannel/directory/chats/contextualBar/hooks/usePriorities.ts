import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { useIsEnterprise } from '../../../../../../hooks/useIsEnterprise';

export const usePriorities = (): UseQueryResult<{
	priorities: {
		name: string;
		description: string;
		dueTimeInMinutes: number;
		_id: string;
		_updatedAt: string;
	}[];
}> => {
	const enterprise = useIsEnterprise();
	const getPriorities = useEndpoint('GET', '/v1/livechat/priorities');
	return useQuery(['livechat', 'priorities', { enterprise }], async () => {
		if (!enterprise) {
			return [];
		}

		return getPriorities({});
	});
};
