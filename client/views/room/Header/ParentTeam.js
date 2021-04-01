import { Meteor } from 'meteor/meteor';
import React, { useMemo } from 'react';

import { roomTypes } from '../../../../app/utils/client';
import Header from '../../../components/Header';
import { useUserSubscription } from '../../../contexts/UserContext';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import HeaderIcon from './HeaderIcon';

const ParentTeam = ({ room }) => {
	const query = useMemo(() => ({ teamId: room.teamId }), [room.teamId]);
	const userTeamQuery = useMemo(() => ({ userId: Meteor.userId() }), []);

	const { value, phase } = useEndpointData('teams.info', query);
	const { value: userTeams, phase: userTeamsPhase } = useEndpointData(
		'users.listTeams',
		userTeamQuery,
	);

	const teamLoading = phase === AsyncStatePhase.LOADING;
	const userTeamsLoading = userTeamsPhase === AsyncStatePhase.LOADING;
	const belongsToTeam = userTeams?.teams?.find((team) => team._id === room.teamId);

	const teamMainRoom = useUserSubscription(value?.teamInfo?.roomId);
	const teamMainRoomHref = teamMainRoom
		? roomTypes.getRouteLink(teamMainRoom.t, teamMainRoom)
		: null;

	return teamLoading || userTeamsLoading || room.teamMain ? null : (
		<Header.Tag>
			<HeaderIcon room={teamMainRoom} />
			{belongsToTeam ? (
				<Header.Link href={teamMainRoomHref}>{teamMainRoom?.name}</Header.Link>
			) : (
				teamMainRoom?.name
			)}
		</Header.Tag>
	);
};

export default ParentTeam;
