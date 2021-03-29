import { Meteor } from 'meteor/meteor';
import React, { useMemo } from 'react';

import { roomTypes } from '../../../../app/utils/client';
import Breadcrumbs from '../../../components/Breadcrumbs';
import { useUserSubscription } from '../../../contexts/UserContext';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';

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
	const teamIcon = value?.t === 0 ? 'team' : 'team-lock';

	return teamLoading || userTeamsLoading || room.teamMain ? null : (
		<Breadcrumbs.Tag>
			<Breadcrumbs.IconSmall name={teamIcon}></Breadcrumbs.IconSmall>
			{belongsToTeam ? (
				<Breadcrumbs.Link href={teamMainRoomHref}>{teamMainRoom?.name}</Breadcrumbs.Link>
			) : (
				<Breadcrumbs.Text>{teamMainRoom?.name}</Breadcrumbs.Text>
			)}
		</Breadcrumbs.Tag>
	);
};

export default ParentTeam;
