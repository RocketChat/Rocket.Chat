import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useVisitorInfo = (visitorId: string, { enabled = true, gcTime = 0 } = {}) => {
	const getVisitorInfo = useEndpoint('GET', '/v1/livechat/visitors.info');
	const { data: { visitor } = {}, ...props } = useQuery({
		queryKey: ['/v1/livechat/visitors.info', visitorId],
		queryFn: () => getVisitorInfo({ visitorId }),
		enabled,
		gcTime,
	});
	return { data: visitor, ...props };
};
