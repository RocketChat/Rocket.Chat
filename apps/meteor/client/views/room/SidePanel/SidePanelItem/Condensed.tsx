import { Avatar, SideBarItem, SideBarItemAvatarWrapper, SideBarItemIcon, SideBarItemTitle, SidePanelListItem } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

import type { RoomSidePanelItemProps } from './RoomSidePanelItem';

type CondensedProps = RoomSidePanelItemProps & {
	onClick: (id: string | undefined) => void;
};

const Condensed = ({ id, name, icon, openedRoom, onClick }: CondensedProps) => (
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

export default memo(Condensed);
