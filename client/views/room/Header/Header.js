import React from 'react';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { ActionButton } from '@rocket.chat/fuselage';

import Header from '../../../components/Header';
import { useRoomIcon } from '../../../hooks/useRoomIcon';
import Encrypted from './icons/Encrypted';
import Favorite from './icons/Favorite';
import Translate from './icons/Translate';
import ToolBox from './ToolBox';
import RoomAvatar from '../../../components/avatar/RoomAvatar';
import { useLayout } from '../../../contexts/LayoutContext';
import Burger from './Burger';
import { useTranslation } from '../../../contexts/TranslationContext';

export default React.memo(({ room }) => {
	const { isEmbedded, showTopNavbarEmbeddedLayout } = useLayout();
	if (isEmbedded && !showTopNavbarEmbeddedLayout) {
		return null;
	}
	return <RoomHeader room={room}/>;
});

const BackToRoom = React.memo(({ small, prid }) => {
	const t = useTranslation();
	const onClick = useMutableCallback(() => {
		FlowRouter.goToRoomById(prid);
	});
	return <ActionButton mie='x4' icon='back' ghost small={small} title={t('Back_to_room')} onClick={onClick}/>;
});


const RoomHeader = ({ room }) => {
	const icon = useRoomIcon(room);
	const { isMobile } = useLayout();
	const avatar = <RoomAvatar room={room}/>;
	return <Header>
		{ (isMobile || room.prid) && <Header.ToolBox>
			{ isMobile && <Burger/>}
			{ room.prid && <BackToRoom small={!isMobile} prid={room.prid}/>}
		</Header.ToolBox> }
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
};
