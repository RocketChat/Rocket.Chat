import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { marketplaceQueryKeys } from '../../../lib/queryKeys';

export const useAppInstances = ({ appId }: { appId: string }): UseQueryResult<OperationResult<'GET', '/apps/:id/status'>> => {
	const status = useEndpoint('GET', '/apps/:id/status', { id: appId });

	return useQuery({
		queryKey: marketplaceQueryKeys.appStatus(appId),
		queryFn: () => status(),
	});
};
