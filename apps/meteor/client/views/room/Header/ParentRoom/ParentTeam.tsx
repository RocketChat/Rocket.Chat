import type { IRoom } from '@rocket.chat/core-typings';
import { TEAM_TYPE } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import ParentRoomButton from './ParentRoomButton';
import { useTeamInfoQuery } from '../../../../hooks/useTeamInfoQuery';
import { goToRoomById } from '../../../../lib/utils/goToRoomById';
import { useUserTeamsQuery } from '../../hooks/useUserTeamsQuery';

type APIErrorResult = { success: boolean; error: string };

type ParentTeamProps = {
	room: IRoom;
};

const ParentTeam = ({ room }: ParentTeamProps) => {
	const { t } = useTranslation();
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

	const userBelongsToTeam = Boolean(userTeams?.find((team) => team._id === teamId)) || false;
	const isPublicTeam = teamInfo?.type === TEAM_TYPE.PUBLIC;
	const shouldDisplayTeam = isPublicTeam || userBelongsToTeam;

	const redirectToMainRoom = (): void => {
		const rid = teamInfo?.roomId;
		if (!rid) {
			return;
		}

		goToRoomById(rid);
	};

	if (teamInfoError || !shouldDisplayTeam) {
		return null;
	}

	return (
		<ParentRoomButton
			loading={teamInfoLoading || userTeamsLoading}
			onClick={redirectToMainRoom}
			title={t('Back_to__roomName__team', { roomName: teamInfo?.name })}
		/>
	);
};

export default ParentTeam;
