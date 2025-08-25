import type { IOutboundProvider, Serialized } from '@rocket.chat/core-typings';
import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { useHasLicenseModule } from '../../../../hooks/useHasLicenseModule';
import { omnichannelQueryKeys } from '../../../../lib/queryKeys';

type OutboundProvidersResponse = Serialized<OperationResult<'GET', '/v1/omnichannel/outbound/providers'>>;

type UseOutboundProvidersListProps<TData> = Omit<UseQueryOptions<OutboundProvidersResponse, Error, TData>, 'queryKey' | 'queryFn'> & {
	type?: IOutboundProvider['providerType'];
};

const useOutboundProvidersList = <TData = OutboundProvidersResponse>(options?: UseOutboundProvidersListProps<TData>) => {
	const { type = 'phone', enabled = true, staleTime = 1000 * 60 * 5, ...queryOptions } = options || {};
	const getProviders = useEndpoint('GET', '/v1/omnichannel/outbound/providers');
	const hasModule = useHasLicenseModule('outbound-messaging');

	return useQuery<OutboundProvidersResponse, Error, TData>({
		queryKey: omnichannelQueryKeys.outboundProviders(),
		queryFn: () => getProviders({ type }),
		retry: 3,
		enabled: hasModule && enabled,
		staleTime,
		...queryOptions,
	});
};

export default useOutboundProvidersList;
