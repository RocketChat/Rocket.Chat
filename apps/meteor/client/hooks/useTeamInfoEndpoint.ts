import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryOptions } from '@tanstack/react-query';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { teamsQueryKeys } from '../lib/queryKeys';

export const useTeamInfoEndpoint = (teamId: string, retry: UseQueryOptions['retry'] = false) => {
	const teamsInfoEndpoint = useEndpoint('GET', '/v1/teams.info');

	return useQuery({
		queryKey: teamsQueryKeys.teamInfo(teamId),
		queryFn: async () => teamsInfoEndpoint({ teamId }),
		placeholderData: keepPreviousData,
		retry,
		enabled: teamId !== '',
	});
};
