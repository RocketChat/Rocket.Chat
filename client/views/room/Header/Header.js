import React, { useMemo, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Box, Skeleton, Icon } from '@rocket.chat/fuselage';

import Header from '../../../components/Header';
import { useRoomIcon } from '../../../hooks/useRoomIcon';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { AsyncStatePhase, useAsyncState } from '../../../hooks/useAsyncState';
import Encrypted from './icons/Encrypted';
import Favorite from './icons/Favorite';
import Translate from './icons/Translate';
import ToolBox from './ToolBox';
import QuickActions from './Omnichannel/QuickActions';
import RoomAvatar from '../../../components/avatar/RoomAvatar';
import { useLayout } from '../../../contexts/LayoutContext';
import Burger from './Burger';
import MarkdownText from '../../../components/MarkdownText';
import { roomTypes } from '../../../../app/utils';
import { useUserSubscription, useUserId } from '../../../contexts/UserContext';
import { useUserData } from '../../../hooks/useUserData';
import { useEndpoint } from '../../../contexts/ServerContext';


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

	return <Box w='x20' mi='x2' display='inline-flex' justifyContent='center'>
		{icon.name ? <Icon size='x20' {...icon}/> : Icon}
	</Box>;
};

const RoomTitle = ({ room }) => <>
	<HeaderIcon room={room}/>
	<Header.Title>{room.name}</Header.Title>
</>;

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
		return <Skeleton width='x48'/>;
	}

	if (AsyncStatePhase.ERROR === phase || !value?.room) {
		return null;
	}

	return <ParentRoom room={value.room} />;
};

const ParentRoom = ({ room }) => {
	const href = roomTypes.getRouteLink(room.t, room);

	return <Header.Tag>
		<HeaderIcon room={room}/>
		<Header.Link href={href}>
			{roomTypes.getRoomName(room.t, room)}
		</Header.Link>
	</Header.Tag>;
};

const ParentTeam = ({ room }) => {
	const query = useMemo(() => ({ teamId: room.teamId }), [room.teamId]);
	const userTeamQuery = useMemo(() => ({ userId: Meteor.userId() }), []);

	const { value, phase } = useEndpointData('teams.info', query);
	const { value: userTeams, phase: userTeamsPhase } = useEndpointData('users.listTeams', userTeamQuery);

	const teamLoading = phase === AsyncStatePhase.LOADING;
	const userTeamsLoading = userTeamsPhase === AsyncStatePhase.LOADING;
	const belongsToTeam = userTeams?.teams?.find((team) => team._id === room.teamId);

	const teamMainRoom = useUserSubscription(value?.teamInfo?.roomId);
	const teamMainRoomHref = teamMainRoom ? roomTypes.getRouteLink(teamMainRoom.t, teamMainRoom) : null;

	return teamLoading || userTeamsLoading || room.teamMain ? null : <Header.Tag>
		<HeaderIcon room={teamMainRoom}/>
		{belongsToTeam
			? <Header.Link href={teamMainRoomHref}>{teamMainRoom?.name}</Header.Link>
			: teamMainRoom?.name
		}
	</Header.Tag>;
};
const DirectRoomHeader = ({ room }) => {
	const userId = useUserId();
	const directUserId = room.uids.filter((uid) => uid !== userId).shift();
	const directUserData = useUserData(directUserId);

	return <RoomHeader room={room} topic={directUserData?.statusText} />;
};

const RoomHeader = ({ room, topic }) => {
	const { isMobile } = useLayout();
	const avatar = <RoomAvatar room={room}/>;
	const showQuickActions = roomTypes.showQuickActionButtons(room.t);
	return <Header>
		{ isMobile && <Header.ToolBox>
			<Burger/>
		</Header.ToolBox> }
		{ avatar && <Header.Avatar>{avatar}</Header.Avatar> }
		<Header.Content>
			<Header.Content.Row>
				<RoomTitle room={room}/>
				<Favorite room={room} />
				{room.prid && <ParentRoomWithData room={room} />}
				{room.teamId && <ParentTeam room={room} />}
				<Encrypted room={room} />
				<Translate room={room} />
				{ showQuickActions && <Box mis='x20' display='flex'>
					<QuickActions room={room}/>
				</Box> }
			</Header.Content.Row>
			<Header.Content.Row>
				<Header.Subtitle>{topic && <MarkdownText variant='inlineWithoutBreaks' content={topic}/>}</Header.Subtitle>
			</Header.Content.Row>
		</Header.Content>
		<Header.ToolBox>
			<ToolBox room={room}/>
		</Header.ToolBox>
	</Header>;
};
