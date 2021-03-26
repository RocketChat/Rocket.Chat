import { Box, Skeleton } from '@rocket.chat/fuselage';
import { Meteor } from 'meteor/meteor';
import React, { useMemo, useEffect } from 'react';

import { roomTypes } from '../../../../app/utils';
import Breadcrumbs from '../../../components/Breadcrumbs';
import Header from '../../../components/Header';
import MarkdownText from '../../../components/MarkdownText';
import RoomAvatar from '../../../components/avatar/RoomAvatar';
import { useLayout } from '../../../contexts/LayoutContext';
import { useEndpoint } from '../../../contexts/ServerContext';
import { useUserSubscription, useUserId } from '../../../contexts/UserContext';
import { AsyncStatePhase, useAsyncState } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { useRoomIcon } from '../../../hooks/useRoomIcon';
import { useUserData } from '../../../hooks/useUserData';
import Burger from './Burger';
import QuickActions from './Omnichannel/QuickActions';
import ToolBox from './ToolBox';
import Encrypted from './icons/Encrypted';
import Favorite from './icons/Favorite';
import Translate from './icons/Translate';

export default React.memo(({ room }) => {
	const { isEmbedded, showTopNavbarEmbeddedLayout } = useLayout();
	if (isEmbedded && !showTopNavbarEmbeddedLayout) {
		return null;
	}

	if (room.t === 'd' && room.uids.length < 3) {
		return <DirectRoomHeader room={room} />;
	}

	return <RoomHeader room={room} topic={room.topic} />;
});

const HeaderIcon = ({ room }) => {
	const icon = useRoomIcon(room);

	return <Breadcrumbs.Icon name={icon.name}>{!icon.name && icon}</Breadcrumbs.Icon>;
};

const RoomTitle = ({ room }) => (
	<>
		<HeaderIcon room={room} />
		<Header.Title>{room.name}</Header.Title>
	</>
);

const ParentRoomWithData = ({ room }) => {
	const subscription = useUserSubscription(room.prid);

	if (subscription) {
		return <ParentRoom room={subscription} />;
	}

	return <ParentRoomWithEndpointData rid={room.prid} />;
};

const ParentRoomWithEndpointData = ({ rid }) => {
	const { resolve, reject, reset, phase, value } = useAsyncState();
	const getData = useEndpoint('GET', 'rooms.info');

	useEffect(() => {
		(async () => {
			reset();
			getData({ roomId: rid })
				.then(resolve)
				.catch((error) => {
					reject(error);
				});
		})();
	}, [reset, getData, rid, resolve, reject]);

	if (AsyncStatePhase.LOADING === phase) {
		return <Skeleton width='x48' />;
	}

	if (AsyncStatePhase.ERROR === phase || !value?.room) {
		return null;
	}

	return <ParentRoom room={value.room} />;
};

const ParentRoom = ({ room }) => {
	const href = roomTypes.getRouteLink(room.t, room);

	return (
		<Breadcrumbs.Tag>
			<HeaderIcon room={room} />
			<Breadcrumbs.Link href={href}>{roomTypes.getRoomName(room.t, room)}</Breadcrumbs.Link>
		</Breadcrumbs.Tag>
	);
};

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
const DirectRoomHeader = ({ room }) => {
	const userId = useUserId();
	const directUserId = room.uids.filter((uid) => uid !== userId).shift();
	const directUserData = useUserData(directUserId);

	return <RoomHeader room={room} topic={directUserData?.statusText} />;
};

const RoomHeader = ({ room, topic }) => {
	const { isMobile } = useLayout();
	const avatar = <RoomAvatar room={room} />;
	const showQuickActions = roomTypes.showQuickActionButtons(room.t);
	return (
		<Header>
			{isMobile && (
				<Header.ToolBox>
					<Burger />
				</Header.ToolBox>
			)}
			{avatar && <Header.Avatar>{avatar}</Header.Avatar>}
			<Header.Content>
				<Header.Content.Row>
					<RoomTitle room={room} />
					<Favorite room={room} />
					{room.prid && <ParentRoomWithData room={room} />}
					{room.teamId && <ParentTeam room={room} />}
					<Encrypted room={room} />
					<Translate room={room} />
					{showQuickActions && (
						<Box mis='x20' display='flex'>
							<QuickActions room={room} />
						</Box>
					)}
				</Header.Content.Row>
				<Header.Content.Row>
					<Header.Subtitle>
						{topic && <MarkdownText variant='inlineWithoutBreaks' content={topic} />}
					</Header.Subtitle>
				</Header.Content.Row>
			</Header.Content>
			<Header.ToolBox>
				<ToolBox room={room} />
			</Header.ToolBox>
		</Header>
	);
};
