import React, { useMemo } from 'react';

import { TEAM_TYPE } from '../../../../definition/ITeam';
import Header from '../../../components/Header';
import { useUserId } from '../../../contexts/UserContext';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { goToRoomById } from '../../../lib/utils/goToRoomById';

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

	const belongsToTeam = userTeams?.teams?.find((team) => team._id === room.teamId) || false;
	const isTeamPublic = value?.teamInfo.type === TEAM_TYPE.PUBLIC;
	const teamMainRoomHref = () => goToRoomById(value?.teamInfo.roomId);

	if (phase === AsyncStatePhase.LOADING || userTeamsPhase === AsyncStatePhase.LOADING) {
		return <Header.Tag.Skeleton />;
	}

	if (phase === AsyncStatePhase.REJECTED || !value.teamInfo) {
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
