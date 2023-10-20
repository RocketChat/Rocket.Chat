import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useAnalyticsObject = () => {
	const getAnalytics = useEndpoint('GET', '/v1/statistics');

	return useQuery(['analytics'], () => getAnalytics({}), { staleTime: 10 * 60 * 1000 });
};
