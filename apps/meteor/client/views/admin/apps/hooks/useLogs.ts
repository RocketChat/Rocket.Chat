import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

export const useLogs = (appId: string): UseQueryResult<OperationResult<'GET', '/apps/:id/logs'>> => {
	const logs = useEndpoint('GET', `/apps/${appId}/logs`);

	return useQuery(['MarketplaceAppLogs'], () => logs());
};
