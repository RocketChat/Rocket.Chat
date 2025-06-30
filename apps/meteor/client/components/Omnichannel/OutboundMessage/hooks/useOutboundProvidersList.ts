import type { IOutboundProvider, Serialized } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

type UseOutboundProvidersListProps<TData> = {
	queryKey?: unknown[];
	select?: (data: Serialized<IOutboundProvider>[]) => TData;
};

const useOutboundProvidersList = <TData = Serialized<IOutboundProvider>[]>(options?: UseOutboundProvidersListProps<TData>) => {
	const { queryKey, select } = options || {};
	const getProviders = useEndpoint('GET', '/v1/omnichannel/outbound/providers');
	return useQuery<Serialized<IOutboundProvider>[], Error, TData>({
		queryKey: queryKey ?? ['/v1/omnichannel/outbound/providers'],
		queryFn: () => getProviders({ type: 'phone' }),
		initialData: [],
		select,
	});
};

export default useOutboundProvidersList;
