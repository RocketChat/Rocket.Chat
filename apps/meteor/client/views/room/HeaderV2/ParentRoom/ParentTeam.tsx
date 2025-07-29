import type { IRoom } from '@rocket.chat/core-typings';
import { TEAM_TYPE } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import ParentRoomButton from './ParentRoomButton';
import { useTeamInfoEndpoint } from '../../../../hooks/useTeamInfoEndpoint';
import { goToRoomById } from '../../../../lib/utils/goToRoomById';
import { useUserTeams } from '../../hooks/useUserTeams';

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
		data: teamInfoData,
		isLoading: teamInfoLoading,
		isError: teamInfoError,
	} = useTeamInfoEndpoint(teamId, (_, error) => (error as unknown as APIErrorResult)?.error !== 'unauthorized');

	const { data: userTeams, isLoading: userTeamsLoading } = useUserTeams(userId);

	const userBelongsToTeam = Boolean(userTeams?.teams?.find((team) => team._id === teamId)) || false;
	const isPublicTeam = teamInfoData?.teamInfo.type === TEAM_TYPE.PUBLIC;
	const shouldDisplayTeam = isPublicTeam || userBelongsToTeam;

	const redirectToMainRoom = (): void => {
		const rid = teamInfoData?.teamInfo.roomId;
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
			title={t('Back_to__roomName__team', { roomName: teamInfoData?.teamInfo.name })}
		/>
	);
};

export default ParentTeam;
