import type { ITeam, Serialized } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryOptions } from '@tanstack/react-query';
import { keepPreviousData, skipToken, useQuery } from '@tanstack/react-query';

import { teamsQueryKeys } from '../lib/queryKeys';

type TeamInfoQueryOptions<TData = Partial<Serialized<ITeam>>> = Omit<
	UseQueryOptions<Partial<Serialized<ITeam>>, Error, TData, ReturnType<typeof teamsQueryKeys.teamInfo>>,
	'queryKey' | 'queryFn'
>;

export const useTeamInfoQuery = <TData = Partial<Serialized<ITeam>>>(
	teamId: ITeam['_id'] | undefined,
	options: TeamInfoQueryOptions<TData> = {},
) => {
	const teamsInfoEndpoint = useEndpoint('GET', '/v1/teams.info');

	return useQuery({
		queryKey: teamsQueryKeys.teamInfo(teamId ?? ('' as ITeam['_id'])),
		queryFn: teamId
			? async () => {
					const result = await teamsInfoEndpoint({ teamId });
					return result.teamInfo;
				}
			: skipToken,
		placeholderData: keepPreviousData,
		enabled: !!teamId,
		...options,
	});
};
