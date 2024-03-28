import type { IRoom } from '@rocket.chat/core-typings';
import { TEAM_TYPE } from '@rocket.chat/core-typings';
import { HeaderTag, HeaderTagIcon, HeaderTagSkeleton } from '@rocket.chat/ui-client';
import { useUserId, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React from 'react';

import { goToRoomById } from '../../../lib/utils/goToRoomById';

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

	const teamsInfoEndpoint = useEndpoint('GET', '/v1/teams.info');
	const userTeamsListEndpoint = useEndpoint('GET', '/v1/users.listTeams');

	const {
		data: teamInfoData,
		isLoading: teamInfoLoading,
		isError: teamInfoError,
	} = useQuery(['teamId', teamId], async () => teamsInfoEndpoint({ teamId }), {
		keepPreviousData: true,
		retry: (_, error) => (error as APIErrorResult)?.error === 'unauthorized' && false,
	});

	const { data: userTeams, isLoading: userTeamsLoading } = useQuery(['userId', userId], async () => userTeamsListEndpoint({ userId }));

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

	if (teamInfoLoading || userTeamsLoading) {
		return <HeaderTagSkeleton />;
	}

	if (teamInfoError) {
		return null;
	}

	return (
		<HeaderTag
			role='button'
			tabIndex={0}
			onKeyDown={(e) => (e.code === 'Space' || e.code === 'Enter') && redirectToMainRoom()}
			onClick={redirectToMainRoom}
		>
			<HeaderTagIcon icon={{ name: isTeamPublic ? 'team' : 'team-lock' }} />
			{teamInfoData?.teamInfo.name}
		</HeaderTag>
	);
};

export default ParentTeam;
