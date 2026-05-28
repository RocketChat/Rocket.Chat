import { IconButton, SidebarV2Item, SidebarV2ItemAvatarWrapper, SidebarV2ItemMenu, SidebarV2ItemTitle } from '@rocket.chat/fuselage';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { memo } from 'react';

import { useDeferredMenuMount } from '../../../../sidebar/Item/useDeferredMenuMount';

type SidebarItemProps = {
	title: ReactNode;
	titleIcon?: ReactNode;
	icon?: ReactNode;
	actions?: ReactNode;
	href?: string;
	unread?: boolean;
	menu?: ReactElement;
	menuOptions?: any;
	selected?: boolean;
	badges?: ReactNode;
	clickable?: boolean;
	room: SubscriptionWithRoom;
} & Omit<HTMLAttributes<HTMLAnchorElement>, 'is'>;

const SidebarItem = ({ icon, title, actions, unread, menu, badges, room, ...props }: SidebarItemProps) => {
	const { mounted: menuVisibility, requestMount, mountNow } = useDeferredMenuMount();

	return (
		<SidebarV2Item {...props} title={title} onFocus={mountNow} onPointerEnter={requestMount} aria-selected={props.selected}>
			<SidebarV2ItemAvatarWrapper>
				<RoomAvatar size='x20' room={{ ...room, _id: room.rid || room._id, type: room.t }} />
			</SidebarV2ItemAvatarWrapper>
			{icon}
			<SidebarV2ItemTitle unread={unread}>{title}</SidebarV2ItemTitle>
			{badges}
			{actions}
			{menu && (
				<SidebarV2ItemMenu>
					{menuVisibility ? (
						menu
					) : (
						<IconButton tabIndex={-1} aria-hidden mini rcx-sidebar-v2-item__menu icon='kebab' onPointerDown={mountNow} />
					)}
				</SidebarV2ItemMenu>
			)}
		</SidebarV2Item>
	);
};

export default memo(SidebarItem);
