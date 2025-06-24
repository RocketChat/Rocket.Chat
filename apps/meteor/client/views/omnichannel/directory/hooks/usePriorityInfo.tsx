import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useOmnichannelPriorities } from '@rocket.chat/ui-omnichannel';
import { useQuery } from '@tanstack/react-query';

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
