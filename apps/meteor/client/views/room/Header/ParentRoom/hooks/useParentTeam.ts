import type { IRoom, ITeam } from '@rocket.chat/core-typings';
import { TeamType } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';

import { useTeamInfoQuery } from '../../../../../hooks/useTeamInfoQuery';
import { useUserTeamsQuery } from '../../../hooks/useUserTeamsQuery';

type APIErrorResult = { success: boolean; error: string };

/** Whether a room's parent team is one the viewer may go back to: public, or one they belong to */
export const canShowParentTeam = (teamType: TeamType | undefined, userTeamIds: ITeam['_id'][], teamId: ITeam['_id']): boolean =>
	teamType === TeamType.PUBLIC || userTeamIds.includes(teamId);

type ParentTeam = {
	visible: boolean;
	loading: boolean;
	name: string | undefined;
	mainRoomId: IRoom['_id'] | undefined;
};

/** The team a room belongs to, as far as its header's back button needs it */
export const useParentTeam = (teamId: ITeam['_id']): ParentTeam => {
	const userId = useUserId();

	if (!userId) {
		throw new Error('invalid uid');
	}

	const {
		data: teamInfo,
		isLoading: teamInfoLoading,
		isError: teamInfoError,
	} = useTeamInfoQuery(teamId, { retry: (_, error) => (error as unknown as APIErrorResult)?.error !== 'unauthorized' });

	const { data: userTeams, isLoading: userTeamsLoading } = useUserTeamsQuery(userId);

	return {
		visible:
			!teamInfoError &&
			canShowParentTeam(
				teamInfo?.type,
				(userTeams ?? []).map((team) => team._id),
				teamId,
			),
		loading: teamInfoLoading || userTeamsLoading,
		name: teamInfo?.name,
		mainRoomId: teamInfo?.roomId,
	};
};
