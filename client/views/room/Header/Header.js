import React, { useMemo, useEffect } from 'react';
import { Box } from '@rocket.chat/fuselage';

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

const HeaderIconWithRoom = ({ room }) => {
	const icon = useRoomIcon(room);

	return <Header.Tag.Icon icon={icon} />;
};

const RoomTitle = ({ room }) => <>
	<HeaderIconWithRoom room={room}/>
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
		return <Header.Tag.Skeleton />;
	}

	if (AsyncStatePhase.ERROR === phase || !value?.room) {
		return null;
	}

	return <ParentRoom room={value.room} />;
};

const ParentRoom = ({ room }) => {
	const href = roomTypes.getRouteLink(room.t, room);

	return <Header.Tag>
		<HeaderIconWithRoom room={room}/>
		<Header.Link href={href}>
			{roomTypes.getRoomName(room.t, room)}
		</Header.Link>
	</Header.Tag>;
};

const ParentTeam = ({ room }) => {
	const userId = useUserId();

	const { value, phase } = useEndpointData('teams.info', useMemo(() => ({ teamId: room.teamId }), [room.teamId]));
	const { value: userTeams, phase: userTeamsPhase } = useEndpointData('users.listTeams', useMemo(() => ({ userId }), [userId]));

	const belongsToTeam = userTeams?.teams?.find((team) => team._id === room.teamId);

	const teamMainRoom = useUserSubscription(value?.teamInfo?.roomId);
	const teamMainRoomHref = teamMainRoom ? roomTypes.getRouteLink(teamMainRoom.t, teamMainRoom) : null;

	if (phase === AsyncStatePhase.LOADING || userTeamsPhase === AsyncStatePhase.LOADING) {
		return <Header.Tag.Skeleton />;
	}

	if (phase === AsyncStatePhase.REJECTED || !value.teamInfo) {
		return null;
	}

	return (
		<Header.Tag>
			<Header.Tag.Icon icon={{ name: 'team' }} />
			{belongsToTeam && teamMainRoom
				? <Header.Link href={teamMainRoomHref}>{teamMainRoom?.name}</Header.Link>
				: value.teamInfo.name
			}
		</Header.Tag>
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
				{room.teamId && !room.teamMain && <ParentTeam room={room} />}
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
