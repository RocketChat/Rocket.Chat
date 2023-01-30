import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { millisecondsToMinutes } from 'date-fns';

export const useSlaPolicies = () => {
	const getSlaPolicies = useEndpoint('GET', '/v1/livechat/sla');
	const { data: { sla } = {}, ...props } = useQuery(['/v1/livechat/sla'], () => getSlaPolicies({}), {
		staleTime: millisecondsToMinutes(10),
	});

	return {
		data: sla,
		...props,
	};
};
