import type { IRoom } from '@rocket.chat/core-typings';
import { TEAM_TYPE } from '@rocket.chat/core-typings';
import { useButtonPattern } from '@rocket.chat/fuselage-hooks';
import { useUserId } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import { HeaderTag, HeaderTagIcon, HeaderTagSkeleton } from '../../../components/Header';
import { useTeamInfoQuery } from '../../../hooks/useTeamInfoQuery';
import { goToRoomById } from '../../../lib/utils/goToRoomById';
import { useUserTeamsQuery } from '../hooks/useUserTeamsQuery';

type APIErrorResult = { success: boolean; error: string };

const ParentTeam = ({ room }: { room: IRoom }): ReactElement | null => {
	const { teamId } = room;
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

	const userBelongsToTeam = userTeams?.find((team) => team._id === teamId) || false;
	const isTeamPublic = teamInfo?.type === TEAM_TYPE.PUBLIC;

	const redirectToMainRoom = (): void => {
		const rid = teamInfo?.roomId;
		if (!rid) {
			return;
		}

		if (!(isTeamPublic || userBelongsToTeam)) {
			return;
		}

		goToRoomById(rid);
	};

	const buttonProps = useButtonPattern(redirectToMainRoom);

	if (teamInfoLoading || userTeamsLoading) {
		return <HeaderTagSkeleton />;
	}

	if (teamInfoError) {
		return null;
	}

	return (
		<HeaderTag {...buttonProps}>
			<HeaderTagIcon icon={{ name: isTeamPublic ? 'team' : 'team-lock' }} />
			{teamInfo?.name}
		</HeaderTag>
	);
};

export default ParentTeam;
