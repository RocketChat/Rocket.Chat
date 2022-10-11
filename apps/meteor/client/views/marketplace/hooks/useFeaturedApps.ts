import { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

export const useFeaturedApps = (): UseQueryResult<OperationResult<'GET', '/apps/featured-apps'>> => {
	const featuredApps = useEndpoint('GET', '/apps/featured-apps');

	return useQuery(['featured-apps'], () => featuredApps());
};
