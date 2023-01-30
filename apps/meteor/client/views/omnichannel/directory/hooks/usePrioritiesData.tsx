import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { millisecondsToMinutes } from 'date-fns';

const DEFAULT_SORT = JSON.stringify({ sortItem: 1 });

export const usePrioritiesData = ({ sort = DEFAULT_SORT } = {}) => {
	const getPriorities = useEndpoint('GET', '/v1/livechat/priorities');
	return useQuery(['/v1/livechat/priorities'], () => getPriorities({ sort }), {
		staleTime: millisecondsToMinutes(10),
	});
};
