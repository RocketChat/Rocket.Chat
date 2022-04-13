import type { IRoom } from '@rocket.chat/core-typings';
import { TEAM_TYPE } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useMemo } from 'react';

import Header from '../../../components/Header';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { goToRoomById } from '../../../lib/utils/goToRoomById';

type ParentTeamProps = {
	room: IRoom;
};

const ParentTeam = ({ room }: ParentTeamProps): ReactElement | null => {
	const { teamId } = room;
	const userId = useUserId();

	if (!teamId) {
		throw new Error('invalid rid');
	}

	if (!userId) {
		throw new Error('invalid uid');
	}

	const { value, phase } = useEndpointData(
		'teams.info',
		useMemo(() => ({ teamId }), [teamId]),
	);

	const { value: userTeams, phase: userTeamsPhase } = useEndpointData(
		'users.listTeams',
		useMemo(() => ({ userId }), [userId]),
	);

	const belongsToTeam = userTeams?.teams?.find((team) => team._id === teamId) || false;
	const isTeamPublic = value?.teamInfo.type === TEAM_TYPE.PUBLIC;
	const teamMainRoomHref = (): void => {
		const rid = value?.teamInfo.roomId;

		if (!rid) {
			return;
		}

		goToRoomById(rid);
	};

	if (phase === AsyncStatePhase.LOADING || userTeamsPhase === AsyncStatePhase.LOADING) {
		return <Header.Tag.Skeleton />;
	}

	if (phase === AsyncStatePhase.REJECTED || !value?.teamInfo) {
		return null;
	}

	return (
		<Header.Tag>
			<Header.Tag.Icon icon={{ name: isTeamPublic ? 'team' : 'team-lock' }} />
			{isTeamPublic || belongsToTeam ? <Header.Link onClick={teamMainRoomHref}>{value.teamInfo.name}</Header.Link> : value.teamInfo.name}
		</Header.Tag>
	);
};

export default ParentTeam;
