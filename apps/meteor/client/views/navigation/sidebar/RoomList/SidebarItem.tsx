import {
	IconButton,
	SidebarItem as FuselageSidebarItem,
	SidebarItemAvatarWrapper,
	SidebarItemMenu,
	SidebarItemTitle,
} from '@rocket.chat/fuselage';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes, ReactNode } from 'react';
import { memo } from 'react';

import { useDeferredMenuMount } from '../../../../sidebar/Item/useDeferredMenuMount';

export type SidebarItemProps = {
	title: ReactNode;
	titleIcon?: ReactNode;
	icon?: ReactNode;
	actions?: ReactNode;
	href?: string;
	unread?: boolean;
	menu?: ReactNode;
	menuOptions?: any;
	selected?: boolean;
	badges?: ReactNode;
	clickable?: boolean;
	room: SubscriptionWithRoom;
} & Omit<HTMLAttributes<HTMLAnchorElement>, 'is'>;

const SidebarItem = ({ icon, title, actions, unread, menu, badges, room, ...props }: SidebarItemProps) => {
	const { mounted: menuVisibility, requestMount, mountNow } = useDeferredMenuMount();

	return (
		<FuselageSidebarItem {...props} onFocus={mountNow} onPointerEnter={requestMount} aria-selected={props.selected}>
			<SidebarItemAvatarWrapper>
				<RoomAvatar size='x20' room={{ ...room, _id: room.rid || room._id, type: room.t }} />
			</SidebarItemAvatarWrapper>
			{icon}
			<SidebarItemTitle unread={unread}>{title}</SidebarItemTitle>
			{badges}
			{actions}
			{menu && (
				<SidebarItemMenu>
					{menuVisibility ? (
						menu
					) : (
						<IconButton tabIndex={-1} aria-hidden mini rcx-sidebar-item__menu icon='kebab' onPointerDown={mountNow} />
					)}
				</SidebarItemMenu>
			)}
		</FuselageSidebarItem>
	);
};

export default memo(SidebarItem);
