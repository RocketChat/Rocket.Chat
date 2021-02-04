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
import { useUserRoom } from '../../../contexts/UserContext';

export default React.memo(({ room }) => {
	const { isEmbedded, showTopNavbarEmbeddedLayout } = useLayout();
	if (isEmbedded && !showTopNavbarEmbeddedLayout) {
		return null;
	}
	return <RoomHeader room={room}/>;
});

const HeaderIcon = ({ room }) => {
	const icon = useRoomIcon(room);

	return <Breadcrumbs.Icon name={icon.name}>{!icon.name && icon}</Breadcrumbs.Icon>;
};

const RoomTitle = ({ room }) => {
	const prevRoom = useUserRoom(room.prid);
	const prevRoomHref = prevRoom ? roomTypes.getRouteLink(prevRoom.t, prevRoom) : null;

	return <Breadcrumbs>
		{room.prid && prevRoom && <>
			<Breadcrumbs.Item>
				<HeaderIcon room={prevRoom}/>
				<Breadcrumbs.Link href={prevRoomHref}>{prevRoom.name}</Breadcrumbs.Link>
			</Breadcrumbs.Item>
			<Breadcrumbs.Separator />
		</>}
		<Breadcrumbs.Item>
			<HeaderIcon room={room}/>
			<Breadcrumbs.Text>{room.name}</Breadcrumbs.Text>
		</Breadcrumbs.Item>
	</Breadcrumbs>;
};


const RoomHeader = ({ room }) => {
	const { isMobile } = useLayout();
	const avatar = <RoomAvatar room={room}/>;

	return <Header>
		{ (isMobile || room.prid) && <Header.ToolBox>
			{ isMobile && <Burger/>}
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
				<Header.Subtitle>{room.topic && <MarkdownText withRichContent={false} content={room.topic}/>}</Header.Subtitle>
			</Header.Content.Row>
		</Header.Content>
		<Header.ToolBox>
			<ToolBox room={room}/>
		</Header.ToolBox>
	</Header>;
};
