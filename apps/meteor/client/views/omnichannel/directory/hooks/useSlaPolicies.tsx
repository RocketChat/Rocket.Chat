import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useSlaPolicies = () => {
	const getSlaPolicies = useEndpoint('GET', '/v1/livechat/sla');
	const { data: { sla } = {}, ...props } = useQuery(['/v1/livechat/sla'], () => getSlaPolicies({}));
	return {
		data: sla,
		...props,
	};
};
