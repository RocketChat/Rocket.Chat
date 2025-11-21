import type { IOutboundProvider, Serialized } from '@rocket.chat/core-typings';
import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint, usePermission } from '@rocket.chat/ui-contexts';
import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { useHasLicenseModule } from '../../../../../hooks/useHasLicenseModule';
import { omnichannelQueryKeys } from '../../../../../lib/queryKeys';
import { useOmnichannelEnterpriseEnabled } from '../../../hooks/useOmnichannelEnterpriseEnabled';

type OutboundProvidersResponse = Serialized<OperationResult<'GET', '/v1/omnichannel/outbound/providers'>>;

type UseOutboundProvidersListProps<TData> = Omit<UseQueryOptions<OutboundProvidersResponse, Error, TData>, 'queryKey' | 'queryFn'> & {
	type?: IOutboundProvider['providerType'];
};

const useOutboundProvidersList = <TData = OutboundProvidersResponse>(options?: UseOutboundProvidersListProps<TData>) => {
	const { type = 'phone', enabled = true, staleTime = 5 * 60 * 1000, ...queryOptions } = options || {};
	const getProviders = useEndpoint('GET', '/v1/omnichannel/outbound/providers');

	const isOmnichannelEnabled = useOmnichannelEnterpriseEnabled();
	const { data: hasOutboundModule = false } = useHasLicenseModule('outbound-messaging');
	const canSendOutboundMessages = usePermission('outbound.send-messages');

	return useQuery<OutboundProvidersResponse, Error, TData>({
		queryKey: omnichannelQueryKeys.outboundProviders({ type }),
		queryFn: () => getProviders({ type }),
		retry: 3,
		enabled: isOmnichannelEnabled && hasOutboundModule && canSendOutboundMessages && enabled,
		staleTime,
		...queryOptions,
	});
};

export default useOutboundProvidersList;
