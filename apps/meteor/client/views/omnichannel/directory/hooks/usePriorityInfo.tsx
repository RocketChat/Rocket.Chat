import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { useOmnichannelPriorities } from '../../../../omnichannel/hooks/useOmnichannelPriorities';

export const usePriorityInfo = (priorityId: string) => {
	const { enabled } = useOmnichannelPriorities();
	const getPriority = useEndpoint('GET', `/v1/livechat/priorities/:priorityId`, { priorityId });
	return useQuery({
		queryKey: ['/v1/livechat/priorities', priorityId],
		queryFn: () => getPriority(),
		gcTime: 0,
		enabled,
	});
};
