import type { ITeam } from '@rocket.chat/core-typings';
import { TeamType } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';

import { useTeamInfoQuery } from '../../../../hooks/useTeamInfoQuery';
import { useUserTeamsQuery } from '../../../room/hooks/useUserTeamsQuery';

type APIErrorResult = { success: boolean; error: string };

export const useParentTeamData = (teamId?: ITeam['_id']) => {
	const userId = useUserId();

	if (!teamId) {
		throw new Error('invalid rid');
	}

	if (!userId) {
		throw new Error('invalid uid');
	}

	const {
		data: teamInfo,
		isLoading: teamInfoLoading,
		isError: teamInfoError,
	} = useTeamInfoQuery(teamId, { retry: (_, error) => (error as unknown as APIErrorResult)?.error !== 'unauthorized' });

	const { data: userTeams, isLoading: userTeamsLoading } = useUserTeamsQuery(userId);

	const userBelongsToTeam = Boolean(userTeams?.find((team) => team._id === teamId)) || false;
	const isTeamPublic = teamInfo?.type === TeamType.PUBLIC;
	const shouldDisplayTeam = isTeamPublic || userBelongsToTeam;

	return {
		teamName: teamInfo?.name,
		isLoading: userTeamsLoading || teamInfoLoading,
		teamInfoError,
		shouldDisplayTeam,
		isTeamPublic,
	};
};
