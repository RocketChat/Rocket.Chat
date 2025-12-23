import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryResult, UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

type WorkspaceInfo = {
	license: {
		isEnterprise: boolean;
	};
	workspace: {
		isRegistered: boolean;
	};
};

export const useWorkspacesInfo = <TData = WorkspaceInfo>(
	options?: Omit<UseQueryOptions<WorkspaceInfo, Error, TData>, 'queryKey' | 'queryFn'>,
): UseQueryResult<TData> => {
	const getWorkspacesInfo = useEndpoint('GET', '/v1/workspaces.info');

	return useQuery({
		queryKey: ['workspaces', 'info'],
		queryFn: () => getWorkspacesInfo(),
		staleTime: Infinity,
		...options,
	});
};
