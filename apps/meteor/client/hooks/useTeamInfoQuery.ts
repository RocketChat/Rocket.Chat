import type { ITeam, Serialized } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryOptions } from '@tanstack/react-query';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { teamsQueryKeys } from '../lib/queryKeys';

type TeamInfoQueryOptions<TData = Partial<Serialized<ITeam>>> = Omit<
	UseQueryOptions<Partial<Serialized<ITeam>>, Error, TData, ReturnType<typeof teamsQueryKeys.teamInfo>>,
	'queryKey' | 'queryFn'
>;

export const useTeamInfoQuery = <TData = Partial<Serialized<ITeam>>>(teamId: string, options: TeamInfoQueryOptions<TData> = {}) => {
	const teamsInfoEndpoint = useEndpoint('GET', '/v1/teams.info');

	return useQuery({
		queryKey: teamsQueryKeys.teamInfo(teamId),
		queryFn: async () => {
			const result = await teamsInfoEndpoint({ teamId });
			return result.teamInfo;
		},
		placeholderData: keepPreviousData,
		enabled: teamId !== '',
		...options,
	});
};
