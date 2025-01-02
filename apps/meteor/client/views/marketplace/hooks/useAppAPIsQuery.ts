import type { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import type { Serialized, App } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { type UseQueryOptions, useQuery } from '@tanstack/react-query';

import { marketplaceQueryKeys } from '../queryKeys';

type UseAppAPIsQueryOptions<TData = Serialized<IApiEndpointMetadata[]>> = Omit<
	UseQueryOptions<Serialized<IApiEndpointMetadata[]>, Error, TData, ReturnType<typeof marketplaceQueryKeys.app.apis>>,
	'queryKey' | 'queryFn'
>;

export const useAppAPIsQuery = <TData = Serialized<IApiEndpointMetadata[]>>(appId: App['id'], options?: UseAppAPIsQueryOptions<TData>) => {
	const getApis = useEndpoint('GET', '/apps/:id/apis', { id: appId });

	return useQuery({
		queryKey: marketplaceQueryKeys.app.apis(appId),
		queryFn: async () => {
			const { apis } = await getApis();

			return apis ?? [];
		},
		...options,
	});
};
