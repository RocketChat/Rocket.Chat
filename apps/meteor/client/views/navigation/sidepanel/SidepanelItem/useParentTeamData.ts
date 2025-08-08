import type { ITeam } from '@rocket.chat/core-typings';
import { TEAM_TYPE } from '@rocket.chat/core-typings';
import { useEndpoint, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import { goToRoomById } from '../../../../lib/utils/goToRoomById';

type APIErrorResult = { success: boolean; error: string };

export const useParentTeamData = (teamId?: ITeam['_id']) => {
	const userId = useUserId();

	if (!teamId) {
		throw new Error('invalid rid');
	}

	if (!userId) {
		throw new Error('invalid uid');
	}

	const teamsInfoEndpoint = useEndpoint('GET', '/v1/teams.info');
	const userTeamsListEndpoint = useEndpoint('GET', '/v1/users.listTeams');

	const {
		data: teamInfoData,
		isLoading: teamInfoLoading,
		isError: teamInfoError,
	} = useQuery({
		queryKey: ['teamId', teamId],
		queryFn: async () => teamsInfoEndpoint({ teamId }),
		placeholderData: keepPreviousData,
		retry: (_, error: APIErrorResult) => error?.error === 'unauthorized' && false,
	});

	const { data: userTeams, isLoading: userTeamsLoading } = useQuery({
		queryKey: ['userId', userId],
		queryFn: async () => userTeamsListEndpoint({ userId }),
	});

	const userBelongsToTeam = Boolean(userTeams?.teams?.find((team) => team._id === teamId)) || false;
	const isTeamPublic = teamInfoData?.teamInfo.type === TEAM_TYPE.PUBLIC;
	const shouldDisplayTeam = isTeamPublic || userBelongsToTeam;

	const redirectToMainRoom = (): void => {
		const rid = teamInfoData?.teamInfo.roomId;
		if (!rid) {
			return;
		}

		goToRoomById(rid);
	};

	return {
		teamName: teamInfoData?.teamInfo.name,
		isLoading: userTeamsLoading || teamInfoLoading,
		redirectToMainRoom,
		teamInfoError,
		shouldDisplayTeam,
		isTeamPublic,
	};
};
