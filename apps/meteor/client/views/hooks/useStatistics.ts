import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

type UseStatisticsOptions = {
	refresh?: 'false' | 'true';
};

export const useStatistics = ({ refresh }: UseStatisticsOptions = { refresh: 'false' }) => {
	const getStatistics = useEndpoint('GET', '/v1/statistics');

	return useQuery({
		queryKey: ['analytics'],
		queryFn: () => getStatistics({ refresh }),
		staleTime: 10 * 60 * 1000,
	});
};
