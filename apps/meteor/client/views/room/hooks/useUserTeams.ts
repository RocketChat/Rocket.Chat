import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { teamsQueryKeys } from '../../../lib/queryKeys';

export const useUserTeams = (userId: string) => {
	const userTeamsListEndpoint = useEndpoint('GET', '/v1/users.listTeams');

	return useQuery({
		queryKey: teamsQueryKeys.listUserTeams(userId),
		queryFn: async () => userTeamsListEndpoint({ userId }),
	});
};
