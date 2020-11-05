import React from 'react';

import Header from '../../components/basic/Header';
import { useRoomIcon } from '../../hooks/useRoomIcon';
import RoomAvatar from '../../components/basic/avatar/RoomAvatar';
import { useUserSubscription } from '../../contexts/UserContext';
import Encrypted from './icons/Encrypted';
import Favorite from './icons/Favorite';
import ToolBox from './ToolBox';
import Translate from './icons/Translate';

export default React.memo(({ _id }) => {
	const room = useUserSubscription(_id);
	room._id = room.rid;
	const icon = useRoomIcon(room);
	const avatar = <RoomAvatar room={room}/>;
	return <Header>
		{ avatar && <Header.Avatar>{avatar}</Header.Avatar> }
		<Header.Content>
			<Header.Content.Row>
				{ icon && <Header.Icon icon={icon}/> }
				<Header.Title>{room.name}</Header.Title>
				<Favorite room={room} />
				<Encrypted room={room} />
				<Translate room={room} />
			</Header.Content.Row>
			<Header.Content.Row>
				<Header.Subtitle>{room.topic}</Header.Subtitle>
			</Header.Content.Row>
		</Header.Content>
		<Header.ToolBox>
			<ToolBox room={room}/>
		</Header.ToolBox>
	</Header>;
});
