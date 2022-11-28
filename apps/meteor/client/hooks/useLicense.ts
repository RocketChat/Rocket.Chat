import { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

export const useLicense = (): UseQueryResult<OperationResult<'GET', '/v1/licenses.get'>> => {
	const getLicenses = useEndpoint('GET', '/v1/licenses.get');

	return useQuery(['licenses', 'getLicenses'], () => getLicenses(), {
		staleTime: Infinity,
		keepPreviousData: true,
		refetchOnWindowFocus: false,
	});
};
