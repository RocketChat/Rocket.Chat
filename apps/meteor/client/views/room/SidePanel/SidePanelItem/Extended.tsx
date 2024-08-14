import type { IRoom } from '@rocket.chat/core-typings';
import {
	Avatar,
	SideBarItem,
	SideBarItemAvatarWrapper,
	SideBarItemCol,
	SideBarItemContent,
	SideBarItemIcon,
	SideBarItemRow,
	SideBarItemTimestamp,
	SideBarItemTitle,
	SidePanelListItem,
} from '@rocket.chat/fuselage';
import React, { memo } from 'react';

import type { RoomSidePanelItemProps } from './RoomSidePanelItem';

type ExtendedProps = RoomSidePanelItemProps & {
	openedRoom: string;
	onClick: (id: string | undefined) => void;
};

const Extended = ({ id, name, icon, openedRoom, onClick, ...props }: ExtendedProps) => {
	console.log(props);
	return (
		<SidePanelListItem>
			<SideBarItem selected={id === openedRoom} onClick={() => onClick(id)}>
				<SideBarItemAvatarWrapper>
					<Avatar size='x36' url='/avatar/julia.foresti' alt='avatar' />
				</SideBarItemAvatarWrapper>

				<SideBarItemCol>
					<SideBarItemRow>
						<SideBarItemIcon name={icon} />
						<SideBarItemTitle>{name}</SideBarItemTitle>
						<SideBarItemTimestamp>12:00</SideBarItemTimestamp>
					</SideBarItemRow>

					<SideBarItemRow>
						<SideBarItemContent>{(props as IRoom).lastMessage?.msg}</SideBarItemContent>
						{/* <SideBarItemBadge title='unread messages' children={Math.floor(Math.random() * 10) + 1} /> */}
						{/* <SideBarItemMenu children={<MenuTemplate />} /> */}
					</SideBarItemRow>
				</SideBarItemCol>
			</SideBarItem>
		</SidePanelListItem>
	);
};

export default memo(Extended);
