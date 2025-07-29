import type { IRoom } from '@rocket.chat/core-typings';
import { TEAM_TYPE } from '@rocket.chat/core-typings';
import { useButtonPattern } from '@rocket.chat/fuselage-hooks';
import { useUserId } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import { HeaderTag, HeaderTagIcon, HeaderTagSkeleton } from '../../../components/Header';
import { useTeamInfoEndpoint } from '../../../hooks/useTeamInfoEndpoint';
import { goToRoomById } from '../../../lib/utils/goToRoomById';
import { useUserTeams } from '../hooks/useUserTeams';

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
		data: teamInfoData,
		isLoading: teamInfoLoading,
		isError: teamInfoError,
	} = useTeamInfoEndpoint(teamId, (_, error) => (error as unknown as APIErrorResult)?.error === 'unauthorized' && false);

	const { data: userTeams, isLoading: userTeamsLoading } = useUserTeams(userId);

	const userBelongsToTeam = userTeams?.teams?.find((team) => team._id === teamId) || false;
	const isTeamPublic = teamInfoData?.teamInfo.type === TEAM_TYPE.PUBLIC;

	const redirectToMainRoom = (): void => {
		const rid = teamInfoData?.teamInfo.roomId;
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
			{teamInfoData?.teamInfo.name}
		</HeaderTag>
	);
};

export default ParentTeam;
