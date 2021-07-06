import React, { useMemo } from 'react';

import { roomTypes } from '../../../../app/utils/client';
import Header from '../../../components/Header';
import { useUserId, useUserSubscription } from '../../../contexts/UserContext';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';

const ParentTeam = ({ room }) => {
	const userId = useUserId();

	const { value, phase } = useEndpointData(
		'teams.info',
		useMemo(() => ({ teamId: room.teamId }), [room.teamId]),
	);
	const { value: userTeams, phase: userTeamsPhase } = useEndpointData(
		'users.listTeams',
		useMemo(() => ({ userId }), [userId]),
	);

	const belongsToTeam = userTeams?.teams?.find((team) => team._id === room.teamId);

	const teamMainRoom = useUserSubscription(value?.teamInfo?.roomId);
	const teamMainRoomHref = teamMainRoom
		? roomTypes.getRouteLink(teamMainRoom.t, teamMainRoom)
		: null;

	if (phase === AsyncStatePhase.LOADING || userTeamsPhase === AsyncStatePhase.LOADING) {
		return <Header.Tag.Skeleton />;
	}

	if (phase === AsyncStatePhase.REJECTED || !value.teamInfo) {
		return null;
	}

	return (
		<Header.Tag>
			<Header.Tag.Icon icon={{ name: 'team' }} />
			{belongsToTeam && teamMainRoom ? (
				<Header.Link href={teamMainRoomHref}>{teamMainRoom?.name}</Header.Link>
			) : (
				value.teamInfo.name
			)}
		</Header.Tag>
	);
};

export default ParentTeam;
