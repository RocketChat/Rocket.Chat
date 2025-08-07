import type { Serialized } from '@rocket.chat/core-typings';
import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

type OutboundProvidersResponse = Serialized<OperationResult<'GET', '/v1/omnichannel/outbound/providers'>>;

type UseOutboundProvidersListProps<TData> = Partial<
	Pick<UseQueryOptions<OutboundProvidersResponse, Error, TData, unknown[]>, 'queryKey' | 'select'>
>;

const useOutboundProvidersList = <TData = OutboundProvidersResponse>(options?: UseOutboundProvidersListProps<TData>) => {
	const { queryKey, select } = options || {};
	const getProviders = useEndpoint('GET', '/v1/omnichannel/outbound/providers');
	return useQuery<OutboundProvidersResponse, Error, TData>({
		queryKey: queryKey ?? ['/v1/omnichannel/outbound/providers'],
		queryFn: () => getProviders({ type: 'phone' }),
		select,
	});
};

export default useOutboundProvidersList;
