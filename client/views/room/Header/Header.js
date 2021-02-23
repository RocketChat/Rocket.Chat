import React from 'react';

import Header from '../../../components/Header';
import Breadcrumbs from '../../../components/Breadcrumbs';
import { useRoomIcon } from '../../../hooks/useRoomIcon';
import Encrypted from './icons/Encrypted';
import Favorite from './icons/Favorite';
import Translate from './icons/Translate';
import ToolBox from './ToolBox';
import RoomAvatar from '../../../components/avatar/RoomAvatar';
import { useLayout } from '../../../contexts/LayoutContext';
import Burger from './Burger';
import MarkdownText from '../../../components/MarkdownText';
import { roomTypes } from '../../../../app/utils';
import { useUserSubscription, useUserId } from '../../../contexts/UserContext';
import { useUserData } from '../../../hooks/useUserData';

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

const RoomTitle = ({ room }) => {
	const prevSubscription = useUserSubscription(room.prid);
	const prevRoomHref = prevSubscription ? roomTypes.getRouteLink(prevSubscription.t, prevSubscription) : null;

	return <Breadcrumbs>
		{room.prid && prevSubscription && <>
			<Breadcrumbs.Item>
				<HeaderIcon room={prevSubscription}/>
				<Breadcrumbs.Link href={prevRoomHref}>{prevSubscription.name}</Breadcrumbs.Link>
			</Breadcrumbs.Item>
			<Breadcrumbs.Separator />
		</>}
		<Breadcrumbs.Item>
			<HeaderIcon room={room}/>
			<Header.Title>{room.name}</Header.Title>
		</Breadcrumbs.Item>
	</Breadcrumbs>;
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

	return <Header>
		{ isMobile && <Header.ToolBox>
			<Burger/>
		</Header.ToolBox> }
		{ avatar && <Header.Avatar>{avatar}</Header.Avatar> }
		<Header.Content>
			<Header.Content.Row>
				<RoomTitle room={room}/>
				<Favorite room={room} />
				<Encrypted room={room} />
				<Translate room={room} />
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
