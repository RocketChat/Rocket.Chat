import { Avatar, SideBarItem, SideBarItemAvatarWrapper, SideBarItemIcon, SideBarItemTitle, SidePanelListItem } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

import type { RoomSidePanelItemProps } from './RoomSidePanelItem';

type MediumProps = RoomSidePanelItemProps & {
	openedRoom: string;
	onClick: (id: string | undefined) => void;
};

const Medium = ({ id, name, icon, onClick, openedRoom }: MediumProps) => (
	<SidePanelListItem>
		<SideBarItem selected={id === openedRoom} onClick={() => onClick(id)}>
			<SideBarItemAvatarWrapper>
				<Avatar size='x28' url='/avatar/julia.foresti' />
			</SideBarItemAvatarWrapper>
			<SideBarItemIcon name={icon} />
			<SideBarItemTitle>{name}</SideBarItemTitle>
			{/* <SideBarItemBadge title='unread messages' children={Math.floor(Math.random() * 10) + 1} />
        <SideBarItemMenu children={<MenuTemplate />} /> */}
		</SideBarItem>
	</SidePanelListItem>
);

export default memo(Medium);
