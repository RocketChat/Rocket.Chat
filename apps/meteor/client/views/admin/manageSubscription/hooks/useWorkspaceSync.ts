import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

export const useWorkspaceSync = (): UseQueryResult<OperationResult<'GET', '/v1/cloud.syncWorkspace'>> => {
	const getCloudSync = useEndpoint('GET', '/v1/cloud.syncWorkspace');

	return useQuery(['cloud', 'syncWorkspace'], () => getCloudSync(), { enabled: false, cacheTime: 0, staleTime: 0 });
};
