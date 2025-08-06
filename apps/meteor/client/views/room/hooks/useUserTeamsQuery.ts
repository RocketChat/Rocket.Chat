import type { ITeam, Serialized } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';

import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { teamsQueryKeys } from '../../../lib/queryKeys';

type UserTeamsQueryOptions<TData = ITeam[]> = Omit<
	UseQueryOptions<Serialized<ITeam[]>, Error, TData, ReturnType<typeof teamsQueryKeys.listUserTeams>>,
	'queryKey' | 'queryFn'
>;

export const useUserTeamsQuery = <TData = ITeam[]>(userId: string, options: UserTeamsQueryOptions<TData> = {}) => {
	const userTeamsListEndpoint = useEndpoint('GET', '/v1/users.listTeams');

	return useQuery({
		queryKey: teamsQueryKeys.listUserTeams(userId),
		queryFn: async () => {
			const response = await userTeamsListEndpoint({ userId });
			return response.teams;
		},
		...options,
	});
};
