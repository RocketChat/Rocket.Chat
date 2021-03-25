import React, { useMemo, useCallback, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Box, Skeleton } from '@rocket.chat/fuselage';

import Header from '../../../components/Header';
import Breadcrumbs from '../../../components/Breadcrumbs';
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

	return <Breadcrumbs.Icon name={icon.name}>{!icon.name && icon}</Breadcrumbs.Icon>;
};

const RoomTitle = ({ room }) => <>
	<HeaderIcon room={room}/>
	<Header.Title>{room.name}</Header.Title>
</>;

const ParentRoomWithPrevRoom = ({ room }) => {
	const { resolve, reject, reset, phase, value } = useAsyncState();
	const getData = useEndpoint('GET', 'rooms.info');

	const fetchData = useCallback(() => {
		reset();
		getData({ roomId: room.prid })
			.then(resolve)
			.catch((error) => {
				reject(error);
			});
	}, [reset, getData, room.prid, resolve, reject]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	if (AsyncStatePhase.LOADING === phase) {
		return <Skeleton width='x48'/>;
	}

	if (AsyncStatePhase.ERROR === phase || !value?.room) {
		return null;
	}

	return <ParentRoom prevRoom={value.room} />;
};

const ParentRoom = ({ prevRoom }) => {
	const prevSubscription = useUserSubscription(prevRoom._id);
	const prevRoomHref = prevSubscription ? roomTypes.getRouteLink(prevSubscription.t, prevSubscription) : null;

	const name = roomTypes.getRoomName(prevRoom.t, prevRoom);

	return <Breadcrumbs.Tag>
		<HeaderIcon room={prevRoom}/>
		{prevRoomHref
			? <Breadcrumbs.Link href={prevRoomHref}>{name}</Breadcrumbs.Link>
			: <Breadcrumbs.Text>{name}</Breadcrumbs.Text>
		}
	</Breadcrumbs.Tag>;
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
	const teamIcon = value?.t === 0 ? 'team' : 'team-lock';

	return teamLoading || userTeamsLoading || room.teamMain ? null : <Breadcrumbs.Tag>
		<Breadcrumbs.IconSmall name={teamIcon}></Breadcrumbs.IconSmall>
		{belongsToTeam
			? <Breadcrumbs.Link href={belongsToTeam && teamMainRoomHref}>{teamMainRoom?.name}</Breadcrumbs.Link>
			: <Breadcrumbs.Text>{teamMainRoom?.name}</Breadcrumbs.Text>
		}
	</Breadcrumbs.Tag>;
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
				{room.prid && <ParentRoomWithPrevRoom room={room} />}
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
