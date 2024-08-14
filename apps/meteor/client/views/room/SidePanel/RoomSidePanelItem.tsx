import { Avatar, SideBarItem, SideBarItemAvatarWrapper, SideBarItemIcon, SideBarItemTitle, SidePanelListItem } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import React, { memo, useCallback } from 'react';

import { useSecondLevelOpenedRoom } from '../../../lib/RoomManager';
import { goToRoomById } from '../../../lib/utils/goToRoomById';

type RoomSidePanelItemProps = {
	id: string | undefined;
	name: string | undefined;
	icon: Keys;
};

const RoomSidePanelItem = ({ id, name, icon }: RoomSidePanelItemProps) => {
	const onClick = useCallback((drid) => {
		goToRoomById(drid);
	}, []);

	const openedRoom = useSecondLevelOpenedRoom();

	return (
		<SidePanelListItem key={id}>
			<SideBarItem selected={id === openedRoom} onClick={() => onClick(id)}>
				<SideBarItemAvatarWrapper>
					<Avatar size='x20' url='/avatar/julia.foresti' />
					{/* <Avatar size='x20' url={} alt='avatar' /> */}
				</SideBarItemAvatarWrapper>
				<SideBarItemIcon name={icon} />
				<SideBarItemTitle>{name}</SideBarItemTitle>
				{/* <SideBarItemBadge title='unread messages' children={index + 3} /> */}
				{/* <SideBarItemMenu children={<MenuTemplate />} /> */}
			</SideBarItem>
		</SidePanelListItem>
	);
};

export default memo(RoomSidePanelItem);
