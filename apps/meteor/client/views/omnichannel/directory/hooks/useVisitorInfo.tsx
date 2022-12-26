import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useVisitorInfo = (visitorId: string, { enabled = true } = {}) => {
	const getVisitorInfo = useEndpoint('GET', '/v1/livechat/visitors.info');
	const { data: { visitor } = {}, ...props } = useQuery(['/v1/livechat/visitors.info', visitorId], () => getVisitorInfo({ visitorId }), {
		enabled,
	});
	return { data: visitor, ...props };
};
