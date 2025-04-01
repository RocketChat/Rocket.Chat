import type { IRoom } from '@rocket.chat/core-typings';
import { TEAM_TYPE } from '@rocket.chat/core-typings';
import { useUserId, useEndpoint } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import ParentRoomButton from './ParentRoomButton';
import { goToRoomById } from '../../../../lib/utils/goToRoomById';

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
